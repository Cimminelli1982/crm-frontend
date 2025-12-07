"""Complete contact audit for CRM data quality."""

from typing import Optional
from pydantic import BaseModel
import structlog
import re

from app.database import db

logger = structlog.get_logger()


# ==================== AUDIT DATA MODELS ====================

class EmailAction(BaseModel):
    action: str  # "add" | "none"
    email: str
    reason: str


class DuplicateContact(BaseModel):
    contact_id: str
    name: str
    action: str  # "delete" | "merge"
    data_to_preserve: list[str]
    reason: str


class MobileInfo(BaseModel):
    mobile_id: str
    number: str
    type: str
    is_primary: bool


class MobileIssue(BaseModel):
    mobile_id: str
    number: str
    current_type: str
    suggested_type: Optional[str]
    reason: str
    action: str  # "review" | "fix"


class MobilesAudit(BaseModel):
    current: list[MobileInfo]
    issues: list[MobileIssue]


class CompanyIssue(BaseModel):
    field: str
    current: str
    fix: str


class CompanyAudit(BaseModel):
    company_id: Optional[str]
    name: Optional[str]
    linked: bool
    action: str  # "link" | "none" | "skip"
    reason: Optional[str] = None
    issues: list[CompanyIssue]


class CompanyDuplicate(BaseModel):
    company_id: str
    name: str
    action: str  # "merge_delete"
    into: str


class ContactAudit(BaseModel):
    contact_id: Optional[str]
    name: str
    found: bool
    completeness_score: Optional[int]
    missing_fields: list[str]


class CommunicationAnalysis(BaseModel):
    type: str  # "business" | "personal" | "transactional"
    involves_deal: bool
    involves_intro: bool
    summary: str


class AuditResult(BaseModel):
    """Complete audit result for a contact."""
    contact: ContactAudit
    email_action: EmailAction
    contact_duplicates: list[DuplicateContact]
    mobiles: MobilesAudit
    company: CompanyAudit
    company_duplicates: list[CompanyDuplicate]
    deals: list[dict]
    introductions: list[dict]
    communication: CommunicationAnalysis


# ==================== UTILITY FUNCTIONS ====================

def extract_domain(email: str) -> Optional[str]:
    """Extract domain from email address."""
    if not email or "@" not in email:
        return None
    return email.split("@")[1].lower()


def parse_name(full_name: str) -> tuple[str, str]:
    """Parse full name into first and last name."""
    if not full_name:
        return "", ""
    parts = full_name.strip().split()
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], " ".join(parts[1:])


def normalize_domain(domain: str) -> str:
    """Clean up malformed domain."""
    if not domain:
        return ""
    clean = domain.lower()
    clean = re.sub(r'^https?://', '', clean)
    clean = re.sub(r'^www\.', '', clean)
    clean = clean.strip('/')
    return clean


def get_missing_fields(completeness: dict) -> list[str]:
    """Determine which fields are missing from completeness data."""
    missing = []
    if not completeness:
        return ["all"]

    # Check key fields
    if not completeness.get("birthday"):
        missing.append("birthday")
    if not completeness.get("linkedin"):
        missing.append("linkedin")
    if not completeness.get("job_role"):
        missing.append("job_role")
    if completeness.get("email_count", 0) == 0:
        missing.append("email")
    if completeness.get("mobile_count", 0) == 0:
        missing.append("mobile")
    if completeness.get("company_count", 0) == 0:
        missing.append("company")
    if completeness.get("city_count", 0) == 0:
        missing.append("city")
    if completeness.get("tag_count", 0) == 0:
        missing.append("tags")
    if not completeness.get("score"):
        missing.append("score")

    return missing


# ==================== MAIN AUDIT CLASS ====================

