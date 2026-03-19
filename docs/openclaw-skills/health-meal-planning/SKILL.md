---
name: health-meal-planning
description: "Meal planning, recipes, shopping lists and batch cooking"
version: 2.0.0
category: health
---

# Skill: Meal Planning & Ricette

Obiettivo: aiutare Simone (e famiglia) con ricette, meal planning settimanale, lista della spesa e suggerimenti “cosa cucinare”, con preferenze, vincoli e porzioni.

## Cosa so fare
- Cercare/riassumere ricette (anche partendo da ingredienti disponibili)
- Proporre menu settimanali (colazione/pranzo/cena) con varietà e ripetizioni controllate
- Generare lista della spesa aggregata (per categorie) + quantità
- Adattare ricette: porzioni, sostituzioni (lattosio, glutine, vegetariane, ecc.)
- Pianificazione “batch cooking” (preparazioni base riusabili)

## Input che mi servono (minimo)
- Numero persone + eventuali bimbi
- Obiettivo (risparmio tempo, più proteine, mediterranea, dimagrimento, ecc.)
- Vincoli/allergie/disgusti
- Budget e giorni disponibili per cucinare
- Attrezzatura (forno, air fryer, slow cooker, ecc.)

## Workflow (esempi)
### 1) Menu settimanale rapido
1. Chiedo vincoli e numero pasti
2. Propongo 7 giorni (con 2–3 “avanzi intelligenti”)
3. Conferma + varianti
4. Output: menu + prep plan + lista spesa

### 2) “Ho questi ingredienti, cosa cucino?”
- Input: ingredienti + tempo disponibile
- Output: 3 opzioni (facile/medio/veloce) + istruzioni sintetiche

## Struttura dati (opzionale, futura)
Se vogliamo persistenzare su DB (es. Supabase), tabelle suggerite:

### `recipes`
- id (uuid)
- title (text)
- cuisine (text)
- servings (int)
- prep_time_min (int)
- cook_time_min (int)
- instructions (text/markdown)
- notes (text)
- tags (text[])

### `recipe_ingredients` (TODO)
- recipe_id (uuid)
- ingredient (text)
- quantity (numeric)
- unit (text)
- optional (bool)

### `weekly_menus` (TODO)
- id (uuid)
- week_start (date)
- people (int)
- plan (jsonb)  // struttura: giorno -> pasti -> recipe_id/descrizione
- shopping_list (jsonb)

## Output standard
- **Menu** (giorno/pasto)
- **Prep plan** (cosa preparare in anticipo, quando)
- **Lista spesa** (categorie: frutta/verdura, proteine, latticini, dispensa, surgelati)

## Note di stile
- Diretto, pratico, con alternative.
- Se mancano dati: assumo default ragionevoli e lo dichiaro.
