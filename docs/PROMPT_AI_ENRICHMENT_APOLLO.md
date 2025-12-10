# PROMPT: Aggiungere Apollo Enrichment + Tags Suggestion alla Modal AI Contact

## OBIETTIVO
Estendere la modal AI-first per la creazione contatti aggiungendo:
1. **LinkedIn URL** - tramite Apollo People Search API
2. **Foto profilo** - tramite Apollo enrichment
3. **Tags suggeriti** - Claude sceglie tra i tags esistenti nel DB

---

## CONTESTO ATTUALE

### Cosa è già stato fatto
- Modal `CreateContactModalAI.js` funzionante con AI-first approach
- Backend endpoint `/suggest-contact-profile` che usa Claude per estrarre:
  - first_name, last_name, job_title, company, phones, city, category, description, linkedin (hint)
- I campi base (nome, email, category) sono sempre visibili sopra i tabs
- Tabs: AI Suggestions, Professional, Contact Details, Preferences, Review

### File principali
```
Frontend: /src/components/modals/CreateContactModalAI.js
Backend:  /crm-agent-service/app/main.py (endpoint /suggest-contact-profile)
```

---

## APOLLO API

### Credenziali
Le credenziali Apollo vanno aggiunte come environment variable su Railway:
- **Variable name**: `APOLLO_API_KEY`
- **Service**: `crm-agent-api`

L'utente ha già le credenziali - chiederle prima di deployare.

### Endpoint da usare: People Search
```
POST https://api.apollo.io/api/v1/mixed_people/search
```

### Request body esempio:
```json
{
  "api_key": "YOUR_API_KEY",
  "q_person_name": "Giacomo Mergoni",
  "q_organization_name": "Banor Capital",
  "person_titles": ["CEO", "Chief Executive Officer"],
  "page": 1,
  "per_page": 1
}
```

### Alternativa - People Match (più preciso se hai email):
```
POST https://api.apollo.io/api/v1/people/match
```
```json
{
  "api_key": "YOUR_API_KEY",
  "email": "giacomo.mergoni@banorcapital.com",
  "first_name": "Giacomo",
  "last_name": "Mergoni",
  "organization_name": "Banor Capital"
}
```

### Response include:
```json
{
  "person": {
    "id": "...",
    "first_name": "Giacomo",
    "last_name": "Mergoni",
    "name": "Giacomo Mergoni",
    "linkedin_url": "https://www.linkedin.com/in/giacomo-mergoni-123456",
    "photo_url": "https://media.licdn.com/...",
    "title": "Chief Executive Officer",
    "organization": {
      "name": "Banor Capital",
      "website_url": "https://banorcapital.com"
    }
  }
}
```

### Docs Apollo
- https://apolloio.github.io/apollo-api-docs/
- People Search: https://apolloio.github.io/apollo-api-docs/?shell#mixed-people-search
- People Match: https://apolloio.github.io/apollo-api-docs/?shell#people-match

---

## IMPLEMENTAZIONE BACKEND

### 1. Aggiungere funzione Apollo nel backend

File: `/crm-agent-service/app/main.py`

Aggiungere questa funzione:

