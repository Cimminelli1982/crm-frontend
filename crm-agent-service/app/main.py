"""FastAPI application for CRM Agent Service."""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
import structlog
import httpx
import os

from app.config import get_settings
from app.models import (
    AnalyzeEmailRequest,
    AnalyzeEmailResponse,
    RunCleanupRequest,
    CleanupResponse,
    SuggestionActionRequest,
    SuggestionResponse,
    HealthResponse,
)
from app.agent import agent
from app.database import db
from app.audit import auditor, AuditResult
from app.actions import Action, execute_action, audit_to_actions

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
)

logger = structlog.get_logger()
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    logger.info("starting_crm_agent_service", environment=settings.environment)
    yield
    logger.info("shutting_down_crm_agent_service")


app = FastAPI(
    title="CRM Agent Service",
    description="Claude-powered agent for CRM data management - duplicates, enrichment, and cleanup",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== HEALTH ENDPOINTS ====================

@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint - health check."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow(),
    )


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow(),
    )


# ==================== AGENT ENDPOINTS ====================

@app.post("/analyze-email", response_model=AnalyzeEmailResponse)
async def analyze_email(request: AnalyzeEmailRequest, background_tasks: BackgroundTasks):
    """
    Analyze an incoming email for CRM suggestions.

    Called by Command Center backend when new emails arrive.
    Creates suggestions for duplicates, enrichment, and company matching.
    """
    logger.info("analyze_email_request", email_id=str(request.email.id))

    try:
        # Convert to dict for agent
        email_data = {
            "id": str(request.email.id),
            "fastmail_id": request.email.fastmail_id,
            "from_email": request.email.from_email,
            "from_name": request.email.from_name,
            "to_recipients": request.email.to_recipients,
            "cc_recipients": request.email.cc_recipients,
            "subject": request.email.subject,
            "body_text": request.email.body_text,
            "snippet": request.email.snippet,
            "date": str(request.email.date),
        }

        result = await agent.analyze_email(email_data)

        # Fetch created suggestions
        suggestions = []
        if result.get("suggestion_ids"):
            for sid in result["suggestion_ids"]:
                # In a real impl, we'd batch this query
                pass  # Suggestions are logged, can be fetched separately

        return AnalyzeEmailResponse(
            success=result["success"],
            email_id=request.email.id,
            contact_found=result["contact_found"],
            contact_id=result.get("contact_id"),
            suggestions_created=result["suggestions_created"],
            suggestions=suggestions,
            message=result["message"],
        )

    except Exception as e:
        logger.error("analyze_email_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/run-cleanup", response_model=CleanupResponse)
