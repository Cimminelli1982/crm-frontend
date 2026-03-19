---
name: planning
description: "Weekly and daily planning with priorities and time blocks"
version: 1.0.0
category: planning
---

# skills/planning.md

Obiettivo: gestire il planning di Simone su tre livelli (settimanale, quotidiano, priorità) e mantenere il sistema sincronizzato in Supabase.

## 0) Prerequisiti
- Variabili env caricate: `source /opt/openclaw.env`
- Accesso Supabase via REST: `SUPABASE_URL`, `SUPABASE_KEY`
- Tabelle:
  - `weekly_plans` (week_number, year, label, date_start, date_end, notes)
  - `routine_schedule` (day_of_week, time_slot, activity, category, duration_min, notes)
  - `priorities` (title, scope, scope_date, sort_order, is_completed, notes)

## 1) Consultare piano settimanale

### Input
- week_number (opzionale, default: current week)
- year (opzionale, default: current year)

### Output
- lista: week_number, label, date_start, date_end, notes

### Query (Supabase)
```bash
# Piano settimanale corrente
GET ${SUPABASE_URL}/rest/v1/weekly_plans?year=eq.2026&order=week_number.desc&limit=20
```

### Risposta tipica
```json
[
  {
    "week_number": 11,
    "year": 2026,
    "label": "London",
    "date_start": "2026-03-09",
    "date_end": "2026-03-15",
    "notes": "W11: London meetings"
  }
]
```

## 2) Gestire routine giornaliere

### Operazioni
- **Aggiungere** slot quotidiano (es. "6:00 Wake up", "7:30 Breakfast")
- **Aggiornare** durata, activity, note
- **Consultare** routine per day_of_week

### Flusso
1. Identificare giorno: Mon–Sun (day_of_week: 0-6 o names)
2. Identificare fascia oraria (time_slot, es. "6:00", "7:30", "9:30")
3. Aggiungere/aggiornare activity, category, duration_min

### Endpoint (POST/PATCH)
```bash
# Aggiungere routine
POST ${SUPABASE_URL}/rest/v1/routine_schedule
{
  "day_of_week": "Monday",
  "time_slot": "6:00",
  "activity": "Wake up",
  "category": "Morning",
  "duration_min": 0,
  "notes": "Start day"
}

# Aggiornare routine
PATCH ${SUPABASE_URL}/rest/v1/routine_schedule?day_of_week=eq.Monday&time_slot=eq.6:00
{
  "duration_min": 10,
  "notes": "Updated"
}
```

## 3) Tracciare priorità

### Livelli
- **scope**: day, week, month, year (quando scade)
- **sort_order**: 1, 2, 3... (ordine visivo)
- **is_completed**: false (aperta), true (chiusa)

### Operazioni
- **Aggiungere** priorità
- **Completare** (is_completed=true)
- **Consultare** aperte (is_completed=false)
- **Ordinare** by sort_order

### Query
```bash
# Priorità aperte
GET ${SUPABASE_URL}/rest/v1/priorities?is_completed=eq.false&order=sort_order.asc

# Priorità per scope
GET ${SUPABASE_URL}/rest/v1/priorities?scope=eq.week&is_completed=eq.false&order=sort_order.asc
```

### Creare priorità
```bash
POST ${SUPABASE_URL}/rest/v1/priorities
{
  "title": "Chiudere deal coreano",
  "scope": "week",
  "scope_date": "2026-03-14",
  "sort_order": 1,
  "is_completed": false,
  "notes": "Target closure before Ibiza"
}
```

## 4) Flusso di interazione tipico

### Mattina (heartbeat)
1. Consultare routine_schedule per today (day_of_week)
2. Mostrare orari e activities
3. Consultare priorities aperte (scope=day)
4. Alert su completamenti

### Settimanale (richiesta esplicita)
1. GET weekly_plans per week_number corrente
2. Mostrare label, date_start/end, notes
3. Consultare routine_schedule per giorni della settimana
4. Mostrare priorità (scope=week)

### Cambio settimana
1. Consultare new weekly_plans
2. Resetare routine_schedule (copy from template?)
3. Rivedere priorities scope=week (chiudere vecchi, aprire nuovi)

## 5) Log operativo
Ogni azione finisce in `ops-log.md`:
- timestamp
- azione (viewed plan, added routine, completed priority)
- week/day
- entity ID
- risultato