```python
import httpx
import os

async def search_apollo_person(first_name: str, last_name: str, email: str = None, company: str = None):
    """
    Search for a person on Apollo to get LinkedIn URL and photo.
    Returns dict with linkedin_url, photo_url, or None if not found.
    """
    api_key = os.getenv("APOLLO_API_KEY")
    if not api_key:
        logger.warning("APOLLO_API_KEY not configured")
        return None

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Try People Match first if we have email (more accurate)
            if email:
                response = await client.post(
                    "https://api.apollo.io/api/v1/people/match",
                    json={
                        "api_key": api_key,
                        "email": email,
                        "first_name": first_name,
                        "last_name": last_name,
                        "organization_name": company
                    }
                )
                if response.status_code == 200:
                    data = response.json()
                    person = data.get("person")
                    if person:
                        return {
                            "linkedin_url": person.get("linkedin_url"),
                            "photo_url": person.get("photo_url"),
                            "title": person.get("title"),
                            "confidence": "high"
                        }

            # Fallback to People Search
            search_payload = {
                "api_key": api_key,
                "q_person_name": f"{first_name} {last_name}",
                "page": 1,
                "per_page": 1
            }
            if company:
                search_payload["q_organization_name"] = company

            response = await client.post(
                "https://api.apollo.io/api/v1/mixed_people/search",
                json=search_payload
            )

            if response.status_code == 200:
                data = response.json()
                people = data.get("people", [])
                if people:
                    person = people[0]
                    return {
                        "linkedin_url": person.get("linkedin_url"),
                        "photo_url": person.get("photo_url"),
                        "title": person.get("title"),
                        "confidence": "medium"
                    }

    except Exception as e:
        logger.error(f"Apollo search error: {e}")

    return None
```

### 2. Aggiungere funzione per caricare tags dal DB

```python
async def get_all_tags():
    """Get all tags from database for Claude to suggest from."""
    try:
        result = db.client.table("tags").select("tag_id, name").execute()
        return result.data or []
    except Exception as e:
        logger.error(f"Error fetching tags: {e}")
        return []
```

### 3. Modificare endpoint /suggest-contact-profile

Aggiornare l'endpoint per:
1. Chiamare Apollo dopo aver estratto nome/company da Claude
2. Passare lista tags a Claude per suggerimenti
3. Restituire linkedin_url, photo_url, suggested_tags nella response

```python
@app.post("/suggest-contact-profile")
async def suggest_contact_profile(request: dict):
    # ... codice esistente per Claude analysis ...

    # Dopo aver ottenuto result da Claude:

    # 1. Apollo enrichment
    apollo_data = None
    if result.get("first_name") and result.get("last_name"):
        apollo_data = await search_apollo_person(
            first_name=result["first_name"]["value"],
            last_name=result["last_name"]["value"],
            email=from_email,
            company=result.get("company", {}).get("name")
        )

    # 2. Add Apollo data to response
    if apollo_data:
        result["linkedin_url"] = {
            "value": apollo_data["linkedin_url"],
            "confidence": apollo_data["confidence"],
            "source": "apollo"
        }
        result["photo_url"] = {
            "value": apollo_data["photo_url"],
            "confidence": apollo_data["confidence"],
            "source": "apollo"
        }

    # 3. Tags suggestion (second Claude call or include in first)
    # ... vedi sotto ...

    return {
        "success": True,
        "suggestions": result,
        # backwards compat
        "suggested_description": ...,
        "suggested_category": ...
    }
```

### 4. Tags Suggestion con Claude

Opzione A - Secondo prompt Claude (più preciso ma più lento):
```python
async def suggest_tags_for_contact(tags: list, email_context: str, contact_info: dict):
    """Ask Claude to suggest relevant tags from existing list."""
    tag_names = [t["name"] for t in tags]

    prompt = f"""Given this contact information and email context, suggest the most relevant tags from this list.

Contact: {contact_info.get('first_name')} {contact_info.get('last_name')}
Job: {contact_info.get('job_title')}
Company: {contact_info.get('company')}
Category: {contact_info.get('category')}

Email context:
{email_context[:1000]}

Available tags: {', '.join(tag_names)}

Return a JSON array of tag names that apply to this contact (max 5):
["tag1", "tag2", "tag3"]

Only include tags from the available list. Return empty array if none apply."""

    # Call Claude...
    # Parse response...
    # Match tag names to tag_ids...
```

Opzione B - Includere nel prompt principale (più veloce):
Aggiungere al prompt esistente:
```
Also, from these available tags, suggest which ones apply to this contact:
Available tags: {tag_names}

In your response, include:
"suggested_tags": ["tag1", "tag2"]
```

