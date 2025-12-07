"""Claude Agent for CRM operations."""

import anthropic
import structlog
from typing import AsyncGenerator

from app.config import get_settings
from app.tools import TOOLS, execute_tool, extract_domain_from_email

logger = structlog.get_logger()

settings = get_settings()

# Initialize Anthropic client
client = anthropic.Anthropic(api_key=settings.anthropic_api_key)


SYSTEM_PROMPT = """You are a CRM data assistant that helps analyze incoming emails and maintain data quality.

When analyzing an email, your job is to:

1. **Identify the sender**: Search for existing contacts by email and name
2. **Check for duplicates**: If a contact exists, look for potential duplicates (same person with multiple records)
3. **Suggest enrichments**: Extract useful information from the email that could enrich the contact/company record
4. **Match companies**: If the sender's email domain matches a company, suggest linking them

## Duplicate Detection Guidelines
- HIGH confidence (0.9+): Exact email match, or exact name + same company
- MEDIUM confidence (0.7-0.9): Fuzzy name match + same domain, or similar emails
- LOW confidence (0.5-0.7): Similar names only, needs human review

## Enrichment Guidelines
Look for these in email signatures and body:
- Job title / role
- Phone numbers
- Company name
- LinkedIn profile
- Physical address
- Website

## Important Rules
- ALWAYS check spam status before processing
- NEVER create suggestions for spam emails
- Be conservative - only create suggestions when confident
- Provide clear reasoning for every suggestion
- For duplicates, always include both contact records in suggestion_data

## Output Format
After analysis, summarize what you found and what suggestions you created.
"""