class ContactAuditor:
    """Performs complete audit of a contact based on email."""

    def __init__(self):
        self.db = db

    async def audit_from_email(self, email_data: dict) -> AuditResult:
        """
        Perform complete audit based on an email.

        Args:
            email_data: dict with from_email, from_name, subject, body_text, etc.

        Returns:
            AuditResult with all findings and actions
        """
        from_email = email_data.get("from_email", "").lower()
        from_name = email_data.get("from_name", "")
        subject = email_data.get("subject", "")
        body_text = email_data.get("body_text", "")

        logger.info("starting_audit", email=from_email, name=from_name)

        # Step 1: Find the contact
        contact = await self._find_contact(from_email, from_name)

        if not contact:
            # Contact not found - return minimal audit
            return self._no_contact_result(from_email, from_name)

        contact_id = contact.get("contact_id")

        # Step 2: Get completeness
        completeness = await self.db.get_contact_completeness(contact_id)
        missing_fields = get_missing_fields(completeness)
        completeness_score = int(completeness.get("completeness_score", 0)) if completeness else 0

        # Step 3: Check email action
        email_action = await self._check_email_action(contact_id, from_email)

        # Step 4: Find duplicates
        duplicates = await self._find_duplicates(contact_id, contact)

        # Step 5: Audit mobiles
        mobiles_audit = await self._audit_mobiles(contact_id)

        # Step 6: Audit company
        company_audit, company_duplicates = await self._audit_company(contact_id, from_email)

        # Step 7: Get deals and introductions
        deals = await self.db.get_contact_deals(contact_id)
        introductions = await self.db.get_contact_introductions(contact_id)

        # Step 8: Analyze communication
        communication = self._analyze_communication(subject, body_text)

        return AuditResult(
            contact=ContactAudit(
                contact_id=contact_id,
                name=f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip(),
                found=True,
                completeness_score=completeness_score,
                missing_fields=missing_fields
            ),
            email_action=email_action,
            contact_duplicates=duplicates,
            mobiles=mobiles_audit,
            company=company_audit,
            company_duplicates=company_duplicates,
            deals=[{"deal_id": d.get("deal_id"), "name": d.get("deals", {}).get("opportunity")} for d in deals],
            introductions=[{"id": i.get("introduction_id"), "text": i.get("introductions", {}).get("text")} for i in introductions],
            communication=communication
        )

    async def _find_contact(self, email: str, name: str) -> Optional[dict]:
        """Find contact by email first, then by name."""
        # Try email first
        contact = await self.db.get_contact_by_email(email)
        if contact:
            return contact

        # Try name
        first_name, last_name = parse_name(name)
        if first_name:
            contacts = await self.db.search_contacts_by_name(first_name, last_name)
            if contacts:
                # Return the most complete one (has most data)
                return max(contacts, key=lambda c: len(c.get("contact_emails", [])) + len(c.get("contact_mobiles", [])))

        return None

    def _no_contact_result(self, email: str, name: str) -> AuditResult:
        """Return result when no contact found."""
        return AuditResult(
            contact=ContactAudit(
                contact_id=None,
                name=name or email,
                found=False,
                completeness_score=None,
                missing_fields=[]
            ),
            email_action=EmailAction(
                action="create_contact",
                email=email,
                reason="Contact not found in CRM"
            ),
            contact_duplicates=[],
            mobiles=MobilesAudit(current=[], issues=[]),
            company=CompanyAudit(
                company_id=None,
                name=None,
                linked=False,
                action="none",
                issues=[]
            ),
            company_duplicates=[],
            deals=[],
            introductions=[],
            communication=CommunicationAnalysis(
                type="unknown",
                involves_deal=False,
                involves_intro=False,
                summary="New contact - no history"
            )
        )

    async def _check_email_action(self, contact_id: str, email: str) -> EmailAction:
        """Check if email needs to be added to contact."""
        has_email = await self.db.contact_has_email(contact_id, email)

        if has_email:
            return EmailAction(
                action="none",
                email=email,
                reason="Email already exists on contact"
            )
        else:
            return EmailAction(
                action="add",
                email=email,
                reason="New email to add"
            )

    async def _find_duplicates(self, contact_id: str, contact: dict) -> list[DuplicateContact]:
        """Find duplicate contacts and determine what data would be lost."""
        first_name = contact.get("first_name", "")
        last_name = contact.get("last_name", "")

        if not first_name:
            return []

        # Find by exact name
        name_matches = await self.db.find_contacts_by_name_exact(first_name, last_name)

        # Also check fuzzy matches on last name variants
        if last_name:
            # Handle cases like "Katherine Elizabeth Manson" vs "Katherine Manson"
            fuzzy_matches = await self.db.find_contacts_by_name_fuzzy(first_name, last_name.split()[-1])
            name_matches.extend(fuzzy_matches)

        duplicates = []
        seen_ids = {contact_id}

        for match in name_matches:
            match_id = match.get("contact_id")
            if match_id in seen_ids:
                continue
            seen_ids.add(match_id)

            # Get full data for this duplicate
            dup_data = await self.db.get_contact_full_audit(match_id)
            if not dup_data:
                continue

            # Determine what data would be lost
            data_to_preserve = []

            emails = dup_data.get("contact_emails", [])
            mobiles = dup_data.get("contact_mobiles", [])
            tags = dup_data.get("contact_tags", [])
            cities = dup_data.get("contact_cities", [])
            companies = dup_data.get("contact_companies", [])

            for e in emails:
                data_to_preserve.append(f"email: {e.get('email')}")
            for m in mobiles:
                data_to_preserve.append(f"mobile: {m.get('mobile')} ({m.get('type')})")
            for t in tags:
                tag_name = t.get("tags", {}).get("name") if t.get("tags") else "unknown"
                data_to_preserve.append(f"tag: {tag_name}")
            for c in cities:
                city_name = c.get("cities", {}).get("name") if c.get("cities") else "unknown"
                data_to_preserve.append(f"city: {city_name}")
            for co in companies:
                company_name = co.get("companies", {}).get("name") if co.get("companies") else "unknown"
                data_to_preserve.append(f"company: {company_name}")

            # Determine action
            if not data_to_preserve:
                action = "delete"
                reason = "Empty duplicate - no unique data"
            else:
                action = "merge"
                reason = f"Has data to preserve: {len(data_to_preserve)} items"

            dup_name = f"{dup_data.get('first_name', '')} {dup_data.get('last_name', '')}".strip()

            duplicates.append(DuplicateContact(
                contact_id=match_id,
                name=dup_name,
                action=action,
                data_to_preserve=data_to_preserve,
                reason=reason
            ))

        return duplicates

    async def _audit_mobiles(self, contact_id: str) -> MobilesAudit:
        """Audit mobile numbers and check types against chat data."""
        mobiles = await self.db.get_contact_mobiles_list(contact_id)
        chats = await self.db.get_contact_chats(contact_id)

        # Determine if contact has 1:1 WhatsApp chat
        has_personal_chat = any(
            not chat.get("chats", {}).get("is_group_chat", True)
            for chat in chats
        )

        current = []
        issues = []

        # Track duplicates and primaries within this contact
        seen_numbers = {}  # number -> mobile_id
        primary_count = 0
        primary_mobiles = []

        for mobile in mobiles:
            mobile_id = mobile.get("mobile_id")
            number = mobile.get("mobile")
            mobile_type = mobile.get("type", "personal")
            is_primary = mobile.get("is_primary", False)

            current.append(MobileInfo(
                mobile_id=mobile_id,
                number=number,
                type=mobile_type,
                is_primary=is_primary
            ))

            # Track primaries
            if is_primary:
                primary_count += 1
                primary_mobiles.append(mobile_id)

            # Check for duplicate numbers ON THIS CONTACT
            if number in seen_numbers:
                issues.append(MobileIssue(
                    mobile_id=mobile_id,
                    number=number,
                    current_type=mobile_type,
                    suggested_type=None,
                    reason=f"Duplicate mobile on same contact - DELETE this one",
                    action="delete"
                ))
            else:
                seen_numbers[number] = mobile_id

            # Check for issues
            # If type is personal but there's no 1:1 chat, might be WhatsApp Group
            if mobile_type == "personal" and not has_personal_chat and len(chats) > 0:
                issues.append(MobileIssue(
                    mobile_id=mobile_id,
                    number=number,
                    current_type=mobile_type,
                    suggested_type="WhatsApp Group",
                    reason="No 1:1 WhatsApp chat found, only group chats",
                    action="review"
                ))

        # Check for multiple primaries
        if primary_count > 1:
            # Mark all but the first as issues
            for mobile_id in primary_mobiles[1:]:
                mobile = next((m for m in mobiles if m.get("mobile_id") == mobile_id), None)
                if mobile:
                    issues.append(MobileIssue(
                        mobile_id=mobile_id,
                        number=mobile.get("mobile"),
                        current_type=mobile.get("type", "personal"),
                        suggested_type=None,
                        reason=f"Multiple primaries detected ({primary_count}) - unset this one",
                        action="unset_primary"
                    ))

        # Check for duplicate mobiles across OTHER contacts
        for mobile in mobiles:
            number = mobile.get("mobile")
            other_contacts = await self.db.get_contacts_by_mobile(number)

            other_ids = [c.get("contact_id") for c in other_contacts if c.get("contact_id") != contact_id]
            if other_ids:
                issues.append(MobileIssue(
                    mobile_id=mobile.get("mobile_id"),
                    number=number,
                    current_type=mobile.get("type", "personal"),
                    suggested_type=None,
                    reason=f"Same mobile exists on {len(other_ids)} other contact(s)",
                    action="review"
                ))

        return MobilesAudit(current=current, issues=issues)

    async def _audit_company(self, contact_id: str, email: str) -> tuple[CompanyAudit, list[CompanyDuplicate]]:
        """Audit company link and find company duplicates."""
        domain = extract_domain(email)
        is_personal_domain = domain and await self.db.is_personal_email_domain(domain)

        # Get contact's current companies FIRST (regardless of email domain)
        contact_full = await self.db.get_contact_full_audit(contact_id)
        current_companies = contact_full.get("contact_companies", []) if contact_full else []

        linked_company = None
        if current_companies:
            linked_company = current_companies[0].get("companies")

        # If contact already has a company, report it (even with personal email)
        if linked_company:
            company_id = linked_company.get("company_id")
            company_name = linked_company.get("name")
            issues = []
            company_duplicates = []

            # Check for domain issues
            company_full = await self.db.get_company_full_audit(company_id)
            if company_full:
                for dom in company_full.get("company_domains", []):
                    domain_value = dom.get("domain", "")
                    normalized = normalize_domain(domain_value)
                    if domain_value != normalized and normalized:
                        issues.append(CompanyIssue(
                            field="domain",
                            current=domain_value,
                            fix=normalized
                        ))

            # Find company duplicates
            if company_name:
                dup_companies = await self.db.find_company_duplicates(company_id, company_name)
                for dup in dup_companies:
                    dup_id = dup.get("company_id")
                    dup_name = dup.get("name")

                    # Check if it's a shell (no real data)
                    dup_full = await self.db.get_company_full_audit(dup_id)
                    has_data = bool(dup_full and (
                        dup_full.get("description") or
                        dup_full.get("website") or
                        dup_full.get("linkedin")
                    ))

                    if not has_data:
                        company_duplicates.append(CompanyDuplicate(
                            company_id=dup_id,
                            name=dup_name,
                            action="merge_delete",
                            into=company_name
                        ))

            return CompanyAudit(
                company_id=company_id,
                name=company_name,
                linked=True,
                action="none",
                issues=issues
            ), company_duplicates

        # No existing company link - check if we should suggest one
        # Skip domain-based suggestion for personal domains
        if is_personal_domain:
            return CompanyAudit(
                company_id=None,
                name=None,
                linked=False,
                action="skip",
                reason=f"Personal email domain ({domain})",
                issues=[]
            ), []

        # Find company by domain
        company_from_domain = None
        if domain:
            domain_matches = await self.db.get_company_by_domain_flexible(domain)
            if domain_matches:
                company_from_domain = domain_matches[0].get("companies")

        if company_from_domain:
            # Company exists but not linked - suggest linking
            company_id = company_from_domain.get("company_id")
            company_name = company_from_domain.get("name")
            issues = []
            company_duplicates = []

            # Check for domain issues on this company too
            company_full = await self.db.get_company_full_audit(company_id)
            if company_full:
                for dom in company_full.get("company_domains", []):
                    domain_value = dom.get("domain", "")
                    normalized = normalize_domain(domain_value)
                    if domain_value != normalized and normalized:
                        issues.append(CompanyIssue(
                            field="domain",
                            current=domain_value,
                            fix=normalized
                        ))

            # Find company duplicates
            if company_name:
                dup_companies = await self.db.find_company_duplicates(company_id, company_name)
                for dup in dup_companies:
                    dup_id = dup.get("company_id")
                    dup_name = dup.get("name")
                    dup_full = await self.db.get_company_full_audit(dup_id)
                    has_data = bool(dup_full and (
                        dup_full.get("description") or
                        dup_full.get("website") or
                        dup_full.get("linkedin")
                    ))
                    if not has_data:
                        company_duplicates.append(CompanyDuplicate(
                            company_id=dup_id,
                            name=dup_name,
                            action="merge_delete",
                            into=company_name
                        ))

            return CompanyAudit(
                company_id=company_id,
                name=company_name,
                linked=False,
                action="link",
                issues=issues
            ), company_duplicates

        # No company found
        return CompanyAudit(
            company_id=None,
            name=None,
            linked=False,
            action="none",
            issues=[]
        ), []

    def _analyze_communication(self, subject: str, body: str) -> CommunicationAnalysis:
        """Analyze email content to determine type and potential actions."""
        text = f"{subject} {body}".lower()

        # Check for deal indicators
        deal_keywords = [
            "investment", "funding", "round", "valuation", "term sheet",
            "equity", "shares", "capital", "pitch", "deck", "proposal",
            "partnership", "contract", "agreement", "deal"
        ]
        involves_deal = any(kw in text for kw in deal_keywords)

        # Check for intro indicators
        intro_keywords = [
            "introduction", "introduce", "meet", "connect you with",
            "putting you in touch", "cc'ing", "looping in", "wanted to connect"
        ]
        involves_intro = any(kw in text for kw in intro_keywords)

        # Determine type
        personal_keywords = [
            "family", "birthday", "christmas", "holiday", "vacation",
            "dinner", "lunch", "kids", "school", "receipt", "order"
        ]
        transactional_keywords = [
            "receipt", "invoice", "payment", "order", "confirmation",
            "subscription", "renewal", "stripe", "paypal"
        ]

        if any(kw in text for kw in transactional_keywords):
            comm_type = "transactional"
            summary = "Transactional email - no business action needed"
        elif any(kw in text for kw in personal_keywords):
            comm_type = "personal"
            summary = "Personal email - no business action needed"
        elif involves_deal or involves_intro:
            comm_type = "business"
            summary = "Business email"
            if involves_deal:
                summary += " - may involve deal"
            if involves_intro:
                summary += " - may be an introduction"
        else:
            comm_type = "business"
            summary = "General business communication"

        return CommunicationAnalysis(
            type=comm_type,
            involves_deal=involves_deal,
            involves_intro=involves_intro,
            summary=summary
        )


# Singleton instance
auditor = ContactAuditor()