---

## IMPLEMENTAZIONE FRONTEND

### File: `/src/components/modals/CreateContactModalAI.js`

### 1. Aggiungere stato per nuovi campi

```javascript
const [linkedinUrl, setLinkedinUrl] = useState('');
const [photoUrl, setPhotoUrl] = useState('');
const [suggestedTags, setSuggestedTags] = useState([]);
```

### 2. Nel tab AI Suggestions, aggiungere visualizzazione per:

#### LinkedIn URL:
```jsx
{aiSuggestions?.linkedin_url?.value && (
  <SuggestionCard theme={theme}>
    <SuggestionHeader>
      <SuggestionLabel theme={theme}>LinkedIn</SuggestionLabel>
      <ConfidenceBadge level={aiSuggestions.linkedin_url.confidence}>
        {aiSuggestions.linkedin_url.confidence}
      </ConfidenceBadge>
    </SuggestionHeader>
    <SuggestionValue theme={theme}>
      <a href={aiSuggestions.linkedin_url.value} target="_blank" rel="noopener noreferrer">
        {aiSuggestions.linkedin_url.value}
      </a>
    </SuggestionValue>
    <SuggestionActions>
      {acceptedFields.linkedin_url ? (
        <AcceptedBadge><FaCheck size={10} /> Accepted</AcceptedBadge>
      ) : (
        <AcceptButton onClick={() => {
          setLinkedin(aiSuggestions.linkedin_url.value);
          setAcceptedFields(prev => ({ ...prev, linkedin_url: true }));
        }}>
          <FaCheck size={10} /> Accept
        </AcceptButton>
      )}
    </SuggestionActions>
  </SuggestionCard>
)}
```

#### Photo URL (con preview):
```jsx
{aiSuggestions?.photo_url?.value && (
  <SuggestionCard theme={theme}>
    <SuggestionHeader>
      <SuggestionLabel theme={theme}>Profile Photo</SuggestionLabel>
      <ConfidenceBadge level={aiSuggestions.photo_url.confidence}>
        {aiSuggestions.photo_url.confidence}
      </ConfidenceBadge>
    </SuggestionHeader>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <img
        src={aiSuggestions.photo_url.value}
        alt="Profile"
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          objectFit: 'cover'
        }}
        onError={(e) => e.target.style.display = 'none'}
      />
      <SuggestionActions>
        {acceptedFields.photo_url ? (
          <AcceptedBadge><FaCheck size={10} /> Accepted</AcceptedBadge>
        ) : (
          <AcceptButton onClick={() => {
            setPhotoUrl(aiSuggestions.photo_url.value);
            setAcceptedFields(prev => ({ ...prev, photo_url: true }));
          }}>
            <FaCheck size={10} /> Use This Photo
          </AcceptButton>
        )}
      </SuggestionActions>
    </div>
  </SuggestionCard>
)}
```

#### Tags suggeriti:
```jsx
{aiSuggestions?.suggested_tags?.length > 0 && (
  <SuggestionCard theme={theme}>
    <SuggestionHeader>
      <SuggestionLabel theme={theme}>Suggested Tags ({aiSuggestions.suggested_tags.length})</SuggestionLabel>
    </SuggestionHeader>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
      {aiSuggestions.suggested_tags.map((tag, idx) => (
        <span key={idx} style={{
          padding: '4px 10px',
          background: '#10B981',
          color: 'white',
          borderRadius: '12px',
          fontSize: '12px'
        }}>
          {tag.name}
        </span>
      ))}
    </div>
    <SuggestionActions>
      {acceptedFields.tags ? (
        <AcceptedBadge><FaCheck size={10} /> Accepted</AcceptedBadge>
      ) : (
        <AcceptButton onClick={() => {
          setTags(aiSuggestions.suggested_tags);
          setAcceptedFields(prev => ({ ...prev, tags: true }));
        }}>
          <FaCheck size={10} /> Accept All Tags
        </AcceptButton>
      )}
    </SuggestionActions>
  </SuggestionCard>
)}
```

