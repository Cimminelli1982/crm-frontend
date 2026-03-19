---
name: health-training-log
description: "Log workouts, track progression, weekly training review"
version: 1.0.0
category: health
---

# Health Training Log — Registrazione Allenamenti e Tracking Progressione

## Obiettivo

Registrare gli allenamenti di Simone, tracciare la progressione su ogni esercizio, confrontare con le sessioni precedenti e produrre review giornaliere e settimanali.

---

## Prerequisiti

```bash
source /opt/openclaw.env
```

Variabili necessarie:
- `$SUPABASE_URL` — URL progetto Supabase
- `$SUPABASE_KEY` — Service role key Supabase
- `$COMMAND_CENTER_BACKEND_URL` — Backend Railway (Node.js)

---

## 1) Programma di allenamento settimanale

| Giorno | Sessione | Orario |
|--------|----------|--------|
| Lunedì | Weight lifting gambe + Cardio | 14:00-16:00 |
| Martedì | Pilates + Cardio | 14:00-16:00 |
| Mercoledì | PT (Personal Trainer) + Cardio | 14:00-16:00 |
| Giovedì | Pilates + Cardio | 14:00-16:00 |
| Venerdì | Weight lifting + Cardio | 14:00-16:00 |
| Sabato | Calisthenics | Mattina |
| Domenica | Riposo | — |

### Routine giornaliera

- **05:45-06:40**: Palestra mattutina (Lun-Ven)
- **14:00-15:00**: Sessione di allenamento principale
- **15:00-16:00**: Cardio

### Ogni 2 settimane

- Massaggio 90 minuti

---

## 2) Obiettivi

| Obiettivo | Target | Note |
|-----------|--------|------|
| Peso corporeo | 88 kg | Cut in corso |
| Pull-up | 1 rep completa | Obiettivo primario forza |
| Massa magra | Preservare | Non perdere muscolo durante il cut |

---

## 3) Struttura del training log

### Campi per ogni esercizio

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| exercise_name | text | Nome esercizio (es. "Squat", "Bench Press") |
| weight_kg | numeric | Peso utilizzato in kg |
| reps | integer | Ripetizioni per serie |
| sets | integer | Numero di serie |
| rpe | integer (1-10) | Rate of Perceived Exertion |
| notes | text | Note libere (dolore, sensazioni, varianti) |

### Esempio di log

```
📋 Allenamento — Lunedì 10 Marzo 2026

Tipo: Weight Lifting Gambe + Cardio
Durata: 60 min lifting + 45 min cardio

| Esercizio | Peso | Reps | Sets | RPE | Note |
|-----------|------|------|------|-----|------|
| Back Squat | 80kg | 8 | 4 | 7 | Buona profondità |
| Leg Press | 120kg | 12 | 3 | 6 | |
| Romanian Deadlift | 60kg | 10 | 3 | 7 | Sentito hamstring |
| Leg Curl | 40kg | 12 | 3 | 6 | |
| Calf Raise | 50kg | 15 | 4 | 5 | |
| Cardio: Incline Walk | — | — | — | 4 | 45 min, 5.5 km/h, 12% incline |
```

---

## 4) Salvare il training log

### Opzione corrente: Note in Supabase

Per ora, i log vengono salvati come note nella cartella `Health/Training`.

#### Creare nota allenamento via Obsidian

```bash
source /opt/openclaw.env
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/obsidian/notes" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Training — {DATA} — {TIPO_SESSIONE}",
    "content": "{MARKDOWN_CONTENT}",
    "folderPath": "Health/Training",
    "fileName": "training-{YYYY-MM-DD}"
  }'
```

### Opzione futura: Tabelle dedicate

Quando verranno create le tabelle dedicate:

#### training_sessions

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| id | uuid PK | Auto-generated |
| date | date | Data sessione |
| session_type | text | Tipo (Weight Lifting, Pilates, PT, Calisthenics, Cardio) |
| duration_min | integer | Durata in minuti |
| notes | text | Note generali sessione |