async def run_cleanup(request: RunCleanupRequest = None):
    """
    Run duplicate/cleanup scan on CRM data.

    Can be triggered manually or via scheduled job.
    """
    limit = request.limit if request else 100
    entity_type = request.entity_type if request else "contact"

    logger.info("run_cleanup_request", entity_type=entity_type, limit=limit)

    try:
        if entity_type == "contact":
            result = await agent.run_duplicate_scan(limit=limit)
        else:
            # TODO: Implement company and deal cleanup
            return CleanupResponse(
                success=False,
                scanned=0,
                suggestions_created=0,
                message=f"Cleanup for {entity_type} not yet implemented",
            )

        return CleanupResponse(
            success=result["success"],
            scanned=result["scanned"],
            suggestions_created=result["suggestions_created"],
            message=result["message"],
        )

    except Exception as e:
        logger.error("run_cleanup_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ==================== SUGGESTIONS ENDPOINTS ====================

@app.get("/suggestions")
async def get_suggestions(
    status: str = "pending",
    suggestion_type: str = None,
    entity_type: str = None,
    limit: int = 50,
):
    """Get suggestions, optionally filtered."""
    logger.info("get_suggestions_request", status=status, type=suggestion_type, limit=limit)

    try:
        query = db.client.table("agent_suggestions").select("*")

        if status:
            query = query.eq("status", status)
        if suggestion_type:
            query = query.eq("suggestion_type", suggestion_type)
        if entity_type:
            query = query.eq("entity_type", entity_type)

        query = query.order("created_at", desc=True).limit(limit)
        result = query.execute()

        return {
            "suggestions": result.data or [],
            "count": len(result.data or []),
        }

    except Exception as e:
        logger.error("get_suggestions_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/suggestions/{suggestion_id}")
async def get_suggestion(suggestion_id: str):
    """Get a single suggestion by ID."""
    try:
        result = db.client.table("agent_suggestions").select("*").eq(
            "id", suggestion_id
        ).single().execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Suggestion not found")

        return result.data

    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_suggestion_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/suggestions/{suggestion_id}/action")
async def suggestion_action(suggestion_id: str, request: SuggestionActionRequest):
    """Accept or reject a suggestion."""
    logger.info("suggestion_action", suggestion_id=suggestion_id, action=request.action)

    try:
        # Get current suggestion
        current = db.client.table("agent_suggestions").select("*").eq(
            "id", suggestion_id
        ).single().execute()

        if not current.data:
            raise HTTPException(status_code=404, detail="Suggestion not found")

        if current.data["status"] != "pending":
            raise HTTPException(status_code=400, detail="Suggestion already processed")

        # Update status
        new_status = "accepted" if request.action == "accept" else "rejected"
        result = await db.update_suggestion_status(
            suggestion_id,
            new_status,
            reviewed_by="user",
            notes=request.notes,
        )

        # Log the action
        await db.log_action({
            "action_type": f"suggestion_{new_status}",
            "suggestion_id": suggestion_id,
            "entity_type": current.data["entity_type"],
            "entity_id": current.data.get("primary_entity_id"),
            "before_data": current.data,
            "after_data": {"status": new_status, "notes": request.notes},
            "triggered_by": "user",
        })

        # If accepted, we might want to execute the action
        # For now, we just mark it and let the user/UI handle execution
        # In future: auto-execute merges, enrichments, etc.

        return {
            "success": True,
            "suggestion_id": suggestion_id,
            "new_status": new_status,
            "message": f"Suggestion {new_status}",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("suggestion_action_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ==================== STATS ENDPOINTS ====================

@app.get("/stats")
async def get_stats():
    """Get agent statistics."""
    try:
        # Count suggestions by status
        pending = db.client.table("agent_suggestions").select(
            "id", count="exact"
        ).eq("status", "pending").execute()

        accepted = db.client.table("agent_suggestions").select(
            "id", count="exact"
        ).eq("status", "accepted").execute()

        rejected = db.client.table("agent_suggestions").select(
            "id", count="exact"
        ).eq("status", "rejected").execute()

        # Recent actions
        recent_actions = db.client.table("agent_action_log").select("*").order(
            "created_at", desc=True
        ).limit(10).execute()

        return {
            "suggestions": {
                "pending": pending.count or 0,
                "accepted": accepted.count or 0,
                "rejected": rejected.count or 0,
            },
            "recent_actions": recent_actions.data or [],
        }

    except Exception as e:
        logger.error("get_stats_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ==================== AI SUGGESTION ENDPOINTS ====================

# -------------------- Apollo Integration --------------------

async def search_apollo_person(first_name: str, last_name: str, email: str = None, company: str = None):
    """
    Search for a person on Apollo to get LinkedIn URL and photo.
    Returns dict with linkedin_url, photo_url, or None if not found.
    """
    api_key = os.getenv("APOLLO_API_KEY")
    print(f"[APOLLO] Search starting: {first_name} {last_name}, email={email}, api_key_present={bool(api_key)}", flush=True)

    if not api_key:
        logger.warning("APOLLO_API_KEY not configured")
        return None

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Try People Match first if we have email (more accurate)
            if email:
                print(f"[APOLLO] People Match: searching for {email}", flush=True)
                response = await client.post(
                    "https://api.apollo.io/api/v1/people/match",
                    json={
                        "api_key": api_key,
                        "email": email,
                        "first_name": first_name,
                        "last_name": last_name,
                        "organization_name": company
                    }
                )
                print(f"[APOLLO] People Match response: status={response.status_code}", flush=True)
                if response.status_code == 200:
                    data = response.json()
                    person = data.get("person")
                    print(f"[APOLLO] People Match person found: {bool(person)}", flush=True)
                    if person:
                        linkedin = person.get("linkedin_url")
                        photo = person.get("photo_url")
                        print(f"[APOLLO] Data: linkedin={linkedin}, photo={bool(photo)}", flush=True)
                        # Get organization data
                        org = person.get("organization", {}) or {}
                        org_name = org.get("name")
                        org_website = org.get("website_url")
                        # Extract domain from website
                        org_domain = None
                        if org_website:
                            try:
                                from urllib.parse import urlparse
                                parsed = urlparse(org_website)
                                org_domain = parsed.netloc.replace("www.", "")
                            except:
                                pass

                        if linkedin or photo or org_name:
                            return {
                                "linkedin_url": linkedin,
                                "photo_url": photo,
                                "title": person.get("title"),
                                "organization_name": org_name,
                                "organization_domain": org_domain,
                                "organization_website": org_website,
                                "confidence": "high"
                            }
                else:
                    logger.warning(f"Apollo People Match failed: {response.status_code} - {response.text[:200]}")

            # Fallback to People Search
            logger.info(f"Apollo People Search: searching for {first_name} {last_name}")
            search_payload = {
                "api_key": api_key,
                "q_person_name": f"{first_name} {last_name}",
                "page": 1,
                "per_page": 1
            }
            if company:
                search_payload["q_organization_name"] = company

            response = await client.post(
                "https://api.apollo.io/api/v1/mixed_people/search",
                json=search_payload
            )
            logger.info(f"Apollo People Search response: status={response.status_code}")

            if response.status_code == 200:
                data = response.json()
                people = data.get("people", [])
                logger.info(f"Apollo People Search results: {len(people)} people found")
                if people:
                    person = people[0]
                    # Get organization data
                    org = person.get("organization", {}) or {}
                    org_name = org.get("name")
                    org_website = org.get("website_url")
                    org_domain = None
                    if org_website:
                        try:
                            from urllib.parse import urlparse
                            parsed = urlparse(org_website)
                            org_domain = parsed.netloc.replace("www.", "")
                        except:
                            pass
                    return {
                        "linkedin_url": person.get("linkedin_url"),
                        "photo_url": person.get("photo_url"),
                        "title": person.get("title"),
                        "organization_name": org_name,
                        "organization_domain": org_domain,
                        "organization_website": org_website,
                        "confidence": "medium"
                    }

    except Exception as e:
        logger.error(f"Apollo search error: {e}", exc_info=True)

    logger.info("Apollo search: no results found")
    return None


async def get_all_tags():
    """Get all tags from database for Claude to suggest from."""
    try:
        result = db.client.table("tags").select("tag_id, name").execute()
        return result.data or []
    except Exception as e:
        logger.error(f"Error fetching tags: {e}")
        return []


async def search_company_in_db(name: str = None, domain: str = None):
    """
    Search for a company in the database by domain or name.
    Returns matched company or None.
    """
    try:
        # First try by domain (most accurate)
        if domain:
            domain_result = db.client.table("company_domains").select(
                "company_id, domain, companies(company_id, name, category, website)"
            ).ilike("domain", domain).limit(1).execute()

            if domain_result.data and len(domain_result.data) > 0:
                match = domain_result.data[0]
                company = match.get("companies", {})
                if company:
                    logger.info(f"Company found by domain: {company.get('name')}")
                    return {
                        "company_id": company.get("company_id"),
                        "name": company.get("name"),
                        "category": company.get("category"),
                        "website": company.get("website"),
                        "matched_by": "domain",
                        "matched_domain": domain
                    }

        # Fallback: search by name
        if name:
            name_result = db.client.table("companies").select(
                "company_id, name, category, website"
            ).ilike("name", f"%{name}%").limit(5).execute()

            if name_result.data and len(name_result.data) > 0:
                # Try exact match first
                for company in name_result.data:
                    if company.get("name", "").lower() == name.lower():
                        logger.info(f"Company found by exact name: {company.get('name')}")
                        return {
                            "company_id": company.get("company_id"),
                            "name": company.get("name"),
                            "category": company.get("category"),
                            "website": company.get("website"),
                            "matched_by": "exact_name"
                        }

                # Return first partial match
                company = name_result.data[0]
                logger.info(f"Company found by partial name: {company.get('name')}")
                return {
                    "company_id": company.get("company_id"),
                    "name": company.get("name"),
                    "category": company.get("category"),
                    "website": company.get("website"),
                    "matched_by": "partial_name"
                }

        logger.info(f"No company found for name={name}, domain={domain}")
        return None

    except Exception as e:
        logger.error(f"Error searching company: {e}")
        return None


def parse_name_from_email(email: str) -> tuple:
    """Parse first/last name from email address like john.smith@company.com -> (John, Smith)"""
    if not email or '@' not in email:
        return None, None
    local_part = email.split('@')[0]
    # Try common separators: . _ -
    for sep in ['.', '_', '-']:
        if sep in local_part:
            parts = local_part.split(sep)
            if len(parts) >= 2:
                first = parts[0].capitalize()
                last = parts[-1].capitalize()
                return first, last
    # Single word - could be first name
    return local_part.capitalize(), None


@app.post("/suggest-contact-profile")
async def suggest_contact_profile(request: dict):
    """
    Generate AI suggestions for contact profile based on email content.
    Returns ALL suggested fields: name, job title, company, phones, city, category, description.
    Works with or without email body - Apollo enrichment always runs.
    """
    logger.info("suggest_contact_profile_request", from_email=request.get("from_email"))

    try:
        from_name = request.get("from_name", "")
        from_email = request.get("from_email", "")
        subject = request.get("subject", "")
        body_text = request.get("body_text", "")[:5000]  # Increased limit for signature extraction

        # Manual names provided by user (for re-analyze with user input)
        manual_first_name = request.get("manual_first_name", "").strip()
        manual_last_name = request.get("manual_last_name", "").strip()

        if manual_first_name or manual_last_name:
            logger.info(f"Manual names provided: {manual_first_name} {manual_last_name}")

        # Category options from the CRM
        category_options = [
            "Professional Investor", "Founder", "Manager", "Advisor",
            "Friend and Family", "Team", "Supplier", "Media",
            "Student", "Institution", "Other"
        ]

        # Initialize result - will be populated by Claude or fallback
        result = {}

        # If we have email body, use Claude for full analysis
        has_content = bool(body_text.strip() or subject.strip())

        import anthropic
        import json as json_lib

        if has_content:
            prompt = f"""You are analyzing an email thread to extract contact information for a CRM.

The email address being added is: {from_email}
The name from email header is: {from_name}

Your task:
1. Find the email signature block belonging to THIS SPECIFIC person ({from_email}), not other people in the thread
2. Extract ALL available information from their signature
3. Suggest appropriate category and description

IMPORTANT:
- The email thread may contain multiple signatures from different people - ONLY extract data for {from_email}
- Phone numbers often appear as "M." (mobile), "T." (telephone), "Cell", "Tel", etc.
- Company name is usually in the signature block, often with address
- City can be extracted from address in signature (look for city names before country/postal codes)
- LinkedIn URLs sometimes appear in signatures

Email Subject: {subject}

Email Body:
{body_text}

Respond ONLY with valid JSON in this exact format (use null for fields you cannot find):
{{
  "first_name": {{"value": "FirstName", "confidence": "high|medium|low"}},
  "last_name": {{"value": "LastName", "confidence": "high|medium|low"}},
  "job_title": {{"value": "Job Title", "confidence": "high|medium|low"}},
  "company": {{
    "name": "Company Name",
    "domain": "company.com",
    "confidence": "high|medium|low"
  }},
  "phones": [
    {{"value": "+1234567890", "type": "mobile|office|fax", "confidence": "high|medium|low"}}
  ],
  "city": {{"value": "City Name", "confidence": "high|medium|low"}},
  "category": {{"value": "CategoryFromList", "confidence": "high|medium|low", "alternatives": ["OtherPossible"]}},
  "description": {{"value": "2-3 sentence professional description", "confidence": "medium"}},
  "linkedin": {{"value": "linkedin.com/in/username", "confidence": "high|medium|low"}},
  "signature_found": true,
  "signature_text": "Raw signature text extracted"
}}

Category must be one of: {', '.join(category_options)}

For confidence:
- "high": clearly visible in signature or email header
- "medium": inferred from context or partial match
- "low": guessed or uncertain"""

            # Use the agent's Claude client
            client = anthropic.Anthropic()

            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )

            # Parse JSON response
            response_text = response.content[0].text.strip()

            # Handle potential markdown code blocks
            if response_text.startswith("```"):
                lines = response_text.split("\n")
                json_lines = []
                in_json = False
                for line in lines:
                    if line.startswith("```") and not in_json:
                        in_json = True
                        continue
                    elif line.startswith("```") and in_json:
                        break
                    elif in_json:
                        json_lines.append(line)
                response_text = "\n".join(json_lines)

            result = json_lib.loads(response_text)
        else:
            # No email content - create basic result from name parsing
            logger.info("No email content, using name parsing and Apollo enrichment only")

            # Try to parse name from from_name header or email address
            first_name = None
            last_name = None

            if from_name:
                # Split the name
                parts = from_name.strip().split()
                if len(parts) >= 2:
                    first_name = parts[0]
                    last_name = ' '.join(parts[1:])
                elif len(parts) == 1:
                    first_name = parts[0]

            # Fallback: parse from email address
            if not first_name:
                first_name, last_name = parse_name_from_email(from_email)

            # Extract domain from email for company hint
            email_domain = from_email.split('@')[1] if '@' in from_email else None

            result = {
                "first_name": {"value": first_name, "confidence": "medium"} if first_name else None,
                "last_name": {"value": last_name, "confidence": "medium"} if last_name else None,
                "signature_found": False
            }

            # Add company domain hint
            if email_domain and email_domain not in ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com']:
                result["company"] = {
                    "domain": email_domain,
                    "confidence": "low"
                }

        # -------------------- Apollo Enrichment --------------------
        # Call Apollo to get LinkedIn URL and photo
        # Prefer manual names (from user input) over parsed names
        first_name_val = manual_first_name or (result.get("first_name", {}).get("value", "") if isinstance(result.get("first_name"), dict) else "")
        last_name_val = manual_last_name or (result.get("last_name", {}).get("value", "") if isinstance(result.get("last_name"), dict) else "")
        company_name = result.get("company", {}).get("name", "") if isinstance(result.get("company"), dict) else ""

        # If manual names were provided, also update the result
        if manual_first_name:
            result["first_name"] = {"value": manual_first_name, "confidence": "high", "source": "user_input"}
        if manual_last_name:
            result["last_name"] = {"value": manual_last_name, "confidence": "high", "source": "user_input"}

        apollo_data = None
        if first_name_val and last_name_val:
            logger.info(f"Apollo search with: {first_name_val} {last_name_val}")
            apollo_data = await search_apollo_person(
                first_name=first_name_val,
                last_name=last_name_val,
                email=from_email,
                company=company_name
            )
            logger.info("apollo_search_result", found=apollo_data is not None)
        elif first_name_val or last_name_val:
            # Try with partial name (first name only or last name only)
            logger.info(f"Apollo search with partial name: {first_name_val or last_name_val}")
            apollo_data = await search_apollo_person(
                first_name=first_name_val or "",
                last_name=last_name_val or "",
                email=from_email,
                company=company_name
            )
            logger.info("apollo_search_result (partial)", found=apollo_data is not None)

        # Add Apollo data to result
        if apollo_data:
            if apollo_data.get("linkedin_url"):
                result["linkedin_url"] = {
                    "value": apollo_data["linkedin_url"],
                    "confidence": apollo_data["confidence"],
                    "source": "apollo"
                }
            if apollo_data.get("photo_url"):
                result["photo_url"] = {
                    "value": apollo_data["photo_url"],
                    "confidence": apollo_data["confidence"],
                    "source": "apollo"
                }
            if apollo_data.get("title"):
                result["apollo_job_title"] = {
                    "value": apollo_data["title"],
                    "confidence": apollo_data["confidence"],
                    "source": "apollo"
                }

            # Search for Apollo company in our database
            apollo_org_name = apollo_data.get("organization_name")
            apollo_org_domain = apollo_data.get("organization_domain")

            if apollo_org_name or apollo_org_domain:
                db_company = await search_company_in_db(
                    name=apollo_org_name,
                    domain=apollo_org_domain
                )

                if db_company:
                    # Found matching company in DB
                    result["apollo_company"] = {
                        "company_id": db_company["company_id"],
                        "name": db_company["name"],
                        "category": db_company.get("category"),
                        "matched_by": db_company["matched_by"],
                        "apollo_name": apollo_org_name,
                        "apollo_domain": apollo_org_domain,
                        "confidence": apollo_data["confidence"],
                        "source": "apollo",
                        "exists_in_db": True
                    }
                else:
                    # Company not found - suggest creating new
                    result["apollo_company"] = {
                        "name": apollo_org_name,
                        "domain": apollo_org_domain,
                        "website": apollo_data.get("organization_website"),
                        "confidence": apollo_data["confidence"],
                        "source": "apollo",
                        "exists_in_db": False
                    }

        # -------------------- Tags Suggestion --------------------
        # Get all tags and ask Claude to suggest relevant ones
        all_tags = await get_all_tags()
        suggested_tags = []

        if all_tags:
            tag_names = [t["name"] for t in all_tags]
            job_title_val = result.get("job_title", {}).get("value", "") if isinstance(result.get("job_title"), dict) else ""
            category_val = result.get("category", {}).get("value", "") if isinstance(result.get("category"), dict) else ""

            tags_prompt = f"""Given this contact information, suggest the most relevant tags from the available list.

Contact: {first_name_val} {last_name_val}
Job Title: {job_title_val}
Company: {company_name}
Category: {category_val}

Email subject: {subject}

Available tags: {', '.join(tag_names)}

Return ONLY a JSON array of tag names that apply to this contact (maximum 5 tags).
Example: ["Tag1", "Tag2"]

Rules:
- Only include tags from the available list above
- Return empty array [] if no tags clearly apply
- Be selective - only suggest tags that clearly match
- Do not make up new tags"""

            try:
                tags_response = client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=200,
                    messages=[{"role": "user", "content": tags_prompt}]
                )
                tags_text = tags_response.content[0].text.strip()

                # Handle markdown code blocks
                if tags_text.startswith("```"):
                    lines = tags_text.split("\n")
                    json_lines = []
                    in_json = False
                    for line in lines:
                        if line.startswith("```") and not in_json:
                            in_json = True
                            continue
                        elif line.startswith("```") and in_json:
                            break
                        elif in_json:
                            json_lines.append(line)
                    tags_text = "\n".join(json_lines)

                suggested_tag_names = json_lib.loads(tags_text)

                # Match tag names to tag objects with IDs
                for tag_name in suggested_tag_names:
                    for tag in all_tags:
                        if tag["name"].lower() == tag_name.lower():
                            suggested_tags.append({
                                "tag_id": tag["tag_id"],
                                "name": tag["name"]
                            })
                            break

                logger.info("tags_suggestion_result", count=len(suggested_tags))
            except Exception as tags_error:
                logger.error(f"Tags suggestion error: {tags_error}")

        result["suggested_tags"] = suggested_tags

        return {
            "success": True,
            "suggestions": result,
            # Keep backwards compatibility
            "suggested_description": result.get("description", {}).get("value", "") if isinstance(result.get("description"), dict) else "",
            "suggested_category": result.get("category", {}).get("value", "") if isinstance(result.get("category"), dict) else "",
        }

    except Exception as e:
        logger.error("suggest_contact_profile_error", error=str(e))
        return {
            "success": False,
            "suggestions": None,
            "suggested_description": "",
            "suggested_category": "",
            "error": str(e)
        }


# ==================== NEW AUDIT ENDPOINTS ====================

@app.post("/audit-email")
async def audit_email(request: AnalyzeEmailRequest):
    """
    Perform complete audit of a contact based on an email.

    Returns structured audit with executable actions.
    """
    logger.info("audit_email_request", email_id=str(request.email.id))

    try:
        email_data = {
            "id": str(request.email.id),
            "fastmail_id": request.email.fastmail_id,
            "from_email": request.email.from_email,
            "from_name": request.email.from_name,
            "to_recipients": request.email.to_recipients,
            "cc_recipients": request.email.cc_recipients,
            "subject": request.email.subject,
            "body_text": request.email.body_text,
            "snippet": request.email.snippet,
            "date": str(request.email.date) if request.email.date else None,
        }

        # Perform audit
        audit_result = await auditor.audit_from_email(email_data)

        # Convert to actions
        actions = audit_to_actions(audit_result.dict())

        return {
            "success": True,
            "audit": audit_result.dict(),
            "actions": [a.dict() for a in actions],
            "action_count": len(actions),
        }

    except Exception as e:
        logger.error("audit_email_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/execute-action")
async def execute_single_action(action_data: dict):
    """
    Execute a single action from an audit.

    Takes action data and executes it.
    """
    logger.info("execute_action_request", action_type=action_data.get("type"))

    try:
        # Parse action
        action = Action(**action_data)

        # Execute
        result = await execute_action(action)

        # Log the action (in separate try-catch so logging failures don't break the action)
        try:
            # Determine entity_type and entity_id based on action type
            if action.type.value in ['merge_contacts', 'delete_contact']:
                entity_type = "contact"
                entity_id = action.merge_into_id or action.delete_id or action.contact_id
            elif action.type.value in ['merge_companies', 'fix_company_domain']:
                entity_type = "company"
                entity_id = action.company_id or action.merge_into_id
            elif action.contact_id:
                entity_type = "contact"
                entity_id = action.contact_id
            elif action.company_id:
                entity_type = "company"
                entity_id = action.company_id
            else:
                entity_type = "contact"
                entity_id = None

            await db.log_action({
                "action_type": action.type.value,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "after_data": action.dict(),
                "triggered_by": "user",
            })
        except Exception as log_error:
            logger.warning("action_log_failed", error=str(log_error), action_type=action.type.value)

        return {
            "success": result.success,
            "message": result.message,
            "data": result.data,
        }

    except Exception as e:
        logger.error("execute_action_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/execute-actions")
async def execute_multiple_actions(actions_data: list[dict]):
    """
    Execute multiple actions from an audit.

    Takes list of action data and executes them in order.
    """
    logger.info("execute_actions_request", count=len(actions_data))

    results = []
    for action_data in actions_data:
        try:
            action = Action(**action_data)
            result = await execute_action(action)

            # Log (in separate try-catch so logging failures don't break the action)
            try:
                # Determine entity_type and entity_id based on action type
                if action.type.value in ['merge_contacts', 'delete_contact']:
                    entity_type = "contact"
                    entity_id = action.merge_into_id or action.delete_id or action.contact_id
                elif action.type.value in ['merge_companies', 'fix_company_domain']:
                    entity_type = "company"
                    entity_id = action.company_id or action.merge_into_id
                elif action.contact_id:
                    entity_type = "contact"
                    entity_id = action.contact_id
                elif action.company_id:
                    entity_type = "company"
                    entity_id = action.company_id
                else:
                    entity_type = "contact"
                    entity_id = None

                await db.log_action({
                    "action_type": action.type.value,
                    "entity_type": entity_type,
                    "entity_id": entity_id,
                    "after_data": action.dict(),
                    "triggered_by": "user",
                })
            except Exception as log_error:
                logger.warning("action_log_failed", error=str(log_error), action_type=action.type.value)

            results.append({
                "action": action.description,
                "success": result.success,
                "message": result.message,
            })

        except Exception as e:
            results.append({
                "action": action_data.get("description", "Unknown"),
                "success": False,
                "message": str(e),
            })

    successful = sum(1 for r in results if r["success"])
    return {
        "success": successful == len(results),
        "total": len(results),
        "successful": successful,
        "failed": len(results) - successful,
        "results": results,
    }


@app.get("/audit-contact/{contact_id}")
async def audit_contact(contact_id: str):
    """
    Perform audit on a specific contact by ID.

    Useful for direct contact cleanup.
    """
    logger.info("audit_contact_request", contact_id=contact_id)

    try:
        # Get contact
        contact = await db.get_contact_by_id(contact_id)
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")

        # Build fake email data for audit
        emails = contact.get("contact_emails", [])
        primary_email = next((e.get("email") for e in emails if e.get("is_primary")), None)
        any_email = emails[0].get("email") if emails else None
        email = primary_email or any_email or ""

        email_data = {
            "id": contact_id,
            "from_email": email,
            "from_name": f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip(),
            "subject": "",
            "body_text": "",
        }

        # Perform audit
        audit_result = await auditor.audit_from_email(email_data)
        actions = audit_to_actions(audit_result.dict())

        return {
            "success": True,
            "audit": audit_result.dict(),
            "actions": [a.dict() for a in actions],
            "action_count": len(actions),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("audit_contact_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ATTACHMENT TEXT EXTRACTION ====================

async def extract_attachment_text(attachment: dict) -> str:
    """Download and extract text from an attachment (PDF)."""
    if not attachment:
        return ""
    file_url = attachment.get("file_url") or attachment.get("permanent_url")
    file_content_b64 = attachment.get("file_content_base64")
    file_type = attachment.get("file_type", "")
    file_name = attachment.get("file_name", "")

    import base64

    content_bytes = None
    if file_content_b64:
        content_bytes = base64.b64decode(file_content_b64)
    elif file_url:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(file_url)
            if resp.status_code == 200:
                content_bytes = resp.content

    if not content_bytes:
        return ""

    if "pdf" in file_type.lower() or file_name.lower().endswith(".pdf"):
        try:
            import fitz  # pymupdf
            doc = fitz.open(stream=content_bytes, filetype="pdf")
            text = "\n".join(page.get_text() for page in doc)
            doc.close()
            return text[:6000]
        except Exception as e:
            logger.error("pdf_extraction_error", error=str(e))
            return ""

    return ""


# ==================== DEAL EXTRACTION ENDPOINT ====================

@app.post("/extract-deal-from-email")
async def extract_deal_from_email(request: dict):
    """
    Extract deal information from an email or WhatsApp conversation for CRM deal creation.

    Uses Claude + Supabase queries to:
    1. Find existing contacts by email or phone
    2. Find existing companies by domain/name
    3. Extract deal info from content
    4. Suggest associations

    Supports both email and WhatsApp sources via source_type field.
    """
    source_type = request.get("source_type", "email")
    logger.info("extract_deal_request", source_type=source_type,
                from_email=request.get("from_email"),
                contact_phone=request.get("contact_phone"))

    try:
        import anthropic
        import json as json_lib

        # Handle both email and WhatsApp sources
        if source_type == "whatsapp":
            contact_phone = request.get("contact_phone", "")
            contact_name = request.get("contact_name", "")
            conversation_text = request.get("conversation_text", "")[:8000]
            message_date = request.get("date", "")
            from_email = ""
            email_domain = None
            subject = f"WhatsApp conversation with {contact_name or contact_phone}"
            body_text = conversation_text
        else:
            from_name = request.get("from_name", "")
            from_email = request.get("from_email", "")
            subject = request.get("subject", "")
            body_text = request.get("body_text", "")[:8000]
            message_date = request.get("date", "")
            contact_phone = ""
            contact_name = from_name
            # Extract domain from email
            email_domain = from_email.split("@")[1] if "@" in from_email else None

        # --- SUPABASE QUERIES: Find existing data ---

        existing_contact = None

        # 1. Find contact by email or phone
        if source_type == "whatsapp" and contact_phone:
            # Search by phone number
            result = db.client.table("contact_mobiles").select(
                "contact_id, mobile, contacts(contact_id, first_name, last_name, job_role, linkedin, category)"
            ).eq("mobile", contact_phone).limit(1).execute()

            if result.data and result.data[0].get("contacts"):
                existing_contact = result.data[0]["contacts"]
                existing_contact["phone"] = contact_phone
                logger.info(f"Found existing contact by phone: {existing_contact.get('first_name')} {existing_contact.get('last_name')}")
        elif from_email:
            result = db.client.table("contact_emails").select(
                "contact_id, email, contacts(contact_id, first_name, last_name, job_role, linkedin, category)"
            ).ilike("email", from_email).limit(1).execute()

            if result.data and result.data[0].get("contacts"):
                existing_contact = result.data[0]["contacts"]
                existing_contact["email"] = from_email
                logger.info(f"Found existing contact: {existing_contact.get('first_name')} {existing_contact.get('last_name')}")

        # 2. Find company by domain (only for email)
        existing_company = None
        if email_domain and email_domain not in ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com']:
            domain_result = db.client.table("company_domains").select(
                "company_id, domain, companies(company_id, name, category, website, description)"
            ).ilike("domain", email_domain).limit(1).execute()

            if domain_result.data and domain_result.data[0].get("companies"):
                existing_company = domain_result.data[0]["companies"]
                existing_company["domain"] = email_domain
                logger.info(f"Found existing company by domain: {existing_company.get('name')}")

        # 3. Get contact's companies if contact exists
        contact_companies = []
        if existing_contact:
            cc_result = db.client.table("contact_companies").select(
                "company_id, relationship, is_primary, companies(company_id, name, category)"
            ).eq("contact_id", existing_contact["contact_id"]).execute()

            if cc_result.data:
                contact_companies = [
                    {**cc.get("companies", {}), "relationship": cc.get("relationship")}
                    for cc in cc_result.data if cc.get("companies")
                ]

        # --- BUILD CONTEXT FOR CLAUDE ---
        contact_identifier = contact_phone if source_type == "whatsapp" else from_email
        db_context = f"""
DATABASE CONTEXT (from Supabase queries):

EXISTING CONTACT (by {"phone " + contact_phone if source_type == "whatsapp" else "email " + from_email}):
{json_lib.dumps(existing_contact, indent=2, default=str) if existing_contact else "None found - will need to create new contact"}

EXISTING COMPANY (by domain {email_domain}):
{json_lib.dumps(existing_company, indent=2, default=str) if existing_company else "None found - may need to create new company (extract from conversation)"}

CONTACT'S LINKED COMPANIES:
{json_lib.dumps(contact_companies, indent=2, default=str) if contact_companies else "None"}
"""

        # --- EXTRACT ATTACHMENT TEXT (if provided) ---
        attachment = request.get("attachment")
        attachment_text = ""
        if attachment:
            logger.info("extracting_attachment_text", file_name=attachment.get("file_name"))
            attachment_text = await extract_attachment_text(attachment)
            if attachment_text:
                logger.info("attachment_text_extracted", length=len(attachment_text))

        attachment_context = ""
        if attachment_text:
            att_name = attachment.get("file_name", "attachment")
            attachment_context = f"""
ATTACHMENT CONTENT ({att_name}):
{attachment_text}
"""

        # --- CLAUDE EXTRACTION ---
        if source_type == "whatsapp":
            prompt = f"""You are extracting deal information from a WhatsApp conversation for a CRM system.

WHATSAPP CONVERSATION:
Contact: {contact_name} ({contact_phone})
Date: {message_date}

Conversation:
{body_text}
{attachment_context}
{db_context}

TASK: Extract information to create a DEAL record with proper associations.
Look for mentions of:
- Company/startup names being discussed
- Investment opportunities or deals
- Fundraising rounds, amounts
- Product/service descriptions

Return JSON:
{{
  "contact": {{
    "use_existing": true/false,
    "existing_contact_id": "uuid if use_existing=true, else null",
    "first_name": "extracted from conversation or name",
    "last_name": "extracted from conversation or name",
    "phone": "{contact_phone}",
    "job_role": "extracted if mentioned or null",
    "linkedin": null,
    "category": "Founder|Professional Investor|Manager|Advisor|Other"
  }},
  "company": {{
    "use_existing": true/false,
    "existing_company_id": "uuid if use_existing=true, else null",
    "name": "company/startup name mentioned",
    "website": "https://... if mentioned or null",
    "domain": "domain if mentioned or null",
    "category": "Startup|Professional Investor|Corporation|SME|Advisory|Other",
    "description": "brief description from conversation"
  }},
  "deal": {{
    "opportunity": "Deal name - usually company/startup name",
    "total_investment": number or null,
    "deal_currency": "EUR|USD|GBP|PLN",
    "category": "Startup|Fund|Real Estate|Private Debt|Private Equity|Other",
    "stage": "Lead",
    "source_category": "Cold Contacting|Introduction",
    "description": "Brief summary of what they're discussing/pitching"
  }},
  "associations": {{
    "contact_is_proposer": true,
    "link_contact_to_company": true,
    "contact_company_relationship": "founder|employee|advisor|investor|other"
  }}
}}

RULES:
- If existing contact found, set use_existing=true and existing_contact_id
- If existing company found, set use_existing=true and existing_company_id
- Extract investment amount: "300k" = 300000, "€2M" = 2000000
- Default currency EUR unless clearly stated otherwise
- stage is always "Lead" for new conversations
- source_category: "Cold Contacting" if cold outreach, "Introduction" if referred
- Parse first_name/last_name from contact_name if provided
- If ATTACHMENT CONTENT is provided, use it as the PRIMARY source of deal information (company name, investment details, descriptions)"""
        else:
            prompt = f"""You are extracting deal information from an email for a CRM system.

EMAIL:
From: {contact_name} <{from_email}>
Subject: {subject}
Date: {message_date}

Body:
{body_text}
{attachment_context}
{db_context}

TASK: Extract information to create a DEAL record with proper associations.

Return JSON:
{{
  "contact": {{
    "use_existing": true/false,
    "existing_contact_id": "uuid if use_existing=true, else null",
    "first_name": "extracted from email",
    "last_name": "extracted from email",
    "email": "{from_email}",
    "job_role": "extracted from signature",
    "linkedin": "extracted from signature or null",
    "category": "Founder|Professional Investor|Manager|Advisor|Other"
  }},
  "company": {{
    "use_existing": true/false,
    "existing_company_id": "uuid if use_existing=true, else null",
    "name": "company name",
    "website": "https://... or null",
    "domain": "domain.com or null",
    "category": "Startup|Professional Investor|Corporation|SME|Advisory|Other",
    "description": "brief description from email"
  }},
  "deal": {{
    "opportunity": "Deal name - usually company name",
    "total_investment": number or null,
    "deal_currency": "EUR|USD|GBP|PLN",
    "category": "Startup|Fund|Real Estate|Private Debt|Private Equity|Other",
    "stage": "Lead",
    "source_category": "Cold Contacting|Introduction",
    "description": "Brief summary of what they're pitching"
  }},
  "associations": {{
    "contact_is_proposer": true,
    "link_contact_to_company": true,
    "contact_company_relationship": "founder|employee|advisor|investor|other"
  }}
}}

RULES:
- If existing contact found, set use_existing=true and existing_contact_id
- If existing company found, set use_existing=true and existing_company_id
- Extract investment amount: "300k" = 300000, "€2M" = 2000000
- Default currency EUR unless clearly stated otherwise
- stage is always "Lead" for new inbound
- source_category: "Cold Contacting" if unsolicited, "Introduction" if referred by someone
- If ATTACHMENT CONTENT is provided, use it as the PRIMARY source of deal information (company name, investment details, descriptions)"""

        client = anthropic.Anthropic()
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )

        response_text = response.content[0].text.strip()

        # Handle markdown code blocks
        if "```" in response_text:
            lines = response_text.split("\n")
            json_lines = []
            in_json = False
            for line in lines:
                if line.startswith("```") and not in_json:
                    in_json = True
                    continue
                elif line.startswith("```") and in_json:
                    break
                elif in_json:
                    json_lines.append(line)
            response_text = "\n".join(json_lines)

        extracted = json_lib.loads(response_text)

        return {
            "success": True,
            "extracted": extracted,
            "existing_contact": existing_contact,
            "existing_company": existing_company,
            "contact_companies": contact_companies
        }

    except Exception as e:
        logger.error("extract_deal_from_email_error", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ==================== WHATSAPP WEBHOOK ENDPOINT ====================

@app.get("/whatsapp-webhook")
async def whatsapp_webhook_verify():
    """Verification endpoint for TimelinesAI webhook setup."""
    return {"status": "ok", "message": "WhatsApp webhook endpoint ready"}


@app.post("/whatsapp-webhook")
async def whatsapp_webhook(request: Request):
    """
    Receive webhook from TimelinesAI and save to command_center_inbox for staging.

    This endpoint receives WhatsApp messages from TimelinesAI and stores them
    in the unified staging table (command_center_inbox) with type='whatsapp'.
    """
    try:
        payload = await request.json()

        logger.info("whatsapp_webhook_received", event_type=payload.get('event_type'))

        # Only process message events, not chat events
        event_type = payload.get('event_type', '')
        if not event_type.startswith('message:'):
            return {"success": True, "skipped": "not a message event"}

        message = payload.get('message', {})
        chat = payload.get('chat', {})
        whatsapp_account = payload.get('whatsapp_account', {})

        if not message:
            return {"success": True, "skipped": "no message data"}

        # Extract contact data based on direction
        direction = message.get('direction', 'received')
        if direction == 'sent':
            contact_phone = message.get('recipient', {}).get('phone') or chat.get('phone')
            contact_name = message.get('recipient', {}).get('full_name') or chat.get('full_name')
        else:
            contact_phone = message.get('sender', {}).get('phone') or chat.get('phone')
            contact_name = message.get('sender', {}).get('full_name') or chat.get('full_name')

        # Split name into first/last
        name_parts = (contact_name or '').strip().split(' ', 1)
        first_name = name_parts[0] if name_parts else None
        last_name = name_parts[1] if len(name_parts) > 1 else None

        # Check spam - for groups check chat_id, for 1-to-1 check phone number
        is_group = chat.get('is_group', False)
        chat_id_str = str(chat.get('chat_id')) if chat.get('chat_id') else None

        if is_group and chat_id_str:
            # For groups: check by chat_id
            spam_record = await db.is_whatsapp_spam(chat_id=chat_id_str)
            if spam_record:
                await db.increment_whatsapp_spam_counter(chat_id=chat_id_str)
                logger.info("whatsapp_spam_blocked_group", chat_id=chat_id_str)
                return {"success": True, "skipped": "spam group"}
        elif contact_phone:
            # For 1-to-1: check by phone number
            spam_record = await db.is_whatsapp_spam(phone_number=contact_phone)
            if spam_record:
                await db.increment_whatsapp_spam_counter(phone_number=contact_phone)
                logger.info("whatsapp_spam_blocked", phone=contact_phone)
                return {"success": True, "skipped": "spam number"}

        # Check if this chat was recently marked as "done" (to prevent sent messages from reappearing)
        if chat_id_str:
            done_record = await db.get_whatsapp_chat_done(chat_id_str)
            if done_record:
                if direction == 'received':
                    # Contact replied! Clear the done record and allow the message
                    await db.delete_whatsapp_chat_done(chat_id_str)
                    logger.info("whatsapp_chat_done_cleared", chat_id=chat_id_str, reason="received_reply")
                elif direction == 'sent':
                    # Sent message - check if it's recent (likely from CRM) or older (from phone)
                    from datetime import datetime, timedelta, timezone
                    done_at = datetime.fromisoformat(done_record['done_at'].replace('Z', '+00:00'))
                    message_timestamp = message.get('timestamp')
                    if message_timestamp:
                        try:
                            msg_time = datetime.fromisoformat(message_timestamp.replace('Z', '+00:00'))
                            # If message is within 5 minutes of done_at, skip inbox but save to CRM
                            if msg_time <= done_at + timedelta(minutes=5):
                                logger.info("whatsapp_sent_skip_inbox", chat_id=chat_id_str,
                                           reason="recent_crm_message", msg_time=str(msg_time), done_at=str(done_at))

                                # Save directly to CRM (interactions) even though we skip inbox
                                try:
                                    # Find chat in CRM
                                    chat_result = db.client.table('chats').select('id').eq(
                                        'external_chat_id', chat_id_str
                                    ).maybeSingle().execute()
                                    crm_chat_id = chat_result.data['id'] if chat_result.data else None

                                    # Find contact by phone
                                    contact_id = None
                                    if contact_phone:
                                        normalized = contact_phone.replace(' ', '').replace('-', '')
                                        mobile_result = db.client.table('contact_mobiles').select(
                                            'contact_id'
                                        ).ilike('mobile', f'%{normalized[-10:]}%').limit(1).execute()
                                        if mobile_result.data:
                                            contact_id = mobile_result.data[0]['contact_id']

                                    # Save interaction
                                    if contact_id:
                                        message_uid = message.get('message_uid')
                                        # Check if interaction already exists
                                        existing = db.client.table('interactions').select('interaction_id').eq(
                                            'external_interaction_id', message_uid
                                        ).maybeSingle().execute()

                                        if not existing.data:
                                            db.client.table('interactions').insert({
                                                'contact_id': contact_id,
                                                'interaction_type': 'whatsapp',
                                                'direction': 'sent',
                                                'interaction_date': message_timestamp,
                                                'summary': message.get('text'),
                                                'chat_id': crm_chat_id,
                                                'external_interaction_id': message_uid
                                            }).execute()
                                            logger.info("whatsapp_sent_saved_to_crm", contact_id=contact_id,
                                                       message_uid=message_uid)
                                except Exception as crm_err:
                                    logger.warning("whatsapp_sent_crm_save_error", error=str(crm_err))

                                return {"success": True, "skipped": "inbox only, saved to CRM"}
                            else:
                                # Message is older than 5 min after done - probably from phone, allow it
                                await db.delete_whatsapp_chat_done(chat_id_str)
                                logger.info("whatsapp_chat_done_cleared", chat_id=chat_id_str,
                                           reason="sent_from_phone", msg_time=str(msg_time))
                        except Exception as time_err:
                            logger.warning("whatsapp_timestamp_parse_error", error=str(time_err))
                            # On error, skip to be safe
                            return {"success": True, "skipped": "timestamp parse error"}

        # Prepare attachment data - TimelinesAI sends "attachments" (plural array)
        attachments_list = message.get('attachments', [])
        attachments_json = None
        has_attachments = False
        if attachments_list and len(attachments_list) > 0:
            has_attachments = True
            attachments_json = []
            for att in attachments_list:
                attachments_json.append({
                    "url": att.get('temporary_download_url'),
                    "name": att.get('filename'),
                    "type": att.get('mimetype'),
                    "size": att.get('size')
                })

        # Insert into command_center_inbox
        import json as json_lib

        record = {
            "type": "whatsapp",
            "from_name": contact_name,
            "contact_number": contact_phone,
            "first_name": first_name,
            "last_name": last_name,
            "subject": chat.get('full_name'),  # Use chat name as "subject"
            "body_text": message.get('text'),
            "snippet": (message.get('text') or '')[:100],
            "date": message.get('timestamp'),
            "direction": direction,
            "chat_id": str(chat.get('chat_id')) if chat.get('chat_id') else None,
            "chat_jid": str(chat.get('chat_id')) if chat.get('chat_id') else None,
            "chat_name": chat.get('full_name'),
            "is_group_chat": chat.get('is_group', False),
            "message_uid": message.get('message_uid'),
            "receiver": whatsapp_account.get('phone'),
            "has_attachments": has_attachments,
            "attachments": json_lib.dumps(attachments_json) if attachments_json else None,
            "is_read": False
        }

        # Remove None values
        record = {k: v for k, v in record.items() if v is not None}

        result = db.client.table('command_center_inbox').insert(record).execute()

        inserted_id = result.data[0]['id'] if result.data else None
        logger.info("whatsapp_message_staged", id=inserted_id, phone=contact_phone)

        # Auto-fetch WhatsApp profile image for contacts without one (fire-and-forget)
        # Only for non-group chats and received messages
        chat_id_str = str(chat.get('chat_id')) if chat.get('chat_id') else None
        is_group = chat.get('is_group', False)
        logger.info("auto_fetch_check", phone=contact_phone, chat_id=chat_id_str,
                   is_group=is_group, direction=direction)
        if contact_phone and chat_id_str and not is_group and direction == 'received':
            logger.info("auto_fetch_triggering", phone=contact_phone, chat_id=chat_id_str)
            import asyncio
            asyncio.create_task(auto_fetch_whatsapp_profile_image(contact_phone, chat_id_str))

        # Download and store attachments permanently in Supabase Storage
        message_uid = message.get('message_uid')
        if attachments_list and len(attachments_list) > 0 and message_uid:
            chat_id_external = str(chat.get('chat_id')) if chat.get('chat_id') else 'unknown'

            for att in attachments_list:
                temp_url = att.get('temporary_download_url')
                filename = att.get('filename') or 'attachment'
                mimetype = att.get('mimetype') or 'application/octet-stream'
                filesize = att.get('size') or 0

                if temp_url:
                    try:
                        # Download from temporary URL
                        async with httpx.AsyncClient() as http_client:
                            download_response = await http_client.get(temp_url, timeout=60.0)
                            if download_response.status_code == 200:
                                file_content = download_response.content

                                # Upload to Supabase Storage
                                storage_path = f"{chat_id_external}/{message_uid}/{filename}"

                                db.client.storage.from_('whatsapp-attachments').upload(
                                    storage_path,
                                    file_content,
                                    {"content-type": mimetype}
                                )

                                # Get public URL
                                permanent_url = db.client.storage.from_('whatsapp-attachments').get_public_url(storage_path)

                                # Insert into attachments table (use permanent_url for file_url since temp expires)
                                insert_result = db.client.table('attachments').insert({
                                    "file_name": filename,
                                    "file_url": permanent_url,  # temp_url expires in 15min, use permanent
                                    "permanent_url": permanent_url,
                                    "file_type": mimetype,
                                    "file_size": filesize,
                                    "external_reference": message_uid,
                                    "processing_status": "completed"
                                }).execute()
                                logger.info("attachment_db_insert", result=str(insert_result.data) if insert_result.data else "no data", permanent_url=permanent_url)

                                logger.info("attachment_stored", message_uid=message_uid, filename=filename, permanent_url=permanent_url)
                            else:
                                logger.warning("attachment_download_failed", message_uid=message_uid, status=download_response.status_code)
                    except Exception as att_error:
                        logger.error("attachment_storage_error", error=str(att_error), filename=filename, message_uid=message_uid)

        return {"success": True, "id": inserted_id}

    except Exception as e:
        logger.error("whatsapp_webhook_error", error=str(e), exc_info=True)
        return {"success": False, "error": str(e)}


# ==================== CALENDAR SYNC ENDPOINT ====================

# ICS Feed URL for RockAndRoll calendar
CALENDAR_ICS_URL = "https://user.fm/calendar/v1-74d4162109b3c98594b10f508dbb74d0/RockAndRoll.ics"


@app.post("/calendar-sync")
async def calendar_sync():
    """
    Sync calendar events from Fastmail ICS feed to command_center_inbox.

    Fetches all events from the ICS feed and upserts them into staging.
    Events are stored with type='calendar' for frontend filtering.
    """
    try:
        from icalendar import Calendar
        import json as json_lib

        logger.info("calendar_sync_started")

        # Load dismissed event_uids to skip
        dismissed_result = db.client.table('calendar_dismissed').select('event_uid').execute()
        dismissed_uids = {r['event_uid'] for r in dismissed_result.data} if dismissed_result.data else set()
        logger.info("calendar_sync_dismissed_loaded", count=len(dismissed_uids))

        # Fetch ICS feed
        async with httpx.AsyncClient() as client:
            response = await client.get(CALENDAR_ICS_URL, timeout=30.0)
            response.raise_for_status()

        ics_content = response.text
        cal = Calendar.from_ical(ics_content)

        synced_count = 0
        updated_count = 0
        deleted_count = 0
        skipped_dismissed = 0
        current_uids = set()

        for component in cal.walk():
            if component.name == "VEVENT":
                # Extract event data
                event_uid = str(component.get('uid', ''))
                if not event_uid:
                    continue

                current_uids.add(event_uid)

                # Skip dismissed events
                if event_uid in dismissed_uids:
                    skipped_dismissed += 1
                    continue

                # Skip cancelled events
                status = str(component.get('status', 'CONFIRMED')).upper()
                if status == 'CANCELLED':
                    continue

                # Parse dates
                dtstart = component.get('dtstart')
                dtend = component.get('dtend')

                start_dt = dtstart.dt if dtstart else None
                end_dt = dtend.dt if dtend else None

                # Convert date to datetime if needed
                if start_dt and not hasattr(start_dt, 'hour'):
                    from datetime import datetime as dt_module, time
                    start_dt = dt_module.combine(start_dt, time.min)
                if end_dt and not hasattr(end_dt, 'hour'):
                    from datetime import datetime as dt_module, time
                    end_dt = dt_module.combine(end_dt, time.max)

                # Extract organizer
                organizer = component.get('organizer')
                organizer_email = None
                organizer_name = None
                if organizer:
                    organizer_str = str(organizer)
                    if organizer_str.startswith('mailto:'):
                        organizer_email = organizer_str[7:]
                    organizer_name = str(organizer.params.get('cn', '')) if hasattr(organizer, 'params') else None

                # Extract attendees
                attendees = []
                raw_attendees = component.get('attendee')
                if raw_attendees:
                    # Normalize to list (single attendee returns object, multiple returns list)
                    if not isinstance(raw_attendees, list):
                        raw_attendees = [raw_attendees]
                    for att in raw_attendees:
                        if att:
                            att_email = str(att)
                            if att_email.startswith('mailto:'):
                                att_email = att_email[7:]
                            att_name = str(att.params.get('cn', '')) if hasattr(att, 'params') else ''
                            att_status = str(att.params.get('partstat', 'NEEDS-ACTION')) if hasattr(att, 'params') else 'NEEDS-ACTION'
                            attendees.append({
                                "email": att_email,
                                "name": att_name,
                                "status": att_status
                            })

                # Clean language prefix from summary (e.g., "LANGUAGE=en-gb:Title" -> "Title")
                raw_summary = str(component.get('summary', ''))
                if raw_summary.startswith('LANGUAGE='):
                    # Strip "LANGUAGE=xx-XX:" prefix
                    parts = raw_summary.split(':', 1)
                    clean_summary = parts[1] if len(parts) > 1 else raw_summary
                else:
                    clean_summary = raw_summary

                # Build record
                record = {
                    "type": "calendar",
                    "event_uid": event_uid,
                    "subject": clean_summary,
                    "body_text": str(component.get('description', '')),
                    "date": start_dt.isoformat() if start_dt else None,
                    "event_end": end_dt.isoformat() if end_dt else None,
                    "event_location": str(component.get('location', '')),
                    "from_name": organizer_name,
                    "from_email": organizer_email,
                    "to_recipients": json_lib.dumps(attendees) if attendees else None,
                    "is_read": False
                }

                # Remove None/empty values
                record = {k: v for k, v in record.items() if v is not None and v != ''}

                # Check if event exists
                existing = db.client.table('command_center_inbox').select('id').eq('event_uid', event_uid).execute()

                if existing.data:
                    # Update existing
                    db.client.table('command_center_inbox').update(record).eq('event_uid', event_uid).execute()
                    updated_count += 1
                else:
                    # Insert new
                    db.client.table('command_center_inbox').insert(record).execute()
                    synced_count += 1

        # Delete events no longer in feed (cancelled or removed)
        existing_events = db.client.table('command_center_inbox').select('id, event_uid').eq('type', 'calendar').execute()
        for event in existing_events.data:
            if event['event_uid'] and event['event_uid'] not in current_uids:
                db.client.table('command_center_inbox').delete().eq('id', event['id']).execute()
                deleted_count += 1

        logger.info("calendar_sync_completed", synced=synced_count, updated=updated_count, deleted=deleted_count, skipped_dismissed=skipped_dismissed)

        return {
            "success": True,
            "synced": synced_count,
            "updated": updated_count,
            "deleted": deleted_count,
            "skipped_dismissed": skipped_dismissed
        }

    except Exception as e:
        logger.error("calendar_sync_error", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/calendar-sync")
async def calendar_sync_status():
    """Get calendar sync status and count of staged events."""
    try:
        result = db.client.table('command_center_inbox').select('id, date', count='exact').eq('type', 'calendar').execute()
        return {
            "status": "ready",
            "total_events": result.count,
            "ics_url": CALENDAR_ICS_URL
        }
    except Exception as e:
        logger.error("calendar_sync_status_error", error=str(e))
        return {"status": "error", "error": str(e)}


@app.delete("/calendar/delete-event")
@app.post("/calendar/delete-event")
async def delete_calendar_event(request: dict):
    """
    Dismiss a calendar event - adds to calendar_dismissed table and removes from inbox.
    Dismissed events won't be re-synced from the ICS feed.

    Input: id (UUID of the event to delete)
    Output: success status
    """
    logger.info("delete_calendar_event_request", event_id=request.get("id"))

    try:
        event_id = request.get("id")

        if not event_id:
            raise HTTPException(status_code=400, detail="Event ID is required")

        # First get the event to retrieve event_uid and subject
        event = db.client.table('command_center_inbox').select('event_uid, subject').eq('id', event_id).eq('type', 'calendar').execute()

        if not event.data:
            raise HTTPException(status_code=404, detail="Event not found or not a calendar event")

        event_uid = event.data[0].get('event_uid')
        subject = event.data[0].get('subject')

        # Add to calendar_dismissed table (prevents re-sync)
        if event_uid:
            db.client.table('calendar_dismissed').upsert({
                'event_uid': event_uid,
                'subject': subject
            }, on_conflict='event_uid').execute()
            logger.info("calendar_event_dismissed", event_uid=event_uid, subject=subject)

        # Delete from command_center_inbox
        result = db.client.table('command_center_inbox').delete().eq('id', event_id).eq('type', 'calendar').execute()

        logger.info("calendar_event_deleted", event_id=event_id)

        return {
            "success": True,
            "deleted": result.data[0] if result.data else None,
            "dismissed_uid": event_uid
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("delete_calendar_event_error", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ==================== CONTACT LINKEDIN FINDER ====================

@app.post("/contact/find-linkedin")
async def find_contact_linkedin(request: dict):
    """
    Find LinkedIn URL for a contact using Apollo.

    Input: first_name, last_name, email (optional), company (optional)
    Output: linkedin_url with confidence score

    Uses Apollo People Match (if email provided) or People Search.
    """
    logger.info("find_contact_linkedin_request",
                first_name=request.get("first_name"),
                last_name=request.get("last_name"),
                email=request.get("email"))

    try:
        first_name = request.get("first_name", "").strip()
        last_name = request.get("last_name", "").strip()
        email = request.get("email", "").strip()
        company = request.get("company", "").strip()

        if not first_name and not last_name:
            return {
                "success": False,
                "error": "At least first_name or last_name required"
            }

        # Use existing Apollo search function
        apollo_data = await search_apollo_person(
            first_name=first_name,
            last_name=last_name,
            email=email if email else None,
            company=company if company else None
        )

        if apollo_data and apollo_data.get("linkedin_url"):
            linkedin_url = apollo_data["linkedin_url"]
            confidence = apollo_data.get("confidence", "medium")

            # Convert confidence to numeric score
            confidence_score = {
                "high": 95,
                "medium": 70,
                "low": 40
            }.get(confidence, 50)

            return {
                "success": True,
                "linkedin_url": linkedin_url,
                "confidence": confidence,
                "confidence_score": confidence_score,
                "source": "apollo",
                # Include extra data if available
                "extra": {
                    "photo_url": apollo_data.get("photo_url"),
                    "title": apollo_data.get("title"),
                    "organization_name": apollo_data.get("organization_name"),
                    "organization_domain": apollo_data.get("organization_domain")
                }
            }

        # Fallback: generate suggestion based on name
        name_slug = f"{first_name.lower()}-{last_name.lower()}".replace(" ", "-")
        suggestion = f"https://linkedin.com/in/{name_slug}"

        return {
            "success": True,
            "linkedin_url": suggestion,
            "confidence": "low",
            "confidence_score": 20,
            "source": "fallback_name_guess",
            "message": "Apollo did not find a match. This is a name-based guess - please verify manually."
        }

    except Exception as e:
        logger.error("find_contact_linkedin_error", error=str(e), exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


# ==================== WHATSAPP SEND MESSAGE ====================

TIMELINES_API_BASE = "https://app.timelines.ai/integrations/api"


async def auto_fetch_whatsapp_profile_image(contact_phone: str, chat_id: str):
    """
    Automatically fetch and save WhatsApp profile image for a contact.

    This is called from the webhook when a message is received.
    It checks if the contact exists in CRM and doesn't have a profile image,
    then fetches it from TimelinesAI and saves to Supabase Storage.

    This runs in the background and doesn't block the webhook response.
    """
    try:
        if not contact_phone or not chat_id:
            return

        logger.info("auto_fetch_profile_image_start", phone=contact_phone, chat_id=chat_id)

        # Find contact by phone number
        contact_result = db.client.table("contact_mobiles").select(
            "contact_id, contacts!inner(contact_id, profile_image_url, first_name, last_name)"
        ).eq("mobile", contact_phone).limit(1).execute()

        if not contact_result.data or len(contact_result.data) == 0:
            logger.info("auto_fetch_profile_image_no_contact", phone=contact_phone)
            return

        contact_data = contact_result.data[0]
        contact_id = contact_data.get("contact_id")
        contact_info = contact_data.get("contacts", {})

        # Check if contact already has a profile image
        existing_image = contact_info.get("profile_image_url")
        should_try_fetch = True

        if existing_image:
            # Check if existing image might be a placeholder (small file size)
            # by making a HEAD request to check content-length
            try:
                async with httpx.AsyncClient(timeout=10.0) as check_client:
                    head_resp = await check_client.head(existing_image)
                    if head_resp.status_code == 200:
                        content_length = int(head_resp.headers.get("content-length", 0))
                        # If image is larger than 10KB, it's probably a real photo
                        if content_length > 10000:
                            logger.info("auto_fetch_profile_image_already_has_good_image",
                                       contact_id=contact_id, size=content_length)
                            should_try_fetch = False
                        else:
                            logger.info("auto_fetch_profile_image_existing_is_placeholder",
                                       contact_id=contact_id, size=content_length)
                            # Will try to fetch a better image
            except Exception as check_error:
                logger.warning("auto_fetch_profile_image_check_existing_failed", error=str(check_error))
                should_try_fetch = False  # Don't overwrite if we can't verify

        if not should_try_fetch:
            return

        # Get Timelines API key
        timelines_api_key = os.getenv("TIMELINES_API_KEY")
        if not timelines_api_key:
            logger.warning("auto_fetch_profile_image_no_api_key")
            return

        # Fetch chat details from TimelinesAI to get profile image
        async with httpx.AsyncClient(timeout=30.0) as client:
            chat_response = await client.get(
                f"{TIMELINES_API_BASE}/chats/{chat_id}",
                headers={
                    "Authorization": f"Bearer {timelines_api_key}",
                    "Content-Type": "application/json"
                }
            )

            if chat_response.status_code != 200:
                logger.warning("auto_fetch_profile_image_chat_fetch_failed",
                             chat_id=chat_id, status=chat_response.status_code)
                return

            chat_details = chat_response.json()
            chat_data = chat_details.get("data", chat_details)

            profile_image_url = chat_data.get("photo")

            if not profile_image_url:
                logger.info("auto_fetch_profile_image_no_photo", chat_id=chat_id)
                return

            # Make URL absolute if needed
            if profile_image_url.startswith("/"):
                profile_image_url = f"https://app.timelines.ai{profile_image_url}"

            logger.info("auto_fetch_profile_image_found", url=profile_image_url)

            # Download the image
            image_response = await client.get(profile_image_url, timeout=30.0)

            if image_response.status_code != 200:
                logger.warning("auto_fetch_profile_image_download_failed",
                             status=image_response.status_code)
                return

            image_content = image_response.content
            content_type = image_response.headers.get("content-type", "image/jpeg")

            # Skip if image is too small (likely a placeholder/default avatar)
            image_size = len(image_content)
            if image_size < 10000:  # Less than 10KB
                logger.info("auto_fetch_profile_image_skipped_placeholder",
                           contact_id=contact_id, size=image_size, url=profile_image_url)
                return

            logger.info("auto_fetch_profile_image_good_size", contact_id=contact_id, size=image_size)

            # Determine file extension
            ext = "jpg"
            if "png" in content_type:
                ext = "png"
            elif "webp" in content_type:
                ext = "webp"

            # Upload to Supabase Storage
            import time
            file_name = f"{contact_id}_wa_auto_{int(time.time())}.{ext}"
            storage_path = f"profile-images/{file_name}"

            try:
                db.client.storage.from_("avatars").upload(
                    storage_path,
                    image_content,
                    {"content-type": content_type}
                )

                # Get public URL
                permanent_url = db.client.storage.from_("avatars").get_public_url(storage_path)

                # Update contact's profile_image_url
                db.client.table("contacts").update({
                    "profile_image_url": permanent_url
                }).eq("contact_id", contact_id).execute()

                logger.info("auto_fetch_profile_image_saved",
                           contact_id=contact_id, url=permanent_url)

            except Exception as storage_error:
                logger.error("auto_fetch_profile_image_storage_error", error=str(storage_error))

    except Exception as e:
        logger.error("auto_fetch_profile_image_error", error=str(e), exc_info=True)


@app.post("/whatsapp-upload-file")
async def whatsapp_upload_file(request: Request):
    """
    Upload a file to TimelinesAI for sending as an attachment.

    Accepts multipart form data with:
    - file: The file to upload (max 2MB)

    Returns the file_uid which can be used in /whatsapp-send
    """
    try:
        # Get Timelines API key
        timelines_api_key = os.getenv("TIMELINES_API_KEY")
        if not timelines_api_key:
            raise HTTPException(status_code=500, detail="WhatsApp integration not configured")

        # Parse multipart form data
        form = await request.form()
        file = form.get("file")

        if not file:
            raise HTTPException(status_code=400, detail="No file provided")

        # Read file content
        file_content = await file.read()
        file_name = file.filename
        content_type = file.content_type or "application/octet-stream"

        # Check file size (max 2MB for TimelinesAI)
        max_size = 2 * 1024 * 1024  # 2MB
        if len(file_content) > max_size:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 2MB")

        logger.info("whatsapp_upload_file", filename=file_name, size=len(file_content), content_type=content_type)

        # Upload to TimelinesAI
        async with httpx.AsyncClient(timeout=60.0) as client:
            # Use multipart form upload
            files = {
                "file": (file_name, file_content, content_type)
            }

            response = await client.post(
                f"{TIMELINES_API_BASE}/files_upload",
                headers={
                    "Authorization": f"Bearer {timelines_api_key}"
                },
                files=files
            )

            logger.info("timelines_upload_response", status=response.status_code)

            if response.status_code in [200, 201]:
                response_data = response.json()
                logger.info("timelines_upload_response_data", response_data=response_data)

                # Try different possible response structures
                file_uid = (
                    response_data.get("data", {}).get("file_uid") or
                    response_data.get("data", {}).get("uid") or
                    response_data.get("file_uid") or
                    response_data.get("uid") or
                    response_data.get("id")
                )

                if not file_uid:
                    logger.error("timelines_upload_no_uid", response=response_data)
                    raise HTTPException(status_code=500, detail=f"Upload succeeded but no file_uid returned. Response: {response_data}")

                logger.info("whatsapp_file_uploaded", file_uid=file_uid, filename=file_name)

                return {
                    "success": True,
                    "file_uid": file_uid,
                    "file_name": file_name,
                    "file_size": len(file_content),
                    "content_type": content_type
                }
            else:
                error_text = response.text[:500]
                logger.error("timelines_upload_error", status=response.status_code, error=error_text)
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"TimelinesAI upload error: {error_text}"
                )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("whatsapp_upload_error", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/whatsapp-send")
async def whatsapp_send_message(request: dict):
    """
    Send a WhatsApp message via Timelines API.

    Input:
    - phone: The phone number to send to (required for individual chats)
    - chat_id: The Timelines chat ID (required for group chats)
    - message: The text message to send (optional if file_uid provided)
    - file_uid: UID of uploaded file to attach (optional)

    Returns success status and message details.
    """
    logger.info("whatsapp_send_request", phone=request.get("phone"), chat_id=request.get("chat_id"), has_file=bool(request.get("file_uid")))

    try:
        phone = request.get("phone", "").strip() if request.get("phone") else None
        chat_id = request.get("chat_id", "").strip() if request.get("chat_id") else None
        message_text = request.get("message", "").strip()
        file_uid = request.get("file_uid", "").strip() if request.get("file_uid") else None

        if not phone and not chat_id:
            raise HTTPException(status_code=400, detail="phone or chat_id is required")

        if not message_text and not file_uid:
            raise HTTPException(status_code=400, detail="message or file_uid is required")

        # Get Timelines API key from environment
        timelines_api_key = os.getenv("TIMELINES_API_KEY")
        if not timelines_api_key:
            logger.error("TIMELINES_API_KEY not configured")
            raise HTTPException(status_code=500, detail="WhatsApp integration not configured")

        # Build request payload
        # For groups: Timelines API requires both phone (can be any valid number) AND chat_id
        # For individuals: just phone
        payload = {}
        if chat_id:
            # For group chats, Timelines needs chat_id AND a phone (use placeholder)
            payload["chat_id"] = chat_id
            payload["phone"] = phone if phone else "group"  # Timelines requires phone field
        else:
            payload["phone"] = phone

        if message_text:
            payload["text"] = message_text

        if file_uid:
            payload["file_uid"] = file_uid

        logger.info("timelines_send_payload", payload=payload)

        # Send message via Timelines API
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{TIMELINES_API_BASE}/messages",
                headers={
                    "Authorization": f"Bearer {timelines_api_key}",
                    "Content-Type": "application/json"
                },
                json=payload
            )

            logger.info("timelines_send_response", status=response.status_code)

            if response.status_code in [200, 201]:
                response_data = response.json()
                logger.info("whatsapp_message_sent", phone=phone, has_file=bool(file_uid))

                return {
                    "success": True,
                    "message_id": response_data.get("data", {}).get("message_id") or response_data.get("message_id"),
                    "phone": phone,
                    "text": message_text,
                    "file_uid": file_uid
                }
            else:
                error_text = response.text[:500]
                logger.error("timelines_send_error", status=response.status_code, error=error_text)
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Timelines API error: {error_text}"
                )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("whatsapp_send_error", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/contact/enrich")
async def enrich_contact(request: dict):
    """
    Enrich contact data using LinkedIn URL via Apollo.

    Input: linkedin_url, first_name (optional), last_name (optional), email (optional)
    Output: Full profile data (job_title, photo, company, phones, city, etc.)

    This uses Apollo's LinkedIn URL lookup for best results.
    """
    logger.info("enrich_contact_request", linkedin_url=request.get("linkedin_url"))

    try:
        linkedin_url = request.get("linkedin_url", "").strip()
        first_name = request.get("first_name", "").strip()
        last_name = request.get("last_name", "").strip()
        email = request.get("email", "").strip()

        if not linkedin_url:
            return {
                "success": False,
                "error": "linkedin_url is required"
            }

        api_key = os.getenv("APOLLO_API_KEY")
        if not api_key:
            return {
                "success": False,
                "error": "Apollo API not configured"
            }

        async with httpx.AsyncClient(timeout=20.0) as client:
            # Apollo People Match with LinkedIn URL
            response = await client.post(
                "https://api.apollo.io/api/v1/people/match",
                json={
                    "api_key": api_key,
                    "linkedin_url": linkedin_url,
                    "first_name": first_name if first_name else None,
                    "last_name": last_name if last_name else None,
                    "email": email if email else None
                }
            )

            logger.info("apollo_enrich_response", status=response.status_code)

            if response.status_code == 200:
                data = response.json()
                person = data.get("person")

                if person:
                    # Extract organization data
                    org = person.get("organization", {}) or {}

                    # Extract phone numbers
                    phones = []
                    if person.get("phone_numbers"):
                        for phone in person.get("phone_numbers", []):
                            phones.append({
                                "number": phone.get("sanitized_number") or phone.get("raw_number"),
                                "type": phone.get("type", "unknown")
                            })

                    # Extract city from location
                    city = person.get("city")
                    state = person.get("state")
                    country = person.get("country")

                    enriched = {
                        "success": True,
                        "data": {
                            "first_name": person.get("first_name"),
                            "last_name": person.get("last_name"),
                            "job_title": person.get("title"),
                            "linkedin_url": person.get("linkedin_url"),
                            "photo_url": person.get("photo_url"),
                            "email": person.get("email"),
                            "city": city,
                            "state": state,
                            "country": country,
                            "phones": phones,
                            "organization": {
                                "name": org.get("name"),
                                "website": org.get("website_url"),
                                "domain": org.get("primary_domain"),
                                "linkedin_url": org.get("linkedin_url"),
                                "logo_url": org.get("logo_url"),
                                "industry": org.get("industry"),
                                "employee_count": org.get("estimated_num_employees")
                            },
                            "seniority": person.get("seniority"),
                            "departments": person.get("departments", [])
                        },
                        "confidence": "high",
                        "source": "apollo"
                    }

                    # Search for company in our DB
                    org_name = org.get("name")
                    org_domain = org.get("primary_domain")

                    if org_name or org_domain:
                        db_company = await search_company_in_db(
                            name=org_name,
                            domain=org_domain
                        )

                        if db_company:
                            enriched["data"]["company_match"] = {
                                "company_id": db_company["company_id"],
                                "name": db_company["name"],
                                "matched_by": db_company["matched_by"],
                                "exists_in_db": True
                            }
                        else:
                            enriched["data"]["company_match"] = {
                                "name": org_name,
                                "domain": org_domain,
                                "exists_in_db": False
                            }

                    return enriched
                else:
                    return {
                        "success": False,
                        "error": "No person found for this LinkedIn URL",
                        "linkedin_url": linkedin_url
                    }
            else:
                logger.warning(f"Apollo enrich failed: {response.status_code} - {response.text[:200]}")
                return {
                    "success": False,
                    "error": f"Apollo API error: {response.status_code}",
                    "linkedin_url": linkedin_url
                }

    except Exception as e:
        logger.error("enrich_contact_error", error=str(e), exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


# ==================== WHATSAPP PROFILE IMAGE ====================

@app.post("/whatsapp-profile-image")
async def whatsapp_profile_image(request: dict):
    """
    Get WhatsApp profile image for a contact and upload it to Supabase Storage.

    This endpoint:
    1. Finds the WhatsApp chat for the contact
    2. Gets the profile image URL from Timelines API
    3. Downloads the image (bypassing CORS issues)
    4. Uploads it to Supabase Storage
    5. Returns a permanent URL

    Input: contact_id (UUID)
    Output: permanent profile image URL from Supabase Storage
    """
    logger.info("whatsapp_profile_image_request", contact_id=request.get("contactId"))

    try:
        contact_id = request.get("contactId")

        if not contact_id:
            return {
                "success": False,
                "message": "contactId is required"
            }

        # Get Timelines API key
        timelines_api_key = os.getenv("TIMELINES_API_KEY")
        if not timelines_api_key:
            return {
                "success": False,
                "message": "Timelines integration not configured"
            }

        # Get contact info
        contact_result = db.client.table("contacts").select(
            "first_name, last_name"
        ).eq("contact_id", contact_id).single().execute()

        if not contact_result.data:
            return {
                "success": False,
                "message": "Contact not found"
            }

        contact_info = contact_result.data
        logger.info(f"Looking for WhatsApp chat for: {contact_info.get('first_name')} {contact_info.get('last_name')}")

        # Find WhatsApp chat - try linked chats first
        chat_data = None

        # Try linked chat
        linked_result = db.client.table("contact_chats").select(
            "chats!inner(external_chat_id, is_group_chat, chat_name)"
        ).eq("contact_id", contact_id).eq(
            "chats.is_group_chat", False
        ).not_.is_("chats.external_chat_id", "null").limit(1).execute()

        if linked_result.data and len(linked_result.data) > 0:
            chat_data = linked_result.data[0]
            logger.info(f"Found linked chat: {chat_data}")
        else:
            # Search by last name in chat_name
            last_name = contact_info.get("last_name", "")
            if last_name:
                orphan_result = db.client.table("chats").select(
                    "external_chat_id, is_group_chat, chat_name"
                ).eq("is_group_chat", False).ilike(
                    "chat_name", f"%{last_name}%"
                ).not_.is_("external_chat_id", "null").limit(1).execute()

                if orphan_result.data and len(orphan_result.data) > 0:
                    chat_data = {"chats": orphan_result.data[0]}
                    logger.info(f"Found orphan chat by last name: {orphan_result.data[0]}")

        if not chat_data:
            return {
                "success": False,
                "message": "No WhatsApp chat found for this contact"
            }

        external_chat_id = chat_data.get("chats", {}).get("external_chat_id")
        if not external_chat_id:
            return {
                "success": False,
                "message": "No external chat ID found"
            }

        # Get chat details from Timelines API
        async with httpx.AsyncClient(timeout=30.0) as client:
            chat_response = await client.get(
                f"{TIMELINES_API_BASE}/chats/{external_chat_id}",
                headers={
                    "Authorization": f"Bearer {timelines_api_key}",
                    "Content-Type": "application/json"
                }
            )

            if chat_response.status_code != 200:
                logger.error(f"Timelines API error: {chat_response.status_code}")
                return {
                    "success": False,
                    "message": "Failed to fetch chat details from Timelines"
                }

            chat_details = chat_response.json()
            chat_data_inner = chat_details.get("data", chat_details)

            profile_image_url = chat_data_inner.get("photo")

            if not profile_image_url:
                return {
                    "success": False,
                    "message": "No profile image found in WhatsApp"
                }

            # Make URL absolute if needed
            if profile_image_url.startswith("/"):
                profile_image_url = f"https://app.timelines.ai{profile_image_url}"

            logger.info(f"Found profile image URL: {profile_image_url}")

            # Download the image
            image_response = await client.get(profile_image_url, timeout=30.0)

            if image_response.status_code != 200:
                logger.error(f"Failed to download image: {image_response.status_code}")
                return {
                    "success": False,
                    "message": "Failed to download profile image"
                }

            image_content = image_response.content
            content_type = image_response.headers.get("content-type", "image/jpeg")

            # Determine file extension
            ext = "jpg"
            if "png" in content_type:
                ext = "png"
            elif "webp" in content_type:
                ext = "webp"

            # Upload to Supabase Storage
            import time
            file_name = f"{contact_id}_wa_{int(time.time())}.{ext}"
            storage_path = f"profile-images/{file_name}"

            try:
                db.client.storage.from_("avatars").upload(
                    storage_path,
                    image_content,
                    {"content-type": content_type}
                )

                # Get public URL
                permanent_url = db.client.storage.from_("avatars").get_public_url(storage_path)

                logger.info(f"Profile image uploaded: {permanent_url}")

                return {
                    "success": True,
                    "profileImageUrl": permanent_url,
                    "source": "whatsapp_timelines",
                    "message": "Profile image saved to storage"
                }

            except Exception as storage_error:
                logger.error(f"Storage upload error: {storage_error}")
                # Return the original URL as fallback (might expire)
                return {
                    "success": True,
                    "profileImageUrl": profile_image_url,
                    "source": "whatsapp_timelines",
                    "message": "Using temporary URL - storage upload failed",
                    "temporary": True
                }

    except Exception as e:
        logger.error("whatsapp_profile_image_error", error=str(e), exc_info=True)
        return {
            "success": False,
            "message": str(e)
        }
