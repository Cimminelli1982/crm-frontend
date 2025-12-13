# CRM Documentation

## Flusso Dati

```
┌────────────────────────────────────────────────────────────────┐
│  0. ARCHITECTURE.md         Stack tecnologico e componenti     │
├────────────────────────────────────────────────────────────────┤
│  1. DATA_INGESTION.md       Railway → command_center_inbox     │
├────────────────────────────────────────────────────────────────┤
│  2. DATA_INTEGRITY.md       Trigger → check partecipanti       │
├────────────────────────────────────────────────────────────────┤
│  3. [Command Center UI]     Utente review + risolve issues     │
├────────────────────────────────────────────────────────────────┤
│  4. [Done Processing]       Trigger → tabelle finali CRM       │
└────────────────────────────────────────────────────────────────┘
```

## Indice

| # | File | Descrizione |
|---|------|-------------|
| 0 | [ARCHITECTURE.md](./ARCHITECTURE.md) | Stack, hosting, componenti principali |
| 1 | [DATA_INGESTION.md](./DATA_INGESTION.md) | Come Email/WhatsApp/Calendar arrivano in Supabase |
| 2 | [DATA_INTEGRITY.md](./DATA_INTEGRITY.md) | 8 check di validazione + DataIntegrityTab UI |
| 3 | [WHATSAPP_ATTACHMENTS_IMPLEMENTATION.md](./WHATSAPP_ATTACHMENTS_IMPLEMENTATION.md) | Gestione allegati WhatsApp (download → Storage) |
| 4 | [SUPABASE_SCHEMA.md](./SUPABASE_SCHEMA.md) | Schema database completo con tutte le tabelle |

## Quick Reference

### Tabelle Principali

| Tabella | Scopo |
|---------|-------|
| `command_center_inbox` | Staging unificato (email, whatsapp, calendar) |
| `data_integrity_inbox` | Issues rilevate dai check |
| `contacts_hold` | Contatti in attesa di decisione |
| `companies_hold` | Company/domini in attesa |

### Servizi Railway

| Servizio | Stack | Funzione |
|----------|-------|----------|
| `command-center-backend` | Node.js | Polling email Fastmail (JMAP) |
| `crm-agent-service` | Python/FastAPI | Webhook WhatsApp + Calendar sync |