#### training_exercises

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| id | uuid PK | Auto-generated |
| session_id | uuid FK | Riferimento alla sessione |
| exercise_name | text | Nome esercizio |
| weight_kg | numeric | Peso in kg |
| reps | integer | Ripetizioni |
| sets | integer | Serie |
| rpe | integer | RPE (1-10) |
| notes | text | Note esercizio |

---

## 5) Confronto con sessione precedente

Per ogni esercizio registrato, cercare l'ultima sessione con lo stesso esercizio e confrontare.

### Query ultima sessione per esercizio

Basandosi sulle note Obsidian, cercare il training log più recente e parsare i valori.

Quando saranno disponibili le tabelle dedicate:

```sql
SELECT te.exercise_name, te.weight_kg, te.reps, te.sets, te.rpe, ts.date
FROM training_exercises te
JOIN training_sessions ts ON te.session_id = ts.id
WHERE te.exercise_name = '{EXERCISE_NAME}'
  AND ts.date < '{DATA_CORRENTE}'
ORDER BY ts.date DESC
LIMIT 1;
```

### Analisi progressione

| Situazione | Verdict |
|------------|---------|
| Reps aumentati con stesso peso e RPE | Progressione |
| Peso aumentato con stessi reps e RPE | Progressione |
| Stesso peso + stessi reps + RPE più basso | Progressione |
| Reps diminuiti o peso diminuito | Regressione |
| Tutto uguale | Stallo |

### In caso di regressione

Verificare questi fattori:
- **Sonno**: ha dormito abbastanza?
- **Nutrizione**: ha mangiato abbastanza kcal/proteine nei giorni precedenti?
- **Recovery**: è passato abbastanza tempo dall'ultimo allenamento dello stesso gruppo muscolare?
- **Stress**: fattori esterni?

---

## 6) Daily recap (ore 21:00)

Ogni sera, produrre un recap giornaliero:

```
📊 Recap — {DATA}

Peso: {PESO} kg ({+/- rispetto a ieri})
Kcal: {TOTALE}/{TARGET} ({rimanenti o sforamento})
Proteine: {TOTALE}/{TARGET}g
Allenamento: {FATTO/SALTATO} — {TIPO_SESSIONE}
{Se fatto: highlight progressione o regressione}

⚠️ Flag:
- {eventuali problemi: pasto saltato, allenamento saltato, sforamento kcal, etc.}
```

---

## 7) Weekly review (Domenica ore 20:00)

Ogni domenica, produrre una review settimanale:

```
📈 Review Settimanale — Settimana {N}

### Peso
- Inizio settimana: {PESO_LUN} kg
- Fine settimana: {PESO_DOM} kg
- Delta: {DIFFERENZA} kg

### Nutrizione
- Media kcal/giorno: {MEDIA} (target: 1.900)
- Media proteine/giorno: {MEDIA}g (target: 135g)
- Giorni in target kcal: {N}/7
- Giorni in target proteine: {N}/7

### Allenamento
- Sessioni completate: {N}/6
- Sessioni saltate: {LISTA}
- Consistency score: {PERCENTUALE}%

### Confronto settimana precedente
- Peso: {TREND}
- Kcal media: {TREND}
- Proteine media: {TREND}
- Sessioni: {TREND}

### Note
- {Osservazioni, pattern, suggerimenti}
```

---

## Log operativo

Dopo ogni registrazione, annotare:
- Sessione registrata (data + tipo)
- Esercizi con peso/reps/sets
- Progressioni o regressioni rilevate
- Totale giornaliero (peso, kcal, proteine, allenamento)
- Eventuali flag o anomalie
```

---

=== FILE: comm-email/SKILL.md (SEZIONI DA APPENDERE) ===

```markdown
## 10) Inviare email (via Railway backend)

### POST /send (nuova email)

```bash
source /opt/openclaw.env
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/send" \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["dest@example.com"],
    "subject": "Subject",
    "textBody": "Plain text body",
    "htmlBody": null,
    "cc": [],
    "bcc": []
  }'
```

