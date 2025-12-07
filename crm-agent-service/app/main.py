"""FastAPI application for CRM Agent Service."""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
import structlog

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
