# PROMPT: Implementare AI-First Contact Creation Modal

## OBIETTIVO
Trasformare la modal "Add New Contact" da un approccio manuale/parcellizzato a un approccio **AI-First** dove Claude analizza l'email completa e suggerisce TUTTI i campi del contatto in un'unica chiamata.

---

## CONTESTO ATTUALE

### Stato Attuale della Modal
La modal `CreateContactModal.js` ha 5 tab:
1. **Basic Info** - firstName, lastName, email, category
2. **Professional** - Company associations, job role, linkedin, description
3. **Contact Details** - mobiles, cities, birthday
4. **Preferences** - keep in touch, score, tags, christmas, easter
5. **Review** - riepilogo finale

**Problemi attuali:**
- Parsing nome da email fatto con regex (spesso sbaglia)
- Estrazione job title da firma email con regex (non funziona bene con thread multipli)
- Claude viene chiamato solo per suggerire description e category (endpoint `/suggest-contact-profile`)
- L'utente deve compilare manualmente molti campi che Claude potrebbe dedurre

### Nuovo Approccio Desiderato
1. **Tab 1 diventa "AI Suggestions"** (al posto di Basic Info)
2. Claude analizza l'INTERO thread email e suggerisce TUTTI i campi
3. L'utente vede le suggestions e può accettare/modificare ciascuna
4. I tab successivi servono per dettagli extra o correzioni

---

## FILE PRINCIPALI

### Frontend (React)

**Modal principale:**
```
/Users/simonecimminelli/crm-frontend/src/components/modals/CreateContactModal.js
```
- ~2000 righe
- Contiene tutta la logica dei tab, form, salvataggio
- Importa da `supabase` per salvare dati
- Chiama `AGENT_SERVICE_URL` per AI suggestions

**Dove viene usata:**
```
/Users/simonecimminelli/crm-frontend/src/pages/CommandCenterPage.js
```
- Linea ~9746: `<CreateContactModal ...>`
- Viene aperta quando clicchi "Add" su un contatto non nel CRM
- `emailData` passato contiene: email, name, body_text, subject, hold_id

### Backend AI (Python FastAPI)

**Servizio AI:**
```
/Users/simonecimminelli/crm-frontend/crm-agent-service/app/main.py
```
- Endpoint esistente: `POST /suggest-contact-profile`
- Attualmente restituisce solo: `suggested_description`, `suggested_category`
- URL produzione: `https://crm-agent-api-production.up.railway.app`

**Tools disponibili (per riferimento):**
```
/Users/simonecimminelli/crm-frontend/crm-agent-service/app/tools.py
```

---

## STRUTTURA DATABASE (Supabase)

**Project ID:** `efazuvegwxouysfcgwja`

### Tabella principale: `contacts`
```sql
- contact_id (UUID, PK)
- first_name (text, required)
- last_name (text)
- job_role (text)
- linkedin (text)
- category (enum: 'Professional Investor', 'Founder', 'Manager', 'Advisor', 'Friend and Family', 'Team', 'Supplier', 'Media', 'Student', 'Institution', 'Other', 'Inbox', 'Not Set')
- description (text)
- birthday (date)
- score (int 1-5)
- keep_in_touch_frequency (enum)
- christmas (enum)
- easter (enum)
- show_missing (boolean) -- se true, mostra campi mancanti
- completeness_score (int 0-100)
- created_at, last_modified_at
```

### Tabelle collegate (JOIN tables):

**contact_emails** (1:N)
```sql
- contact_email_id (UUID, PK)
- contact_id (UUID, FK)
- email (text, unique)
- is_primary (boolean)
```

**contact_mobiles** (1:N)
```sql
- contact_mobile_id (UUID, PK)
- contact_id (UUID, FK)
- mobile (text)
- is_primary (boolean)
```

**contact_cities** (N:M)
```sql
- contact_id (UUID, FK)
- city_id (UUID, FK)
- is_primary (boolean)
```

**cities** (lookup)
```sql
- city_id (UUID, PK)
- name (text) -- es. "London", "Torino"
- country (text)
```

**contact_companies** (N:M)
```sql
- contact_companies_id (UUID, PK)
- contact_id (UUID, FK)
- company_id (UUID, FK)
- relationship (enum: 'founder', 'employee', 'investor', 'board_member', 'advisor', 'not_set')
- job_title (text) -- job title specifico per questa associazione
- is_primary (boolean)
```

**companies** (lookup)
```sql
- company_id (UUID, PK)
- name (text)
- category (enum: 'Startup', 'SME', 'Corporation', 'Professional Investor', etc.)
- website (text)
```

**company_domains** (per matching automatico)
```sql
- domain_id (UUID, PK)
- company_id (UUID, FK)
- domain (text) -- es. "banorcapital.com"
```

