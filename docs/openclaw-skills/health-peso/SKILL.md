---
name: health-peso
description: "Body weight and composition tracking with trend analysis"
version: 2.0.0
category: health
---

# skills/tracking-peso.md

Obiettivo: gestire il tracking del peso corporeo di Simone, monitorare composizione corporea (lean mass, body fat) e fornire insights su trend e progress.

## 0) Prerequisiti
- Variabili env caricate: `source /opt/openclaw.env`
- Accesso Supabase via REST: `SUPABASE_URL`, `SUPABASE_KEY`
- Tabella: `body_metrics` (date, weight_kg, lean_mass_kg, body_fat_kg, body_fat_pct, lean_pct, notes, created_at)

## Struttura Tabella (body_metrics)

| Campo | Tipo | Descrizione |
|---|---|---|
| date | date | Data della misurazione (PK) |
| weight_kg | numeric | Peso totale in kg |
| lean_mass_kg | numeric | Massa magra in kg (muscoli, ossa, acqua) |
| body_fat_kg | numeric | Massa grassa in kg |
| body_fat_pct | numeric | Percentuale grasso corporeo |
| lean_pct | numeric | Percentuale massa magra |
| notes | text | Note sulla misurazione (mood, condizioni, ecc) |
| created_at | timestamp | Timestamp creazione record |

## 1) Registrare misurazione giornaliera

### Input
- date (es. "2026-03-07", default: today)
- weight_kg (numero, es. 94)
- lean_mass_kg (default: **70.5**, salvo diverso ordine da Simone)
- notes (opzionale, es. "Morning fasted", "Post meal")

### Logica
- **Massa magra fissa a 70.5 kg** — salvo Simone non dica diversamente
- Se Simone dice "sono 94" → registra: weight=94, lean=70.5, bf=23.5

### Calcoli automatici
- `body_fat_kg = weight_kg - lean_mass_kg`
- `body_fat_pct = (body_fat_kg / weight_kg) * 100`
- `lean_pct = 100 - body_fat_pct`

### Template semplificato (curl + log)
```bash
source /opt/openclaw.env

DATE=$(date +%Y-%m-%d)
WEIGHT=94           # Simone dice il numero
LEAN=70.5           # DEFAULT FISSO (salvo diverso ordine)
NOTES="Morning"     # Opzionale

# Calcoli
BODY_FAT=$(echo "scale=1; $WEIGHT - $LEAN" | bc)
BF_PCT=$(echo "scale=1; ($BODY_FAT / $WEIGHT) * 100" | bc)

RESP=$(curl -sS -X POST "${SUPABASE_URL}/rest/v1/body_metrics" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"date\": \"$DATE\",
    \"weight_kg\": $WEIGHT,
    \"lean_mass_kg\": $LEAN,
    \"body_fat_kg\": $BODY_FAT,
    \"body_fat_pct\": $BF_PCT,
    \"notes\": \"$NOTES\"
  }")

cat >> ops-log.md <<EOF
- Body Metrics: registrata | date:$DATE | weight:$WEIGHT kg | lean:$LEAN | bf:$BODY_FAT kg ($BF_PCT%)
EOF

echo "✅ Registrato: $WEIGHT kg, BF $BF_PCT%"
```

### Esempio flusso conversazionale
```
💬 Barbara: "Simone buongiorno. ☀️ Peso oggi?"
💬 Simone: "94"
💬 Barbara: "✅ Registrato: 94 kg, BF 25.0%"
   [Dietro le quinte: weight=94, lean=70.5, body_fat=23.5, bf%=25.0]
```

## 2) Consultare trend

### Ultima misurazione
```bash
GET ${SUPABASE_URL}/rest/v1/body_metrics?order=date.desc&limit=1
```

### Ultimi N giorni (es. 30)
```bash
GET ${SUPABASE_URL}/rest/v1/body_metrics?order=date.desc&limit=30
```

### Ultimi N giorni (filtro data)
```bash
# Ultimi 30 giorni da oggi
GET ${SUPABASE_URL}/rest/v1/body_metrics?date=gte.2026-02-06&order=date.desc
```

### Output tipico
```json
[
  {
    "date": "2026-03-04",
    "weight_kg": 92.7,
    "lean_mass_kg": 70.5,
    "body_fat_kg": 22.2,
    "body_fat_pct": 23.9,
    "notes": "Morning"
  }
]
```

## 3) Analizzare progress

### Metriche chiave
- **Peso totale**: tendenza generale (calare grasso, mantenere/aumentare muscolo)
- **Lean mass**: deve restare stabile o crescere (con allenamento)
- **Body fat %**: deve calare (con disciplina alimentare)
- **Body fat kg**: deve calare
- **Composizione**: il goal è: weight ↓, bf% ↓, lean mass ↑

### Comparazione periodi
1. Ultimo giorno vs. 7 giorni fa
2. Ultimo giorno vs. 30 giorni fa
3. Week-on-week average vs. previous week

### Interpretazione
```
Scenario 1: Weight ↓, BF% ↓, Lean ↔ → BUONO (perdita grasso)
Scenario 2: Weight ↓, BF% ↔, Lean ↓ → PROBLEMA (perdita muscolo)
Scenario 3: Weight ↔, BF% ↓, Lean ↑ → OTTIMO (guadagno muscolo)
Scenario 4: Weight ↑, BF% ↑, Lean ↔ → PROBLEMA (guadagno grasso)
```

## 4) Flusso di interazione tipico

### Mattina (6:10 AM)
1. Prompt: "Pronto per il peso? (weight_kg)"
2. Registra misurazione
3. Mostra: ultima misurazione + trend 7gg + commento

### Settimanale (lunedì 20:00)
1. Consultare avg weight della settimana
2. Confrontare vs settimana precedente
3. Alert su progress vs goal
4. Mostrare composizione (weight, lean, bf%)

### Mensile
1. Consultare avg weight del mese
2. Trend completo (grafico ASCII o numeri)
3. Valutazione su 7 comandamenti vs "mangio da atleta"

## 5) Log operativo
Ogni azione finisce in `ops-log.md`:
- timestamp
- azione (registered, viewed trend, analyzed)
- date, weight, bf%
- risultato (delta vs last, trend direction)