class CRMAgent:
    """Agent for analyzing emails and managing CRM data."""

    def __init__(self):
        self.model = settings.agent_model
        self.max_tokens = settings.agent_max_tokens

    async def analyze_email(self, email_data: dict) -> dict:
        """
        Analyze an incoming email for CRM suggestions.

        Returns:
            dict with analysis results and created suggestions
        """
        logger.info("analyzing_email", email_id=email_data.get("id"), from_email=email_data.get("from_email"))

        from_email = email_data.get("from_email", "")
        from_name = email_data.get("from_name", "")
        domain = extract_domain_from_email(from_email)

        # Build the analysis prompt
        user_message = f"""Analyze this incoming email and create appropriate suggestions:

**From:** {from_name} <{from_email}>
**Subject:** {email_data.get("subject", "(no subject)")}
**Date:** {email_data.get("date", "unknown")}

**Email Content:**
{email_data.get("body_text") or email_data.get("snippet") or "(no content)"}

---

Please:
1. First check if this email/domain is spam
2. Search for the sender by email
3. If found, check for potential duplicates
4. Look for enrichment opportunities in the email signature/content
5. Check if the domain matches any company
6. Create suggestions for any findings

Use the source_email_id "{email_data.get("id")}" when creating suggestions.
"""

        messages = [{"role": "user", "content": user_message}]
        suggestions_created = []
        contact_found = False
        contact_id = None

        try:
            # Run the agent loop
            response = client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                system=SYSTEM_PROMPT,
                tools=TOOLS,
                messages=messages,
            )

            loop_count = 0
            max_loops = 15

            while response.stop_reason == "tool_use" and loop_count < max_loops:
                loop_count += 1
                logger.debug("agent_tool_loop", loop=loop_count)

                # Process all tool uses
                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        logger.info("tool_use", tool=block.name, input=block.input)

                        # Execute the tool
                        result = await execute_tool(block.name, block.input)

                        # Track findings
                        if block.name == "search_contact_by_email" and result.get("found"):
                            contact_found = True
                            contact_id = result["contact"].get("contact_id")

                        if block.name == "create_suggestion" and result.get("created"):
                            suggestions_created.append(result["suggestion_id"])

                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": str(result),
                        })

                # Continue the conversation
                messages.append({"role": "assistant", "content": response.content})
                messages.append({"role": "user", "content": tool_results})

                response = client.messages.create(
                    model=self.model,
                    max_tokens=self.max_tokens,
                    system=SYSTEM_PROMPT,
                    tools=TOOLS,
                    messages=messages,
                )

            # Extract final text response
            final_message = ""
            for block in response.content:
                if hasattr(block, "text"):
                    final_message += block.text

            logger.info(
                "email_analysis_complete",
                email_id=email_data.get("id"),
                contact_found=contact_found,
                suggestions_created=len(suggestions_created),
                loops=loop_count
            )

            return {
                "success": True,
                "email_id": email_data.get("id"),
                "contact_found": contact_found,
                "contact_id": contact_id,
                "suggestions_created": len(suggestions_created),
                "suggestion_ids": suggestions_created,
                "message": final_message,
            }

        except Exception as e:
            logger.error("email_analysis_error", error=str(e), email_id=email_data.get("id"))
            return {
                "success": False,
                "email_id": email_data.get("id"),
                "contact_found": False,
                "suggestions_created": 0,
                "message": f"Error analyzing email: {str(e)}",
            }

    async def run_duplicate_scan(self, limit: int = 100) -> dict:
        """
        Scan contacts for potential duplicates.

        Returns:
            dict with scan results
        """
        logger.info("starting_duplicate_scan", limit=limit)

        from app.database import db

        contacts = await db.get_all_contacts_for_dedup(limit)
        logger.info("loaded_contacts_for_scan", count=len(contacts))

        suggestions_created = 0
        scanned = 0

        for contact in contacts:
            scanned += 1
            contact_id = contact.get("contact_id")

            # Find potential duplicates
            duplicates = await db.find_potential_duplicates(contact_id)

            if not duplicates:
                continue

            # Get full contact details for analysis
            full_contact = await db.get_contact_by_id(contact_id)
            if not full_contact:
                continue

            for dupe in duplicates:
                dupe_id = dupe.get("contact_id")
                match_type = dupe.get("match_type")

                # Skip if already have a suggestion for this pair
                exists = await db.check_existing_suggestion("duplicate", contact_id, dupe_id)
                if exists:
                    continue

                # Also check reverse direction
                exists_reverse = await db.check_existing_suggestion("duplicate", dupe_id, contact_id)
                if exists_reverse:
                    continue

                # Get duplicate contact details
                dupe_contact = await db.get_contact_by_id(dupe_id)
                if not dupe_contact:
                    continue

                # Calculate confidence based on match type
                if match_type == "exact_email":
                    confidence = 0.95
                    priority = "high"
                    short_reason = "Same email"
                elif match_type == "exact_name":
                    confidence = 0.75
                    priority = "medium"
                    short_reason = "Same name"
                elif match_type == "mobile":
                    confidence = 0.85
                    priority = "high"
                    short_reason = "Same phone"
                else:
                    confidence = 0.6
                    priority = "low"
                    short_reason = "Similar info"

                # Create suggestion
                suggestion = {
                    "suggestion_type": "duplicate",
                    "entity_type": "contact",
                    "primary_entity_id": contact_id,
                    "secondary_entity_id": dupe_id,
                    "confidence_score": confidence,
                    "priority": priority,
                    "suggestion_data": {
                        "match_type": match_type,
                        "match_value": dupe.get("match_value"),
                        "short_reason": short_reason,
                        "primary_contact": {
                            "contact_id": contact_id,
                            "first_name": full_contact.get("first_name"),
                            "last_name": full_contact.get("last_name"),
                            "emails": [e.get("email") for e in full_contact.get("contact_emails", [])],
                            "mobiles": [m.get("mobile") for m in full_contact.get("contact_mobiles", [])],
                        },
                        "duplicate_contact": {
                            "contact_id": dupe_id,
                            "first_name": dupe_contact.get("first_name"),
                            "last_name": dupe_contact.get("last_name"),
                            "emails": [e.get("email") for e in dupe_contact.get("contact_emails", [])],
                            "mobiles": [m.get("mobile") for m in dupe_contact.get("contact_mobiles", [])],
                        },
                    },
                    "agent_reasoning": f"Found {match_type} match: {dupe.get('match_value')}",
                    "source_description": "Scheduled duplicate scan",
                }

                result = await db.create_suggestion(suggestion)
                if result:
                    suggestions_created += 1
                    await db.log_action({
                        "action_type": "suggestion_created",
                        "suggestion_id": result["id"],
                        "entity_type": "contact",
                        "entity_id": contact_id,
                        "triggered_by": "system",
                    })

        logger.info("duplicate_scan_complete", scanned=scanned, suggestions=suggestions_created)

        return {
            "success": True,
            "scanned": scanned,
            "suggestions_created": suggestions_created,
            "message": f"Scanned {scanned} contacts, created {suggestions_created} duplicate suggestions",
        }


# Singleton instance
agent = CRMAgent()