Non servono header di autenticazione per il backend Railway.

### POST /reply (rispondere a email)

```bash
source /opt/openclaw.env
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/reply" \
  -H "Content-Type: application/json" \
  -d '{
    "inReplyTo": "{FASTMAIL_EMAIL_ID}",
    "to": ["dest@example.com"],
    "textBody": "Reply text",
    "cc": []
  }'
```

NOTA: `inReplyTo` = Fastmail email ID. Corrisponde al campo `gmail_id` nella tabella `emails`, oppure `fastmail_id` nella tabella di staging `command_center_inbox`.

### POST /forward (inoltrare email)

```bash
source /opt/openclaw.env
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/forward" \
  -H "Content-Type: application/json" \
  -d '{
    "emailId": "{FASTMAIL_EMAIL_ID}",
    "to": ["dest@example.com"],
    "textBody": "FYI, see forwarded email below."
  }'
```

### POST /archive (archiviare email in Fastmail)

```bash
source /opt/openclaw.env
curl -sS -X POST "${COMMAND_CENTER_BACKEND_URL}/archive" \
  -H "Content-Type: application/json" \
  -d '{"emailId": "{FASTMAIL_EMAIL_ID}"}'
```

Sposta l'email dalla Inbox all'archivio in Fastmail. Non cancella l'email, resta cercabile.

---

## 11) Creare bozze email in Fastmail

### Parametri da raccogliere

Prima di creare una bozza, servono:
- **to**: nome e email del destinatario
- **subject**: oggetto dell'email
- **body**: testo della mail
- **cc** (opzionale): destinatari in copia

### Trovare email del destinatario

```sql
SELECT c.first_name, c.last_name, ce.email
FROM contacts c JOIN contact_emails ce ON c.contact_id = ce.contact_id
WHERE (c.first_name ILIKE '%{NOME}%' AND c.last_name ILIKE '%{COGNOME}%')
ORDER BY ce.is_primary DESC LIMIT 3;
```

Se ci sono più email per lo stesso contatto, preferire quella con `is_primary = true`.

### Creare draft via JMAP

```bash
source /opt/openclaw.env
curl -s -X POST "https://api.fastmail.com/jmap/api/" \
  -H "Authorization: Bearer $FASTMAIL_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "using": ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:mail"],
    "methodCalls": [
      ["Email/set", {
        "accountId": "'"$FASTMAIL_ACCOUNT_ID"'",
        "create": {
          "draft1": {
            "mailboxIds": {"P3V": true},
            "keywords": {"$draft": true},
            "from": [{"name": "Simone Cimminelli", "email": "'"$FASTMAIL_FROM_EMAIL"'"}],
            "to": [{"name": "{DEST_NAME}", "email": "{DEST_EMAIL}"}],
            "subject": "{SUBJECT}",
            "textBody": [{"partId": "body", "type": "text/plain"}],
            "bodyValues": {"body": {"value": "{BODY_TEXT}"}}
          }
        }
      }, "0"]
    ]
  }'
```

### Varianti

**Per aggiungere CC:**

Aggiungere il campo `"cc"` allo stesso livello di `"to"`:

```json
"cc": [{"name": "Nome CC", "email": "cc@example.com"}]
```

**Per body HTML** (al posto di plain text):

Sostituire `"textBody"` con `"htmlBody"`:

```json
"htmlBody": [{"partId": "body", "type": "text/html"}],
"bodyValues": {"body": {"value": "<p>Contenuto HTML della mail</p>"}}
```

### Verifica successo

La risposta contiene `"created": {"draft1": {"id": "..."}}` se la bozza è stata creata con successo.

Se la risposta contiene `"notCreated"`, c'è stato un errore — controllare il campo `"description"` per dettagli.

### Importante

Questo comando NON invia la mail. Salva solo come bozza nella cartella Drafts di Fastmail. Simone potrà rivederla e inviarla manualmente dal client Fastmail.