"""Supabase database client and operations."""

from supabase import create_client, Client
from functools import lru_cache
import structlog

from app.config import get_settings

logger = structlog.get_logger()


@lru_cache()
def get_supabase() -> Client:
    """Get cached Supabase client instance."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_key)


class Database:
    """Database operations for the CRM Agent."""

    def __init__(self):
        self.client = get_supabase()

    # ==================== CONTACTS ====================

    async def get_contact_by_email(self, email: str) -> dict | None:
        """Find a contact by email address."""
        result = self.client.table("contact_emails").select(
            "contact_id, email, contacts(*)"
        ).ilike("email", email).execute()

        if result.data and len(result.data) > 0:
            return result.data[0].get("contacts")
        return None

    async def get_contact_by_id(self, contact_id: str) -> dict | None:
        """Get full contact data by ID."""
        result = self.client.table("contacts").select(
            "*, contact_emails(*), contact_mobiles(*), contact_companies(*, companies(*))"
        ).eq("contact_id", contact_id).single().execute()
        return result.data

    async def search_contacts_by_name(self, first_name: str, last_name: str = None) -> list:
        """Search contacts by name (case-insensitive)."""
        query = self.client.table("contacts").select(
            "*, contact_emails(*), contact_mobiles(*), contact_companies(*, companies(*))"
        )

        if first_name:
            query = query.ilike("first_name", f"%{first_name}%")
        if last_name:
            query = query.ilike("last_name", f"%{last_name}%")

        result = query.limit(20).execute()
        return result.data or []

    async def get_contacts_with_similar_email_domain(self, domain: str) -> list:
        """Find contacts with emails from the same domain."""
        result = self.client.table("contact_emails").select(
            "contact_id, email, contacts(contact_id, first_name, last_name)"
        ).ilike("email", f"%@{domain}").execute()
        return result.data or []

    # ==================== COMPANIES ====================

    async def get_company_by_domain(self, domain: str) -> dict | None:
        """Find a company by domain."""
        result = self.client.table("company_domains").select(
            "company_id, domain, companies(*)"
        ).eq("domain", domain.lower()).execute()

        if result.data and len(result.data) > 0:
            return result.data[0].get("companies")
        return None

    async def get_company_by_id(self, company_id: str) -> dict | None:
        """Get company by ID."""
        result = self.client.table("companies").select(
            "*, company_domains(*)"
        ).eq("company_id", company_id).single().execute()
        return result.data

    async def search_companies_by_name(self, name: str) -> list:
        """Search companies by name."""
        result = self.client.table("companies").select(
            "*, company_domains(*)"
        ).ilike("name", f"%{name}%").limit(10).execute()
        return result.data or []

    # ==================== DUPLICATES ====================

    async def find_potential_duplicates(self, contact_id: str) -> list:
        """Find contacts that might be duplicates of the given contact."""
        contact = await self.get_contact_by_id(contact_id)
        if not contact:
            return []

        potential_dupes = []

        # Search by email
        for email_record in contact.get("contact_emails", []):
            email = email_record.get("email", "")
            if email:
                result = self.client.table("contact_emails").select(
                    "contact_id, email"
                ).ilike("email", email).neq("contact_id", contact_id).execute()
                for match in result.data or []:
                    potential_dupes.append({
                        "contact_id": match["contact_id"],
                        "match_type": "exact_email",
                        "match_value": email
                    })

        # Search by name
        if contact.get("first_name") and contact.get("last_name"):
            result = self.client.table("contacts").select(
                "contact_id, first_name, last_name"
            ).ilike("first_name", contact["first_name"]).ilike(
                "last_name", contact["last_name"]
            ).neq("contact_id", contact_id).execute()

            for match in result.data or []:
                potential_dupes.append({
                    "contact_id": match["contact_id"],
                    "match_type": "exact_name",
                    "match_value": f"{match['first_name']} {match['last_name']}"
                })

        # Search by mobile
        for mobile_record in contact.get("contact_mobiles", []):
            mobile = mobile_record.get("mobile", "")
            if mobile:
                # Normalize mobile for comparison
                normalized = "".join(filter(str.isdigit, mobile))[-10:]
                if len(normalized) >= 7:
                    result = self.client.table("contact_mobiles").select(
                        "contact_id, mobile"
                    ).neq("contact_id", contact_id).execute()

                    for match in result.data or []:
                        match_normalized = "".join(filter(str.isdigit, match.get("mobile", "")))[-10:]
                        if match_normalized == normalized:
                            potential_dupes.append({
                                "contact_id": match["contact_id"],
                                "match_type": "mobile",
                                "match_value": mobile
                            })

        return potential_dupes

    async def get_all_contacts_for_dedup(self, limit: int = 1000) -> list:
        """Get contacts for bulk duplicate scanning."""
        result = self.client.table("contacts").select(
            "contact_id, first_name, last_name, contact_emails(email), contact_mobiles(mobile)"
        ).limit(limit).execute()
        return result.data or []

    # ==================== SUGGESTIONS ====================

    async def create_suggestion(self, suggestion: dict) -> dict:
        """Create a new agent suggestion."""
        result = self.client.table("agent_suggestions").insert(suggestion).execute()
        return result.data[0] if result.data else None

    async def get_pending_suggestions(self, limit: int = 50) -> list:
        """Get pending suggestions for review."""
        result = self.client.table("agent_suggestions").select("*").eq(
            "status", "pending"
        ).order("created_at", desc=True).limit(limit).execute()
        return result.data or []

    async def update_suggestion_status(
        self, suggestion_id: str, status: str, reviewed_by: str = "user", notes: str = None
    ) -> dict:
        """Update suggestion status."""
        update_data = {
            "status": status,
            "reviewed_at": "now()",
            "reviewed_by": reviewed_by,
        }
        if notes:
            update_data["user_notes"] = notes

        result = self.client.table("agent_suggestions").update(
            update_data
        ).eq("id", suggestion_id).execute()
        return result.data[0] if result.data else None

    async def check_existing_suggestion(
        self, suggestion_type: str, primary_id: str, secondary_id: str = None
    ) -> bool:
        """Check if a similar pending suggestion already exists."""
        query = self.client.table("agent_suggestions").select("id").eq(
            "suggestion_type", suggestion_type
        ).eq("primary_entity_id", primary_id).eq("status", "pending")

        if secondary_id:
            query = query.eq("secondary_entity_id", secondary_id)

        result = query.execute()
        return len(result.data or []) > 0

    # ==================== ACTION LOG ====================

    async def log_action(self, action: dict) -> dict:
        """Log an agent action."""
        result = self.client.table("agent_action_log").insert(action).execute()
        return result.data[0] if result.data else None

    # ==================== SPAM CHECK ====================

    async def is_spam_email(self, email: str) -> bool:
        """Check if email is in spam list."""
        result = self.client.table("emails_spam").select("email").eq(
            "email", email.lower()
        ).execute()
        return len(result.data or []) > 0

    async def is_spam_domain(self, domain: str) -> bool:
        """Check if domain is in spam list."""
        result = self.client.table("domains_spam").select("domain").eq(
            "domain", domain.lower()
        ).execute()
        return len(result.data or []) > 0


# Singleton instance
db = Database()
