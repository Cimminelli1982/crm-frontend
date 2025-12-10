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


# ==================== DEAL EXTRACTION ENDPOINT ====================

@app.post("/extract-deal-from-email")
async def extract_deal_from_email(request: dict):
    """
    Extract deal information from an email for CRM deal creation.

    Uses Claude + Supabase queries to:
    1. Find existing contacts by email
    2. Find existing companies by domain/name
    3. Extract deal info from email content
    4. Suggest associations
    """
    logger.info("extract_deal_from_email_request", from_email=request.get("from_email"))

    try:
        import anthropic
        import json as json_lib

        from_name = request.get("from_name", "")
        from_email = request.get("from_email", "")
        subject = request.get("subject", "")
        body_text = request.get("body_text", "")[:8000]
        email_date = request.get("date", "")

        # Extract domain from email
        email_domain = from_email.split("@")[1] if "@" in from_email else None

        # --- SUPABASE QUERIES: Find existing data ---

        # 1. Find contact by email
        existing_contact = None
        if from_email:
            result = db.client.table("contact_emails").select(
                "contact_id, email, contacts(contact_id, first_name, last_name, job_role, linkedin, category)"
            ).ilike("email", from_email).limit(1).execute()

            if result.data and result.data[0].get("contacts"):
                existing_contact = result.data[0]["contacts"]
                existing_contact["email"] = from_email
                logger.info(f"Found existing contact: {existing_contact.get('first_name')} {existing_contact.get('last_name')}")

        # 2. Find company by domain
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
        db_context = f"""
DATABASE CONTEXT (from Supabase queries):

EXISTING CONTACT (by email {from_email}):
{json_lib.dumps(existing_contact, indent=2, default=str) if existing_contact else "None found - will need to create new contact"}

EXISTING COMPANY (by domain {email_domain}):
{json_lib.dumps(existing_company, indent=2, default=str) if existing_company else "None found - will need to create new company"}

CONTACT'S LINKED COMPANIES:
{json_lib.dumps(contact_companies, indent=2, default=str) if contact_companies else "None"}
"""

        # --- CLAUDE EXTRACTION ---
        prompt = f"""You are extracting deal information from an email for a CRM system.

EMAIL:
From: {from_name} <{from_email}>
Subject: {subject}
Date: {email_date}

Body:
{body_text}

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
- source_category: "Cold Contacting" if unsolicited, "Introduction" if referred by someone"""

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

        # Check spam
        if contact_phone:
            spam_record = await db.is_whatsapp_spam(contact_phone)
            if spam_record:
                # Increment spam counter
                await db.increment_whatsapp_spam_counter(contact_phone)
                logger.info("whatsapp_spam_blocked", phone=contact_phone)
                return {"success": True, "skipped": "spam number"}

        # Prepare attachment data
        attachment = message.get('attachment')
        attachments_json = None
        has_attachments = False
        if attachment:
            has_attachments = True
            attachments_json = [{
                "url": attachment.get('temporary_download_url'),
                "name": attachment.get('filename'),
                "type": attachment.get('mimetype'),
                "size": attachment.get('size')
            }]

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
            "message_uid": message.get('message_id'),
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

        return {"success": True, "id": inserted_id}

    except Exception as e:
        logger.error("whatsapp_webhook_error", error=str(e), exc_info=True)
        return {"success": False, "error": str(e)}
