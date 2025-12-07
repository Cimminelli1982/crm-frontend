"""Executable actions for CRM operations."""

from enum import Enum
from typing import Optional
from pydantic import BaseModel
import structlog

from app.database import db

logger = structlog.get_logger()


class ActionType(str, Enum):
    # Contact actions
    ADD_EMAIL = "add_email"
    ADD_MOBILE = "add_mobile"
    UPDATE_FIELD = "update_field"
    UPDATE_MOBILE_TYPE = "update_mobile_type"
    DELETE_MOBILE = "delete_mobile"
    UNSET_MOBILE_PRIMARY = "unset_mobile_primary"
    DELETE_CONTACT = "delete_contact"
    MERGE_CONTACTS = "merge_contacts"

    # Company actions
    LINK_COMPANY = "link_company"
    FIX_COMPANY_DOMAIN = "fix_company_domain"
    MERGE_COMPANIES = "merge_companies"

    # Deal actions
    CREATE_DEAL = "create_deal"
    LINK_DEAL = "link_deal"

    # Introduction actions
    CREATE_INTRODUCTION = "create_introduction"


class Action(BaseModel):
    """A single executable action."""
    type: ActionType
    description: str  # Human readable: "Add email sh@p14ventures.com"

    # Target IDs
    contact_id: Optional[str] = None
    company_id: Optional[str] = None
    mobile_id: Optional[str] = None
    deal_id: Optional[str] = None
    introduction_id: Optional[str] = None

    # Action-specific data
    value: Optional[str] = None
    field: Optional[str] = None
    mobile_type: Optional[str] = None
    company_name: Optional[str] = None
    old_domain: Optional[str] = None
    new_domain: Optional[str] = None

    # Merge actions
    merge_into_id: Optional[str] = None
    delete_id: Optional[str] = None

    # Deal/intro data
    deal_data: Optional[dict] = None
    intro_data: Optional[dict] = None
    intro_contacts: Optional[list[str]] = None


class ActionResult(BaseModel):
    """Result of executing an action."""
    success: bool
    message: str
    data: Optional[dict] = None


async def execute_action(action: Action) -> ActionResult:
    """Execute a single action and return result."""
    logger.info("executing_action", type=action.type, description=action.description)

    try:
        if action.type == ActionType.ADD_EMAIL:
            if not action.contact_id or not action.value:
                return ActionResult(success=False, message="Missing contact_id or email value")

            # Check if already exists
            exists = await db.contact_has_email(action.contact_id, action.value)
            if exists:
                return ActionResult(success=True, message=f"Email {action.value} already exists")

            result = await db.add_contact_email(action.contact_id, action.value)
            return ActionResult(success=True, message=f"Added email {action.value}", data=result)

        elif action.type == ActionType.ADD_MOBILE:
            if not action.contact_id or not action.value:
                return ActionResult(success=False, message="Missing contact_id or mobile value")

            result = await db.add_contact_mobile(action.contact_id, action.value)
            return ActionResult(success=True, message=f"Added mobile {action.value}", data=result)

        elif action.type == ActionType.UPDATE_FIELD:
            if not action.contact_id or not action.field or not action.value:
                return ActionResult(success=False, message="Missing contact_id, field, or value")

            result = await db.update_contact_field(action.contact_id, action.field, action.value)
            return ActionResult(success=True, message=f"Updated {action.field}", data=result)

        elif action.type == ActionType.UPDATE_MOBILE_TYPE:
            if not action.mobile_id or not action.mobile_type:
                return ActionResult(success=False, message="Missing mobile_id or mobile_type")

            result = await db.update_mobile_type(action.mobile_id, action.mobile_type)
            return ActionResult(success=True, message=f"Updated mobile type to {action.mobile_type}", data=result)

        elif action.type == ActionType.DELETE_MOBILE:
            if not action.mobile_id:
                return ActionResult(success=False, message="Missing mobile_id")

            result = await db.delete_mobile(action.mobile_id)
            return ActionResult(success=True, message="Mobile deleted", data=result)

        elif action.type == ActionType.UNSET_MOBILE_PRIMARY:
            if not action.mobile_id:
                return ActionResult(success=False, message="Missing mobile_id")

            result = await db.unset_mobile_primary(action.mobile_id)
            return ActionResult(success=True, message="Mobile primary unset", data=result)

        elif action.type == ActionType.DELETE_CONTACT:
            if not action.delete_id:
                return ActionResult(success=False, message="Missing delete_id")

            result = await db.delete_contact(action.delete_id)
            return ActionResult(success=True, message="Contact deleted", data=result)

        elif action.type == ActionType.MERGE_CONTACTS:
            if not action.merge_into_id or not action.delete_id:
                return ActionResult(success=False, message="Missing merge_into_id or delete_id")

            result = await db.merge_contacts(action.merge_into_id, action.delete_id)
            return ActionResult(success=True, message="Contacts merged", data=result)

        elif action.type == ActionType.LINK_COMPANY:
            if not action.contact_id or not action.company_id:
                return ActionResult(success=False, message="Missing contact_id or company_id")

            # Check if already linked
            exists = await db.contact_has_company(action.contact_id, action.company_id)
            if exists:
                return ActionResult(success=True, message=f"Already linked to {action.company_name}")

            result = await db.link_contact_to_company(action.contact_id, action.company_id)
            return ActionResult(success=True, message=f"Linked to {action.company_name}", data=result)

        elif action.type == ActionType.FIX_COMPANY_DOMAIN:
            if not action.company_id or not action.old_domain or not action.new_domain:
                return ActionResult(success=False, message="Missing company_id, old_domain, or new_domain")

            result = await db.update_company_domain(action.company_id, action.old_domain, action.new_domain)
            return ActionResult(success=True, message=f"Fixed domain: {action.old_domain} -> {action.new_domain}", data=result)

        elif action.type == ActionType.MERGE_COMPANIES:
            if not action.merge_into_id or not action.delete_id:
                return ActionResult(success=False, message="Missing merge_into_id or delete_id")

            result = await db.merge_companies(action.merge_into_id, action.delete_id)
            return ActionResult(success=True, message="Companies merged", data=result)

        elif action.type == ActionType.CREATE_DEAL:
            if not action.deal_data:
                return ActionResult(success=False, message="Missing deal_data")

            result = await db.create_deal(action.deal_data)
            return ActionResult(success=True, message="Deal created", data=result)

        elif action.type == ActionType.LINK_DEAL:
            if not action.deal_id or not action.contact_id:
                return ActionResult(success=False, message="Missing deal_id or contact_id")

            result = await db.link_deal_to_contact(action.deal_id, action.contact_id)
            return ActionResult(success=True, message="Deal linked to contact", data=result)

        elif action.type == ActionType.CREATE_INTRODUCTION:
            if not action.intro_data or not action.intro_contacts:
                return ActionResult(success=False, message="Missing intro_data or intro_contacts")

            # Create introduction
            intro_result = await db.create_introduction(action.intro_data)
            if not intro_result:
                return ActionResult(success=False, message="Failed to create introduction")

            introduction_id = intro_result.get("introduction_id")

            # Link contacts
            for i, contact_id in enumerate(action.intro_contacts):
                role = "introducer" if i == 0 else "introduced"
                await db.link_introduction_to_contact(introduction_id, contact_id, role)

            return ActionResult(success=True, message="Introduction created", data=intro_result)

        else:
            return ActionResult(success=False, message=f"Unknown action type: {action.type}")

    except Exception as e:
        logger.error("action_execution_error", error=str(e), action=action.dict())
        return ActionResult(success=False, message=str(e))