**contact_tags** (N:M)
```sql
- contact_id (UUID, FK)
- tag_id (UUID, FK)
```

**tags** (lookup)
```sql
- tag_id (UUID, PK)
- name (text)
```

---

## ESEMPIO EMAIL DA ANALIZZARE

Quando l'utente clicca "Add" su `giacomo.mergoni@banorcapital.com`, l'emailData contiene:

```javascript
{
  email: "giacomo.mergoni@banorcapital.com",
  name: "Giacomo Mergoni", // o potrebbe essere vuoto
  body_text: `From:Robert Day...

Giacomo Mergoni
Chief Executive Officer
M. +44 774 805 5668     |     T. +44 203 002 1865
BANOR CAPITAL LTD | Eagle House, 108-110 Jermyn Street, London SW1Y 6EE (UK) | banorcapital.com

...resto del thread...`,
  subject: "Re: Club degli Investitori in Londra"
}
```

**Claude deve estrarre:**
```json
{
  "first_name": "Giacomo",
  "last_name": "Mergoni",
  "job_title": "Chief Executive Officer",
  "company_name": "BANOR CAPITAL LTD",
  "company_domain": "banorcapital.com",
  "phones": ["+44 774 805 5668", "+44 203 002 1865"],
  "city": "London",
  "category": "Manager",
  "description": "CEO of Banor Capital, investment management firm based in London. Connected through Club degli Investitori networking event.",
  "linkedin_search_hint": "Giacomo Mergoni Banor Capital"
}
```

---

## IMPLEMENTAZIONE RICHIESTA

### 1. Modificare Endpoint Backend `/suggest-contact-profile`

**File:** `/crm-agent-service/app/main.py`

**Input attuale:**
```python
{
  "from_email": "giacomo.mergoni@banorcapital.com",
  "from_name": "Giacomo Mergoni",
  "subject": "Re: Club degli Investitori",
  "body_text": "...full email thread..."
}
```

**Output richiesto:**
```python
{
  "success": true,
  "suggestions": {
    "first_name": {"value": "Giacomo", "confidence": "high"},
    "last_name": {"value": "Mergoni", "confidence": "high"},
    "job_title": {"value": "Chief Executive Officer", "confidence": "high"},
    "company": {
      "name": "BANOR CAPITAL LTD",
      "domain": "banorcapital.com",
      "confidence": "high"
    },
    "phones": [
      {"value": "+44 774 805 5668", "type": "mobile", "confidence": "high"},
      {"value": "+44 203 002 1865", "type": "office", "confidence": "medium"}
    ],
    "city": {"value": "London", "confidence": "high"},
    "category": {"value": "Manager", "confidence": "medium", "alternatives": ["Professional Investor"]},
    "description": {"value": "CEO of Banor Capital...", "confidence": "medium"},
    "linkedin_hint": "Giacomo Mergoni Banor Capital CEO"
  },
  "raw_extraction": {
    "signature_found": true,
    "signature_text": "Giacomo Mergoni\nChief Executive Officer\nM. +44..."
  }
}
```

**Prompt per Claude nel backend:**
```
You are analyzing an email thread to extract contact information for a CRM.

The email address being added is: {from_email}

Your task:
1. Find the signature block belonging to this specific person (not other people in the thread)
2. Extract: full name, job title, company name, phone numbers, city/location
3. Suggest a category from: Professional Investor, Founder, Manager, Advisor, Friend and Family, Team, Supplier, Media, Student, Institution, Other
4. Write a brief professional description

IMPORTANT:
- Look for the signature that belongs to {from_email}, ignore other signatures
- Phone numbers often appear as "M." (mobile), "T." (telephone), "Cell", etc.
- Company name is usually in the signature block
- City can be extracted from address in signature

Return JSON with confidence levels (high/medium/low) for each field.
```

### 2. Modificare Frontend Modal

**File:** `/src/components/modals/CreateContactModal.js`

**Nuova struttura tab:**
```javascript
const tabs = ['AI Suggestions', 'Basic Info', 'Professional', 'Contact Details', 'Preferences', 'Review'];
```

