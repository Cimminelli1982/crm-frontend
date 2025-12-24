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

    async def is_whatsapp_spam(self, phone_number: str = None, chat_id: str = None) -> dict | None:
        """Check if phone number or chat_id is in WhatsApp spam list. Returns the record if found."""
        # Check by chat_id first (for groups)
        if chat_id:
            result = self.client.table("whatsapp_spam").select("*").eq(
                "chat_id", chat_id
            ).execute()
            if result.data:
                return result.data[0]

        # Check by phone number (for 1-to-1 chats)
        if phone_number:
            result = self.client.table("whatsapp_spam").select("*").eq(
                "mobile_number", phone_number
            ).execute()
            if result.data:
                return result.data[0]

        return None

    async def increment_whatsapp_spam_counter(self, phone_number: str = None, chat_id: str = None) -> None:
        """Increment the counter for a WhatsApp spam number or group."""
        from datetime import datetime
        current = await self.is_whatsapp_spam(phone_number, chat_id)
        if current:
            # Determine which field to use for the update
            if current.get("chat_id") and chat_id:
                self.client.table("whatsapp_spam").update({
                    "counter": current.get("counter", 0) + 1,
                    "last_modified_at": datetime.utcnow().isoformat()
                }).eq("chat_id", chat_id).execute()
            elif phone_number:
                self.client.table("whatsapp_spam").update({
                    "counter": current.get("counter", 0) + 1,
                    "last_modified_at": datetime.utcnow().isoformat()
                }).eq("mobile_number", phone_number).execute()


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

        # Move tags (check for duplicates) - delete from source, insert to target if not duplicate
        existing_tags = self.client.table("contact_tags").select("tag_id").eq(
            "contact_id", keep_id
        ).execute()
        existing_tag_set = {t["tag_id"] for t in (existing_tags.data or [])}

        delete_tags = self.client.table("contact_tags").select("tag_id").eq(
            "contact_id", delete_id
        ).execute()

        for tag_row in (delete_tags.data or []):
            tag_id = tag_row["tag_id"]
            # Delete from source contact
            self.client.table("contact_tags").delete().eq(
                "contact_id", delete_id
            ).eq("tag_id", tag_id).execute()
            # Insert to target if not duplicate
            if tag_id not in existing_tag_set:
                self.client.table("contact_tags").insert({
                    "contact_id": keep_id,
                    "tag_id": tag_id
                }).execute()

        # Move cities (check for duplicates) - delete from source, insert to target if not duplicate
        existing_cities = self.client.table("contact_cities").select("city_id").eq(
            "contact_id", keep_id
        ).execute()
        existing_city_set = {c["city_id"] for c in (existing_cities.data or [])}

        delete_cities = self.client.table("contact_cities").select("city_id").eq(
            "contact_id", delete_id
        ).execute()

        for city_row in (delete_cities.data or []):
            city_id = city_row["city_id"]
            # Delete from source contact
            self.client.table("contact_cities").delete().eq(
                "contact_id", delete_id
            ).eq("city_id", city_id).execute()
            # Insert to target if not duplicate
            if city_id not in existing_city_set:
                self.client.table("contact_cities").insert({
                    "contact_id": keep_id,
                    "city_id": city_id
                }).execute()

        # Move/delete all other related records before deleting the contact
        # These tables have FK constraints and need to be handled

        # contact_chats - move to keep_id
        self.client.table("contact_chats").update({
            "contact_id": keep_id
        }).eq("contact_id", delete_id).execute()

        # keep_in_touch - delete (can recreate if needed)
        self.client.table("keep_in_touch").delete().eq("contact_id", delete_id).execute()

        # contact_email_threads - move to keep_id
        self.client.table("contact_email_threads").update({
            "contact_id": keep_id
        }).eq("contact_id", delete_id).execute()

        # deals_contacts - move to keep_id (skip duplicates)
        existing_deal_links = self.client.table("deals_contacts").select("deal_id").eq(
            "contact_id", keep_id
        ).execute()
        existing_deal_set = {d["deal_id"] for d in (existing_deal_links.data or [])}

        delete_deal_links = self.client.table("deals_contacts").select("id, deal_id").eq(
            "contact_id", delete_id
        ).execute()

        for deal_row in (delete_deal_links.data or []):
            if deal_row["deal_id"] not in existing_deal_set:
                self.client.table("deals_contacts").update({
                    "contact_id": keep_id
                }).eq("id", deal_row["id"]).execute()
            else:
                self.client.table("deals_contacts").delete().eq("id", deal_row["id"]).execute()

        # deals - update introducer if it points to delete_id
        self.client.table("deals").update({
            "introducer": keep_id
        }).eq("introducer", delete_id).execute()

        # email_receivers - move to keep_id
        self.client.table("email_receivers").update({
            "contact_id": keep_id
        }).eq("contact_id", delete_id).execute()

        # emails - update sender_contact_id
        self.client.table("emails").update({
            "sender_contact_id": keep_id
        }).eq("sender_contact_id", delete_id).execute()

        # email_participants - move to keep_id
        self.client.table("email_participants").update({
            "contact_id": keep_id
        }).eq("contact_id", delete_id).execute()

        # interactions - move to keep_id
        self.client.table("interactions").update({
            "contact_id": keep_id
        }).eq("contact_id", delete_id).execute()

        # investments_contacts - move to keep_id
        self.client.table("investments_contacts").update({
            "contact_id": keep_id
        }).eq("contact_id", delete_id).execute()

        # meeting_contacts - move to keep_id
        self.client.table("meeting_contacts").update({
            "contact_id": keep_id
        }).eq("contact_id", delete_id).execute()

        # notes_contacts - move to keep_id
        self.client.table("notes_contacts").update({
            "contact_id": keep_id
        }).eq("contact_id", delete_id).execute()

        # note_contacts - move to keep_id (different table)
        self.client.table("note_contacts").update({
            "contact_id": keep_id
        }).eq("contact_id", delete_id).execute()

        # attachments - move to keep_id
        self.client.table("attachments").update({
            "contact_id": keep_id
        }).eq("contact_id", delete_id).execute()

        # contact_duplicates - delete records referencing the deleted contact
        self.client.table("contact_duplicates").delete().eq("primary_contact_id", delete_id).execute()
        self.client.table("contact_duplicates").delete().eq("duplicate_contact_id", delete_id).execute()

        # email_list_members - move to keep_id
        self.client.table("email_list_members").update({
            "contact_id": keep_id
        }).eq("contact_id", delete_id).execute()

        # email_campaign_logs - move to keep_id
        self.client.table("email_campaign_logs").update({
            "contact_id": keep_id
        }).eq("contact_id", delete_id).execute()

        # apollo_enrichment_inbox - delete (enrichment data for deleted contact)
        self.client.table("apollo_enrichment_inbox").delete().eq("contact_id", delete_id).execute()

        # introduction_contacts - move to keep_id
        self.client.table("introduction_contacts").update({
            "contact_id": keep_id
        }).eq("contact_id", delete_id).execute()

        # Delete the duplicate contact
        self.client.table("contacts").delete().eq("contact_id", delete_id).execute()

        return {"merged": True, "kept": keep_id, "deleted": delete_id}

    async def delete_contact(self, contact_id: str) -> dict:
        """Delete a contact and all related data."""
        # Delete all related records first (all tables with FK to contacts)

        # Core contact data
        self.client.table("contact_emails").delete().eq("contact_id", contact_id).execute()
        self.client.table("contact_mobiles").delete().eq("contact_id", contact_id).execute()
        self.client.table("contact_companies").delete().eq("contact_id", contact_id).execute()
        self.client.table("contact_tags").delete().eq("contact_id", contact_id).execute()
        self.client.table("contact_cities").delete().eq("contact_id", contact_id).execute()

        # Communication & threads
        self.client.table("contact_chats").delete().eq("contact_id", contact_id).execute()
        self.client.table("contact_email_threads").delete().eq("contact_id", contact_id).execute()
        self.client.table("email_receivers").delete().eq("contact_id", contact_id).execute()
        self.client.table("email_participants").delete().eq("contact_id", contact_id).execute()

        # Set sender_contact_id to null on emails (don't delete emails)
        self.client.table("emails").update({
            "sender_contact_id": None
        }).eq("sender_contact_id", contact_id).execute()

        # Deals & introductions
        self.client.table("deals_contacts").delete().eq("contact_id", contact_id).execute()
        self.client.table("introduction_contacts").delete().eq("contact_id", contact_id).execute()

        # Set introducer to null on deals (don't delete deals)
        self.client.table("deals").update({
            "introducer": None
        }).eq("introducer", contact_id).execute()

        # Other linked data
        self.client.table("keep_in_touch").delete().eq("contact_id", contact_id).execute()
        self.client.table("interactions").delete().eq("contact_id", contact_id).execute()
        self.client.table("investments_contacts").delete().eq("contact_id", contact_id).execute()
        self.client.table("meeting_contacts").delete().eq("contact_id", contact_id).execute()
        self.client.table("notes_contacts").delete().eq("contact_id", contact_id).execute()
        self.client.table("note_contacts").delete().eq("contact_id", contact_id).execute()
        self.client.table("attachments").delete().eq("contact_id", contact_id).execute()

        # Duplicate tracking
        self.client.table("contact_duplicates").delete().eq("primary_contact_id", contact_id).execute()
        self.client.table("contact_duplicates").delete().eq("duplicate_contact_id", contact_id).execute()

        # Email campaigns
        self.client.table("email_list_members").delete().eq("contact_id", contact_id).execute()
        self.client.table("email_campaign_logs").delete().eq("contact_id", contact_id).execute()

        # Enrichment data
        self.client.table("apollo_enrichment_inbox").delete().eq("contact_id", contact_id).execute()

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
        """Fix a company domain - handles case where new_domain already exists."""
        # Check if new_domain already exists on this company
        existing = self.client.table("company_domains").select("id").eq(
            "company_id", company_id
        ).eq("domain", new_domain).execute()

        if existing.data:
            # New domain already exists - just delete the old malformed one
            self.client.table("company_domains").delete().eq(
                "company_id", company_id
            ).eq("domain", old_domain).execute()
            return {"fixed": True, "action": "deleted_old", "old": old_domain, "new": new_domain}
        else:
            # New domain doesn't exist - update the old one
            result = self.client.table("company_domains").update({
                "domain": new_domain
            }).eq("company_id", company_id).eq("domain", old_domain).execute()
            return result.data[0] if result.data else {"fixed": True, "action": "updated"}

    async def merge_companies(self, keep_id: str, delete_id: str) -> dict:
        """Merge two companies - move all data from delete_id to keep_id, then delete."""
        # Get existing domains on keep_id
        existing_domains = self.client.table("company_domains").select("domain").eq(
            "company_id", keep_id
        ).execute()
        existing_domain_set = {d["domain"].lower() for d in (existing_domains.data or [])}

        # Get domains from delete_id
        delete_domains = self.client.table("company_domains").select("id, domain").eq(
            "company_id", delete_id
        ).execute()

        # Move only non-duplicate domains, delete duplicates
        for domain_row in (delete_domains.data or []):
            if domain_row["domain"].lower() not in existing_domain_set:
                self.client.table("company_domains").update({
                    "company_id": keep_id
                }).eq("id", domain_row["id"]).execute()
            else:
                # Delete duplicate domain
                self.client.table("company_domains").delete().eq("id", domain_row["id"]).execute()

        # Get existing contact links on keep_id
        existing_contacts = self.client.table("contact_companies").select("contact_id").eq(
            "company_id", keep_id
        ).execute()
        existing_contact_set = {c["contact_id"] for c in (existing_contacts.data or [])}

        # Get contact links from delete_id
        delete_contacts = self.client.table("contact_companies").select("contact_companies_id, contact_id").eq(
            "company_id", delete_id
        ).execute()

        # Move only non-duplicate contact links
        for contact_row in (delete_contacts.data or []):
            if contact_row["contact_id"] not in existing_contact_set:
                self.client.table("contact_companies").update({
                    "company_id": keep_id
                }).eq("contact_companies_id", contact_row["contact_companies_id"]).execute()
            else:
                # Delete duplicate link
                self.client.table("contact_companies").delete().eq(
                    "contact_companies_id", contact_row["contact_companies_id"]
                ).execute()

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
