"""Agent tools for CRM operations."""

from rapidfuzz import fuzz
import re
import structlog

from app.database import db

logger = structlog.get_logger()


# ==================== FUZZY MATCHING UTILITIES ====================

def normalize_name(name: str) -> str:
    """Normalize a name for comparison."""
    if not name:
        return ""
    # Lowercase, remove extra spaces, remove special chars
    name = name.lower().strip()
    name = re.sub(r'[^\w\s]', '', name)
    name = re.sub(r'\s+', ' ', name)
    return name


def normalize_email(email: str) -> str:
    """Normalize email for comparison."""
    if not email:
        return ""
    return email.lower().strip()


def normalize_phone(phone: str) -> str:
    """Normalize phone number - keep only digits."""
    if not phone:
        return ""
    return "".join(filter(str.isdigit, phone))


def calculate_name_similarity(name1: str, name2: str) -> float:
    """Calculate similarity between two names (0-1)."""
    n1 = normalize_name(name1)
    n2 = normalize_name(name2)
    if not n1 or not n2:
        return 0.0
    return fuzz.ratio(n1, n2) / 100.0


def calculate_email_similarity(email1: str, email2: str) -> float:
    """Calculate email similarity, accounting for common patterns."""
    e1 = normalize_email(email1)
    e2 = normalize_email(email2)
    if not e1 or not e2:
        return 0.0

    # Exact match
    if e1 == e2:
        return 1.0

    # Same domain, similar local part
    if "@" in e1 and "@" in e2:
        local1, domain1 = e1.split("@", 1)
        local2, domain2 = e2.split("@", 1)

        if domain1 == domain2:
            local_sim = fuzz.ratio(local1, local2) / 100.0
            return 0.5 + (local_sim * 0.5)  # 0.5-1.0 for same domain

    return fuzz.ratio(e1, e2) / 100.0


def phones_match(phone1: str, phone2: str) -> bool:
    """Check if two phone numbers match (last 10 digits)."""
    p1 = normalize_phone(phone1)
    p2 = normalize_phone(phone2)
    if len(p1) < 7 or len(p2) < 7:
        return False
    return p1[-10:] == p2[-10:]


def extract_domain_from_email(email: str) -> str | None:
    """Extract domain from email address."""
    if not email or "@" not in email:
        return None
    return email.split("@")[1].lower()


# ==================== AGENT TOOL DEFINITIONS ====================

TOOLS = [
    {
        "name": "search_contact_by_email",
        "description": "Search for a contact by their email address. Returns contact details if found.",
        "input_schema": {
            "type": "object",
            "properties": {
                "email": {
                    "type": "string",
                    "description": "The email address to search for"
                }
            },
            "required": ["email"]
        }
    },
    {
        "name": "search_contacts_by_name",
        "description": "Search for contacts by first and/or last name. Returns list of matching contacts.",
        "input_schema": {
            "type": "object",
            "properties": {
                "first_name": {
                    "type": "string",
                    "description": "First name to search for"
                },
                "last_name": {
                    "type": "string",
                    "description": "Last name to search for"
                }
            },
            "required": []
        }
    },
    {
        "name": "get_contact_details",
        "description": "Get full details for a contact by their ID, including emails, phones, and companies.",
        "input_schema": {
            "type": "object",
            "properties": {
                "contact_id": {
                    "type": "string",
                    "description": "The UUID of the contact"
                }
            },
            "required": ["contact_id"]
        }
    },
    {
        "name": "find_potential_duplicates",
        "description": "Find contacts that might be duplicates of the given contact based on email, name, and phone matching.",
        "input_schema": {
            "type": "object",
            "properties": {
                "contact_id": {
                    "type": "string",
                    "description": "The UUID of the contact to find duplicates for"
                }
            },
            "required": ["contact_id"]
        }
    },
    {
        "name": "get_company_by_domain",
        "description": "Find a company by their email domain (e.g., 'google.com').",
        "input_schema": {
            "type": "object",
            "properties": {
                "domain": {
                    "type": "string",
                    "description": "The email domain to search for"
                }
            },
            "required": ["domain"]
        }
    },
    {
        "name": "search_companies_by_name",
        "description": "Search for companies by name.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Company name to search for"
                }
            },
            "required": ["name"]
        }
    },
    {
        "name": "check_spam_status",
        "description": "Check if an email or domain is marked as spam.",
        "input_schema": {
            "type": "object",
            "properties": {
                "email": {
                    "type": "string",
                    "description": "Email address to check"
                },
                "domain": {
                    "type": "string",
                    "description": "Domain to check"
                }
            },
            "required": []
        }
    },
    {
        "name": "create_suggestion",
        "description": "Create a suggestion for the user to review. Use this to suggest duplicates, enrichments, or cleanups.",
        "input_schema": {
            "type": "object",
            "properties": {
                "suggestion_type": {
                    "type": "string",
                    "enum": ["duplicate", "enrichment", "cleanup", "company_match"],
                    "description": "Type of suggestion"
                },
                "entity_type": {
                    "type": "string",
                    "enum": ["contact", "company", "deal"],
                    "description": "Type of entity this suggestion affects"
                },
                "primary_entity_id": {
                    "type": "string",
                    "description": "UUID of the primary entity"
                },
                "secondary_entity_id": {
                    "type": "string",
                    "description": "UUID of secondary entity (for duplicates)"
                },
                "confidence_score": {
                    "type": "number",
                    "description": "Confidence score 0.0-1.0"
                },
                "priority": {
                    "type": "string",
                    "enum": ["low", "medium", "high", "critical"],
                    "description": "Priority level"
                },
                "suggestion_data": {
                    "type": "object",
                    "description": "Detailed data for the suggestion"
                },
                "reasoning": {
                    "type": "string",
                    "description": "Explanation of why this suggestion was made"
                }
            },
            "required": ["suggestion_type", "entity_type", "suggestion_data", "reasoning"]
        }
    },
    {
        "name": "calculate_name_match_score",
        "description": "Calculate fuzzy match score between two names. Returns 0.0-1.0.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name1": {
                    "type": "string",
                    "description": "First name to compare"
                },
                "name2": {
                    "type": "string",
                    "description": "Second name to compare"
                }
            },
            "required": ["name1", "name2"]
        }
    }
]