**Tab 0 - AI Suggestions:**
```jsx
{activeTab === 0 && (
  <>
    {/* Header */}
    <div style={{ marginBottom: '16px' }}>
      <h3>AI Suggestions</h3>
      <p>Claude ha analizzato l'email e suggerisce questi dati:</p>
    </div>

    {/* Loading state */}
    {loadingAiSuggestion && (
      <div>Analyzing email...</div>
    )}

    {/* Suggestions list */}
    {aiSuggestion && (
      <div>
        {/* Per ogni campo suggerito */}
        <SuggestionRow
          label="First Name"
          suggestion={aiSuggestion.first_name}
          currentValue={firstName}
          onAccept={() => setFirstName(aiSuggestion.first_name.value)}
          onEdit={(val) => setFirstName(val)}
        />
        {/* ... altri campi ... */}

        {/* Company - speciale perché è join table */}
        <CompanySuggestionRow
          suggestion={aiSuggestion.company}
          onAccept={handleAcceptCompanySuggestion}
        />

        {/* Phones - multipli */}
        <PhonesSuggestionRow
          suggestions={aiSuggestion.phones}
          currentPhones={mobiles}
          onAccept={handleAcceptPhones}
        />

        {/* City - join table */}
        <CitySuggestionRow
          suggestion={aiSuggestion.city}
          onAccept={handleAcceptCity}
        />
      </div>
    )}

    {/* Button to manually trigger */}
    <button onClick={handleFetchAiSuggestions}>
      🤖 Re-analyze with Claude
    </button>

    {/* Accept All button */}
    <button onClick={handleAcceptAllSuggestions}>
      ✅ Accept All Suggestions
    </button>
  </>
)}
```

### 3. Gestire Join Tables

**Company:**
```javascript
const handleAcceptCompanySuggestion = async (suggestion) => {
  // 1. Check if company exists by domain
  const { data: existingDomain } = await supabase
    .from('company_domains')
    .select('company_id, companies(company_id, name)')
    .eq('domain', suggestion.domain)
    .single();

  if (existingDomain) {
    // Company exists, add to companies array
    setCompanies(prev => [...prev, {
      company_id: existingDomain.company_id,
      name: existingDomain.companies.name,
      relationship: 'employee',
      job_title: aiSuggestion.job_title?.value,
      is_primary: true
    }]);
  } else {
    // Create new company (or prompt user)
    // ...
  }
};
```

**City:**
```javascript
const handleAcceptCity = async (cityName) => {
  // Search for existing city
  const { data: existingCity } = await supabase
    .from('cities')
    .select('city_id, name')
    .ilike('name', cityName)
    .single();

  if (existingCity) {
    setCities(prev => [...prev, {
      city_id: existingCity.city_id,
      name: existingCity.name,
      is_primary: true
    }]);
  } else {
    // Create new city or prompt user
  }
};
```

**Phones:**
```javascript
const handleAcceptPhones = (phones) => {
  setMobiles(phones.map((p, i) => ({
    mobile: p.value,
    is_primary: i === 0
  })));
};
```

---

## ACCESSI E TOOLS

### Supabase
- **Project ID:** `efazuvegwxouysfcgwja`
- **Client:** già configurato in `/src/lib/supabaseClient.js`
- **Accesso MCP:** disponibile tramite `mcp__supabase__*` tools

### Railway (Backend Deploy)
- **Comando deploy:** `railway up --service crm-agent-api`
- **NON collegato a GitHub** - deploy manuale via CLI

### Frontend Deploy
- **Netlify** - deploya automaticamente da GitHub push
- **NON fare push senza chiedere** - testare localmente prima

### File Memory
```
/Users/simonecimminelli/crm-frontend/backend/data/claude-memory.json
```
Contiene note su deploy, project IDs, workflow rules.

---

## STEP IMPLEMENTAZIONE SUGGERITI

1. **Backend first:** Modificare `/suggest-contact-profile` per restituire tutti i campi
2. **Test endpoint:** Verificare che restituisca JSON corretto
3. **Deploy backend:** `railway up --service crm-agent-api`
4. **Frontend:** Riorganizzare tab, aggiungere "AI Suggestions" come primo
5. **UI suggestions:** Creare componenti per mostrare/accettare suggestions
6. **Join tables:** Implementare logica per company, city, phones
7. **Test locale:** Verificare tutto funziona
8. **Push frontend:** Solo dopo test completo

---

## NOTE IMPORTANTI

1. **Thread multipli:** L'email può contenere firme di più persone. Claude deve identificare SOLO la firma della persona che stiamo aggiungendo (basandosi sull'email address).

2. **Confidence levels:** Mostrare all'utente quanto Claude è sicuro di ogni suggestion.

3. **Fallback:** Se Claude non trova qualcosa, lasciare il campo vuoto per input manuale.

4. **Company matching:** Prima cercare se company esiste già (by domain), poi by name, poi creare nuova.

5. **City matching:** Le città esistenti sono nella tabella `cities`. Cercare match fuzzy.

6. **Performance:** La chiamata AI può richiedere 2-5 secondi. Mostrare loading state.

---

## TESTING

Testare con queste email:
1. Email con firma completa (nome, titolo, company, telefoni, indirizzo)
2. Email con firma minima (solo nome)
3. Email thread con multiple firme (deve prendere quella giusta)
4. Email senza firma (deve fare parsing da email address)