def audit_to_actions(audit_result: dict) -> list[Action]:
    """Convert audit result to executable actions."""
    actions = []

    # Email action
    email_action = audit_result.get("email_action", {})
    if email_action.get("action") == "add":
        actions.append(Action(
            type=ActionType.ADD_EMAIL,
            contact_id=audit_result.get("contact", {}).get("contact_id"),
            value=email_action.get("email"),
            description=f"Add email {email_action.get('email')}"
        ))

    # Contact duplicates
    for dup in audit_result.get("contact_duplicates", []):
        if dup.get("action") == "delete":
            actions.append(Action(
                type=ActionType.DELETE_CONTACT,
                delete_id=dup.get("contact_id"),
                description=f"Delete duplicate: {dup.get('name')}"
            ))
        elif dup.get("action") == "merge":
            actions.append(Action(
                type=ActionType.MERGE_CONTACTS,
                merge_into_id=audit_result.get("contact", {}).get("contact_id"),
                delete_id=dup.get("contact_id"),
                description=f"Merge '{dup.get('name')}' into master contact"
            ))

    # Mobile issues - handle different action types
    for issue in audit_result.get("mobiles", {}).get("issues", []):
        issue_action = issue.get("action")

        if issue_action == "delete":
            # Duplicate mobile on same contact
            actions.append(Action(
                type=ActionType.DELETE_MOBILE,
                mobile_id=issue.get("mobile_id"),
                description=f"Delete duplicate mobile: {issue.get('number')}"
            ))
        elif issue_action == "unset_primary":
            # Multiple primaries
            actions.append(Action(
                type=ActionType.UNSET_MOBILE_PRIMARY,
                mobile_id=issue.get("mobile_id"),
                description=f"Unset primary: {issue.get('number')}"
            ))
        elif issue.get("suggested_type"):
            # Type change suggestion
            actions.append(Action(
                type=ActionType.UPDATE_MOBILE_TYPE,
                mobile_id=issue.get("mobile_id"),
                mobile_type=issue.get("suggested_type"),
                description=f"Change mobile type: {issue.get('number')} → {issue.get('suggested_type')}"
            ))

    # Company link
    company = audit_result.get("company", {})
    if company.get("action") == "link" and company.get("company_id"):
        actions.append(Action(
            type=ActionType.LINK_COMPANY,
            contact_id=audit_result.get("contact", {}).get("contact_id"),
            company_id=company.get("company_id"),
            company_name=company.get("name"),
            description=f"Link to company: {company.get('name')}"
        ))

    # Company domain fixes
    for issue in company.get("issues", []):
        if issue.get("field") == "domain":
            actions.append(Action(
                type=ActionType.FIX_COMPANY_DOMAIN,
                company_id=company.get("company_id"),
                old_domain=issue.get("current"),
                new_domain=issue.get("fix"),
                description=f"Fix domain: {issue.get('current')} -> {issue.get('fix')}"
            ))

    # Company duplicates
    for dup in audit_result.get("company_duplicates", []):
        actions.append(Action(
            type=ActionType.MERGE_COMPANIES,
            merge_into_id=company.get("company_id"),
            delete_id=dup.get("company_id"),
            description=f"Merge company '{dup.get('name')}' into {dup.get('into')}"
        ))

    return actions


class ContactAnalysis(BaseModel):
    """Result of analyzing a contact from an email."""
    contact_id: Optional[str] = None
    contact_name: str
    contact_exists: bool
    actions: list[Action]
    summary: str  # "Stephan Heller - 3 actions needed"