# ==================== TOOL EXECUTION ====================

async def execute_tool(name: str, input_data: dict) -> dict:
    """Execute a tool and return the result."""
    logger.info("executing_tool", tool=name, input=input_data)

    try:
        if name == "search_contact_by_email":
            contact = await db.get_contact_by_email(input_data["email"])
            if contact:
                return {"found": True, "contact": contact}
            return {"found": False, "message": "No contact found with this email"}

        elif name == "search_contacts_by_name":
            contacts = await db.search_contacts_by_name(
                input_data.get("first_name", ""),
                input_data.get("last_name")
            )
            return {"found": len(contacts) > 0, "count": len(contacts), "contacts": contacts}

        elif name == "get_contact_details":
            contact = await db.get_contact_by_id(input_data["contact_id"])
            if contact:
                return {"found": True, "contact": contact}
            return {"found": False, "message": "Contact not found"}

        elif name == "find_potential_duplicates":
            duplicates = await db.find_potential_duplicates(input_data["contact_id"])
            return {"duplicates": duplicates, "count": len(duplicates)}

        elif name == "get_company_by_domain":
            company = await db.get_company_by_domain(input_data["domain"])
            if company:
                return {"found": True, "company": company}
            return {"found": False, "message": "No company found with this domain"}

        elif name == "search_companies_by_name":
            companies = await db.search_companies_by_name(input_data["name"])
            return {"found": len(companies) > 0, "count": len(companies), "companies": companies}

        elif name == "check_spam_status":
            result = {"is_spam": False}
            if input_data.get("email"):
                result["email_spam"] = await db.is_spam_email(input_data["email"])
                result["is_spam"] = result["email_spam"]
            if input_data.get("domain"):
                result["domain_spam"] = await db.is_spam_domain(input_data["domain"])
                result["is_spam"] = result["is_spam"] or result["domain_spam"]
            return result

        elif name == "create_suggestion":
            # Check if similar suggestion exists
            exists = await db.check_existing_suggestion(
                input_data["suggestion_type"],
                input_data.get("primary_entity_id"),
                input_data.get("secondary_entity_id")
            )
            if exists:
                return {"created": False, "message": "Similar suggestion already exists"}

            suggestion = {
                "suggestion_type": input_data["suggestion_type"],
                "entity_type": input_data["entity_type"],
                "primary_entity_id": input_data.get("primary_entity_id"),
                "secondary_entity_id": input_data.get("secondary_entity_id"),
                "confidence_score": input_data.get("confidence_score", 0.5),
                "priority": input_data.get("priority", "medium"),
                "suggestion_data": input_data["suggestion_data"],
                "agent_reasoning": input_data.get("reasoning"),
                "source_email_id": input_data.get("source_email_id"),
                "source_description": input_data.get("source_description"),
            }
            result = await db.create_suggestion(suggestion)
            if result:
                # Log the action
                await db.log_action({
                    "action_type": "suggestion_created",
                    "suggestion_id": result["id"],
                    "entity_type": input_data["entity_type"],
                    "entity_id": input_data.get("primary_entity_id"),
                    "after_data": suggestion,
                })
                return {"created": True, "suggestion_id": result["id"]}
            return {"created": False, "message": "Failed to create suggestion"}

        elif name == "calculate_name_match_score":
            score = calculate_name_similarity(input_data["name1"], input_data["name2"])
            return {"score": score, "match": score > 0.8}

        else:
            return {"error": f"Unknown tool: {name}"}

    except Exception as e:
        logger.error("tool_execution_error", tool=name, error=str(e))
        return {"error": str(e)}
