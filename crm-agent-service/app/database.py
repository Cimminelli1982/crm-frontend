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


    # ==================== ACTION EXECUTION ====================

    async def add_contact_email(self, contact_id: str, email: str) -> dict:
        """Add an email to a contact."""
        result = self.client.table("contact_emails").insert({
            "contact_id": contact_id,
            "email": email,
            "is_primary": False
        }).execute()
        return result.data[0] if result.data else None

    async def add_contact_mobile(self, contact_id: str, mobile: str) -> dict:
        """Add a mobile to a contact."""
        result = self.client.table("contact_mobiles").insert({
            "contact_id": contact_id,
            "mobile": mobile,
            "is_primary": False
        }).execute()
        return result.data[0] if result.data else None

    async def update_contact_field(self, contact_id: str, field: str, value: str) -> dict:
        """Update a single field on a contact."""
        result = self.client.table("contacts").update({
            field: value
        }).eq("contact_id", contact_id).execute()
        return result.data[0] if result.data else None

    async def link_contact_to_company(self, contact_id: str, company_id: str) -> dict:
        """Link a contact to a company."""
        # Check if already linked
        existing = self.client.table("contact_companies").select("contact_companies_id").eq(
            "contact_id", contact_id
        ).eq("company_id", company_id).execute()

        if existing.data:
            return existing.data[0]

        result = self.client.table("contact_companies").insert({
            "contact_id": contact_id,
            "company_id": company_id,
            "is_primary": False
        }).execute()
        return result.data[0] if result.data else None

    async def merge_contacts(self, keep_id: str, delete_id: str) -> dict:
        """Merge two contacts - move unique data from delete_id to keep_id, then delete."""

        # Get existing emails on keep_id
        existing_emails = self.client.table("contact_emails").select("email").eq(
            "contact_id", keep_id
        ).execute()
        existing_email_set = {e["email"].lower() for e in (existing_emails.data or [])}

        # Get emails from delete_id
        delete_emails = self.client.table("contact_emails").select("email_id, email").eq(
            "contact_id", delete_id
        ).execute()

        # Move only non-duplicate emails
        for email_row in (delete_emails.data or []):
            if email_row["email"].lower() not in existing_email_set:
                self.client.table("contact_emails").update({
                    "contact_id": keep_id
                }).eq("email_id", email_row["email_id"]).execute()
            else:
                # Delete duplicate email
                self.client.table("contact_emails").delete().eq("email_id", email_row["email_id"]).execute()

        # Get existing mobiles on keep_id
        existing_mobiles = self.client.table("contact_mobiles").select("mobile").eq(
            "contact_id", keep_id
        ).execute()
        existing_mobile_set = {m["mobile"] for m in (existing_mobiles.data or [])}

        # Get mobiles from delete_id
        delete_mobiles = self.client.table("contact_mobiles").select("mobile_id, mobile").eq(
            "contact_id", delete_id
        ).execute()

        # Move only non-duplicate mobiles (and unset is_primary to avoid multiple primaries)
        for mobile_row in (delete_mobiles.data or []):
            if mobile_row["mobile"] not in existing_mobile_set:
                self.client.table("contact_mobiles").update({
                    "contact_id": keep_id,
                    "is_primary": False  # Unset primary to avoid conflicts
                }).eq("mobile_id", mobile_row["mobile_id"]).execute()
            else:
                # Delete duplicate mobile
                self.client.table("contact_mobiles").delete().eq("mobile_id", mobile_row["mobile_id"]).execute()

        # Get existing company links on keep_id
        existing_companies = self.client.table("contact_companies").select("company_id").eq(
            "contact_id", keep_id
        ).execute()
        existing_company_set = {c["company_id"] for c in (existing_companies.data or [])}

        # Get companies from delete_id
        delete_companies = self.client.table("contact_companies").select("contact_companies_id, company_id").eq(
            "contact_id", delete_id
        ).execute()

        # Move only non-duplicate company links
        for company_row in (delete_companies.data or []):
            if company_row["company_id"] not in existing_company_set:
                self.client.table("contact_companies").update({
                    "contact_id": keep_id
                }).eq("contact_companies_id", company_row["contact_companies_id"]).execute()
            else:
                # Delete duplicate link
                self.client.table("contact_companies").delete().eq("contact_companies_id", company_row["contact_companies_id"]).execute()

        # Move tags (check for duplicates)
        existing_tags = self.client.table("contact_tags").select("tag_id").eq(
            "contact_id", keep_id
        ).execute()
        existing_tag_set = {t["tag_id"] for t in (existing_tags.data or [])}

        delete_tags = self.client.table("contact_tags").select("contact_tags_id, tag_id").eq(
            "contact_id", delete_id
        ).execute()

        for tag_row in (delete_tags.data or []):
            if tag_row["tag_id"] not in existing_tag_set:
                self.client.table("contact_tags").update({
                    "contact_id": keep_id
                }).eq("contact_tags_id", tag_row["contact_tags_id"]).execute()
            else:
                self.client.table("contact_tags").delete().eq("contact_tags_id", tag_row["contact_tags_id"]).execute()

        # Move cities (check for duplicates)
        existing_cities = self.client.table("contact_cities").select("city_id").eq(
            "contact_id", keep_id
        ).execute()
        existing_city_set = {c["city_id"] for c in (existing_cities.data or [])}

        delete_cities = self.client.table("contact_cities").select("contact_cities_id, city_id").eq(
            "contact_id", delete_id
        ).execute()

        for city_row in (delete_cities.data or []):
            if city_row["city_id"] not in existing_city_set:
                self.client.table("contact_cities").update({
                    "contact_id": keep_id
                }).eq("contact_cities_id", city_row["contact_cities_id"]).execute()
            else:
                self.client.table("contact_cities").delete().eq("contact_cities_id", city_row["contact_cities_id"]).execute()

        # Delete the duplicate contact
        self.client.table("contacts").delete().eq("contact_id", delete_id).execute()

        return {"merged": True, "kept": keep_id, "deleted": delete_id}

    async def delete_contact(self, contact_id: str) -> dict:
        """Delete a contact and all related data."""
        # Delete related records first
        self.client.table("contact_emails").delete().eq("contact_id", contact_id).execute()
        self.client.table("contact_mobiles").delete().eq("contact_id", contact_id).execute()
        self.client.table("contact_companies").delete().eq("contact_id", contact_id).execute()
        self.client.table("contact_tags").delete().eq("contact_id", contact_id).execute()
        self.client.table("contact_cities").delete().eq("contact_id", contact_id).execute()

        # Delete contact
        self.client.table("contacts").delete().eq("contact_id", contact_id).execute()

        return {"deleted": True, "contact_id": contact_id}

    async def contact_has_email(self, contact_id: str, email: str) -> bool:
        """Check if contact already has this email."""
        result = self.client.table("contact_emails").select("email_id").eq(
            "contact_id", contact_id
        ).ilike("email", email).execute()
        return len(result.data or []) > 0

    async def contact_has_company(self, contact_id: str, company_id: str) -> bool:
        """Check if contact is already linked to company."""
        result = self.client.table("contact_companies").select("contact_companies_id").eq(
            "contact_id", contact_id
        ).eq("company_id", company_id).execute()
        return len(result.data or []) > 0

    # ==================== AUDIT QUERIES ====================

    async def get_contact_completeness(self, contact_id: str) -> dict | None:
        """Get contact completeness data from the view."""
        result = self.client.table("contact_completeness").select("*").eq(
            "contact_id", contact_id
        ).execute()
        return result.data[0] if result.data else None

    async def get_contact_full_audit(self, contact_id: str) -> dict | None:
        """Get complete contact data for audit."""
        result = self.client.table("contacts").select(
            "*, contact_emails(*), contact_mobiles(*), contact_companies(*, companies(*)), "
            "contact_tags(*, tags:tag_id(tag_id, name)), contact_cities(*, cities:city_id(city_id, name))"
        ).eq("contact_id", contact_id).execute()
        return result.data[0] if result.data else None

    async def get_contact_chats(self, contact_id: str) -> list:
        """Get all chats a contact is part of."""
        result = self.client.table("contact_chats").select(
            "*, chats:chat_id(id, chat_name, is_group_chat, external_chat_id)"
        ).eq("contact_id", contact_id).execute()
        return result.data or []

    async def find_contacts_by_name_exact(self, first_name: str, last_name: str) -> list:
        """Find contacts with exact name match (case-insensitive)."""
        result = self.client.table("contacts").select(
            "contact_id, first_name, last_name, category, created_at"
        ).ilike("first_name", first_name).ilike("last_name", last_name).execute()
        return result.data or []

    async def find_contacts_by_name_fuzzy(self, first_name: str, last_name: str = None) -> list:
        """Find contacts with fuzzy name match."""
        query = self.client.table("contacts").select(
            "contact_id, first_name, last_name, category, created_at"
        )

        if first_name:
            query = query.ilike("first_name", f"%{first_name}%")
        if last_name:
            query = query.or_(f"last_name.ilike.%{last_name}%,last_name.ilike.%{first_name}%")

        result = query.limit(50).execute()
        return result.data or []

    async def get_contacts_by_mobile(self, mobile: str) -> list:
        """Find contacts with this mobile number."""
        # Normalize to last 10 digits
        normalized = "".join(filter(str.isdigit, mobile))[-10:]
        if len(normalized) < 7:
            return []

        result = self.client.table("contact_mobiles").select(
            "contact_id, mobile, type, is_primary, contacts(contact_id, first_name, last_name)"
        ).execute()

        matches = []
        for record in result.data or []:
            record_normalized = "".join(filter(str.isdigit, record.get("mobile", "")))[-10:]
            if record_normalized == normalized:
                matches.append(record)
        return matches

    async def get_contact_emails_list(self, contact_id: str) -> list:
        """Get all emails for a contact."""
        result = self.client.table("contact_emails").select("*").eq(
            "contact_id", contact_id
        ).execute()
        return result.data or []

    async def get_contact_mobiles_list(self, contact_id: str) -> list:
        """Get all mobiles for a contact."""
        result = self.client.table("contact_mobiles").select("*").eq(
            "contact_id", contact_id
        ).execute()
        return result.data or []

    async def get_contact_tags_list(self, contact_id: str) -> list:
        """Get all tags for a contact."""
        result = self.client.table("contact_tags").select(
            "*, tags:tag_id(tag_id, name)"
        ).eq("contact_id", contact_id).execute()
        return result.data or []

    async def get_contact_cities_list(self, contact_id: str) -> list:
        """Get all cities for a contact."""
        result = self.client.table("contact_cities").select(
            "*, cities:city_id(city_id, name)"
        ).eq("contact_id", contact_id).execute()
        return result.data or []

    async def get_contact_deals(self, contact_id: str) -> list:
        """Get all deals linked to a contact."""
        result = self.client.table("deals_contacts").select(
            "*, deals:deal_id(*)"
        ).eq("contact_id", contact_id).execute()
        return result.data or []

    async def get_contact_introductions(self, contact_id: str) -> list:
        """Get all introductions involving a contact."""
        result = self.client.table("introduction_contacts").select(
            "*, introductions:introduction_id(*)"
        ).eq("contact_id", contact_id).execute()
        return result.data or []

    # ==================== COMPANY AUDIT ====================

    async def get_company_by_domain_flexible(self, domain: str) -> list:
        """Find companies by domain (handles malformed domains)."""
        # Clean domain
        clean_domain = domain.lower().replace("http://", "").replace("https://", "").replace("www.", "").strip("/")

        result = self.client.table("company_domains").select(
            "company_id, domain, is_primary, companies(*)"
        ).or_(
            f"domain.ilike.%{clean_domain}%,domain.ilike.%{domain}%"
        ).execute()
        return result.data or []

    async def is_personal_email_domain(self, domain: str) -> bool:
        """Check if domain is a personal email provider (gmail, hotmail, etc.)."""
        personal_domains = [
            "gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com",
            "hotmail.it", "gmail.it", "outlook.it", "yahoo.it", "libero.it",
            "hotmail.co.uk", "yahoo.co.uk", "live.com", "msn.com", "aol.com",
            "hotmail.fr", "yahoo.fr", "protonmail.com", "me.com", "mac.com"
        ]
        return domain.lower() in personal_domains

    async def get_company_full_audit(self, company_id: str) -> dict | None:
        """Get complete company data for audit."""
        result = self.client.table("companies").select(
            "*, company_domains(*)"
        ).eq("company_id", company_id).execute()
        return result.data[0] if result.data else None

    async def find_company_duplicates(self, company_id: str, company_name: str) -> list:
        """Find potential company duplicates by name."""
        result = self.client.table("companies").select(
            "company_id, name, category, company_domains(*)"
        ).ilike("name", f"%{company_name}%").neq("company_id", company_id).execute()
        return result.data or []

    # ==================== MORE ACTION EXECUTION ====================

    async def update_mobile_type(self, mobile_id: str, mobile_type: str) -> dict:
        """Update the type of a mobile number."""
        result = self.client.table("contact_mobiles").update({
            "type": mobile_type
        }).eq("mobile_id", mobile_id).execute()
        return result.data[0] if result.data else None

    async def delete_mobile(self, mobile_id: str) -> dict:
        """Delete a mobile number."""
        self.client.table("contact_mobiles").delete().eq("mobile_id", mobile_id).execute()
        return {"deleted": True, "mobile_id": mobile_id}

    async def unset_mobile_primary(self, mobile_id: str) -> dict:
        """Unset a mobile as primary."""
        result = self.client.table("contact_mobiles").update({
            "is_primary": False
        }).eq("mobile_id", mobile_id).execute()
        return result.data[0] if result.data else None

    async def update_company_domain(self, company_id: str, old_domain: str, new_domain: str) -> dict:
        """Fix a company domain."""
        result = self.client.table("company_domains").update({
            "domain": new_domain
        }).eq("company_id", company_id).eq("domain", old_domain).execute()
        return result.data[0] if result.data else None

    async def merge_companies(self, keep_id: str, delete_id: str) -> dict:
        """Merge two companies - move all data from delete_id to keep_id, then delete."""
        # Move contact links
        self.client.table("contact_companies").update({
            "company_id": keep_id
        }).eq("company_id", delete_id).execute()

        # Move domains (but not duplicates)
        self.client.table("company_domains").update({
            "company_id": keep_id
        }).eq("company_id", delete_id).execute()

        # Delete the duplicate company
        self.client.table("companies").delete().eq("company_id", delete_id).execute()

        return {"merged": True, "kept": keep_id, "deleted": delete_id}

    async def create_deal(self, deal_data: dict) -> dict:
        """Create a new deal."""
        result = self.client.table("deals").insert(deal_data).execute()
        return result.data[0] if result.data else None

    async def link_deal_to_contact(self, deal_id: str, contact_id: str, relationship: str = "contact") -> dict:
        """Link a deal to a contact."""
        result = self.client.table("deals_contacts").insert({
            "deal_id": deal_id,
            "contact_id": contact_id,
            "relationship": relationship
        }).execute()
        return result.data[0] if result.data else None

    async def create_introduction(self, intro_data: dict) -> dict:
        """Create a new introduction."""
        result = self.client.table("introductions").insert(intro_data).execute()
        return result.data[0] if result.data else None

    async def link_introduction_to_contact(self, introduction_id: str, contact_id: str, role: str) -> dict:
        """Link an introduction to a contact."""
        result = self.client.table("introduction_contacts").insert({
            "introduction_id": introduction_id,
            "contact_id": contact_id,
            "role": role
        }).execute()
        return result.data[0] if result.data else None


# Singleton instance
db = Database()
