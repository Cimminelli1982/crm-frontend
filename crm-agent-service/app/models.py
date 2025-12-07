"""Pydantic models for API requests and responses."""

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID


# ==================== REQUEST MODELS ====================

class EmailPayload(BaseModel):
    """Incoming email data for analysis."""
    id: UUID
    fastmail_id: str
    from_email: str
    from_name: Optional[str] = None
    to_recipients: Optional[list] = None
    cc_recipients: Optional[list] = None
    subject: Optional[str] = None
    body_text: Optional[str] = None
    snippet: Optional[str] = None
    date: Optional[datetime] = None


class AnalyzeEmailRequest(BaseModel):
    """Request to analyze an email for CRM suggestions."""
    email: EmailPayload


class RunCleanupRequest(BaseModel):
    """Request to run cleanup/dedup scan."""
    entity_type: Literal["contact", "company", "deal"] = "contact"
    limit: int = Field(default=100, ge=1, le=1000)


class SuggestionActionRequest(BaseModel):
    """Request to accept/reject a suggestion."""
    action: Literal["accept", "reject"]
    notes: Optional[str] = None
    modifications: Optional[dict] = None  # User can modify the suggestion before accepting


# ==================== RESPONSE MODELS ====================

class SuggestionResponse(BaseModel):
    """A single suggestion."""
    id: UUID
    suggestion_type: str
    entity_type: str
    primary_entity_id: Optional[UUID]
    secondary_entity_id: Optional[UUID]
    confidence_score: Optional[float]
    priority: str
    suggestion_data: dict
    source_description: Optional[str]
    status: str
    created_at: datetime
    agent_reasoning: Optional[str]


class AnalyzeEmailResponse(BaseModel):
    """Response from email analysis."""
    success: bool
    email_id: UUID
    contact_found: bool
    contact_id: Optional[UUID] = None
    suggestions_created: int
    suggestions: list[SuggestionResponse] = []
    message: str


class CleanupResponse(BaseModel):
    """Response from cleanup run."""
    success: bool
    scanned: int
    suggestions_created: int
    message: str


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    timestamp: datetime
    version: str = "1.0.0"


# ==================== AGENT TOOL MODELS ====================

class ContactSearchResult(BaseModel):
    """Result from contact search."""
    contact_id: UUID
    first_name: Optional[str]
    last_name: Optional[str]
    emails: list[str] = []
    mobiles: list[str] = []
    companies: list[str] = []
    match_score: float = 0.0
    match_reasons: list[str] = []


class DuplicateCandidate(BaseModel):
    """A potential duplicate contact."""
    primary_contact: ContactSearchResult
    duplicate_contact: ContactSearchResult
    confidence_score: float
    match_reasons: list[str]
    suggested_action: Literal["merge", "review", "ignore"]


class EnrichmentSuggestion(BaseModel):
    """A suggested enrichment for a contact/company."""
    entity_type: Literal["contact", "company", "deal"]
    entity_id: UUID
    field: str
    current_value: Optional[str]
    suggested_value: str
    source: str
    confidence_score: float