### 3. Aggiornare acceptAllSuggestions

```javascript
const acceptAllSuggestions = async () => {
  // ... codice esistente ...

  // LinkedIn
  if (s.linkedin_url?.value) {
    setLinkedin(s.linkedin_url.value);
    setAcceptedFields(prev => ({ ...prev, linkedin_url: true }));
  }

  // Photo
  if (s.photo_url?.value) {
    setPhotoUrl(s.photo_url.value);
    setAcceptedFields(prev => ({ ...prev, photo_url: true }));
  }

  // Tags
  if (s.suggested_tags?.length > 0) {
    setTags(s.suggested_tags);
    setAcceptedFields(prev => ({ ...prev, tags: true }));
  }
};
```

### 4. Salvare photo_url nel contatto

Nel handleSave, aggiungere photo_url:

```javascript
const { data: contact, error: contactError } = await supabase
  .from('contacts')
  .insert({
    first_name: firstName.trim(),
    last_name: lastName.trim() || null,
    // ... altri campi ...
    profile_image_url: photoUrl || null,  // <-- AGGIUNGERE
  })
```

**NOTA**: Verificare che la colonna `profile_image_url` esista nella tabella contacts. Se non esiste:
```sql
ALTER TABLE contacts ADD COLUMN profile_image_url TEXT;
```

---

## DATABASE

### Tabella tags (già esistente)
```sql
SELECT tag_id, name FROM tags LIMIT 10;
```

### Verificare colonna profile_image_url
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'contacts' AND column_name = 'profile_image_url';
```

Se non esiste, creare migration:
```sql
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
```

---

## DEPLOY

### 1. Aggiungere APOLLO_API_KEY su Railway
```bash
railway variables set APOLLO_API_KEY=your_api_key_here --service crm-agent-api
```

Oppure via dashboard Railway:
- Project > crm-agent-api > Variables > Add variable

### 2. Aggiungere httpx alle dipendenze
File: `/crm-agent-service/requirements.txt`
Aggiungere:
```
httpx>=0.25.0
```

### 3. Deploy backend
```bash
cd crm-agent-service && railway up --service crm-agent-api
```

### 4. Test frontend locale, poi push
```bash
git add .
git commit -m "Add Apollo enrichment and tags suggestion to AI contact modal"
git push
```

---

## TESTING

1. Aprire Command Center
2. Data Integrity > Not in CRM
3. Click "Add" su un contatto
4. Verificare che AI Suggestions mostri:
   - Nome, cognome, job title, company, phones, city (esistenti)
   - **LinkedIn URL** (nuovo - da Apollo)
   - **Photo preview** (nuovo - da Apollo)
   - **Tags suggeriti** (nuovo - da Claude + DB)
5. Testare "Accept All"
6. Verificare che i dati vengano salvati correttamente

---

## NOTE IMPORTANTI

1. **Rate limits Apollo**: L'API ha limiti. Considerare caching se necessario.

2. **Fallback photo**: Se Apollo non ha foto, considerare Gravatar:
   ```javascript
   const gravatarUrl = `https://www.gravatar.com/avatar/${md5(email)}?d=identicon`;
   ```

3. **Performance**: La chiamata Apollo aggiunge ~1-2 secondi. Considerare:
   - Chiamarla in parallelo con Claude
   - Mostrare loading state separato per enrichment

4. **Privacy**: Le foto da Apollo/LinkedIn potrebbero avere restrizioni d'uso. Considerare di salvare solo l'URL, non scaricare l'immagine.

---

## RISORSE

- Apollo API Docs: https://apolloio.github.io/apollo-api-docs/
- Supabase Project ID: `efazuvegwxouysfcgwja`
- Railway Service: `crm-agent-api`
- Backend URL: `https://crm-agent-api-production.up.railway.app`
