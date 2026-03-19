---
name: health-meal-logging
description: "Log meals, estimate kcal/protein, track daily nutrition totals"
version: 1.0.0
category: health
---

# Health Meal Logging — Registrazione Pasti e Tracking Nutrizionale

## Obiettivo

Registrare i pasti di Simone, stimare kcal e proteine per ogni ingrediente, salvare nel database e tracciare i totali giornalieri rispetto agli obiettivi di calorie cycling.

---

## Prerequisiti

```bash
source /opt/openclaw.env
```

Variabili necessarie:
- `$SUPABASE_URL` — URL progetto Supabase
- `$SUPABASE_KEY` — Service role key Supabase

---

## 1) Obiettivi di calorie cycling

### Target giornalieri

| Giorno | Kcal target | Note |
|--------|-------------|------|
| Lunedì | 1.700 | Giorno standard |
| Martedì | 1.700 | Giorno standard |
| Mercoledì | 1.700 | Giorno standard |
| Giovedì | 1.700 | Giorno standard |
| Venerdì | 1.700 | Giorno standard |
| Sabato | ~2.600 | Cooking day |
| Domenica | ~2.200 | Cena leggera |

**Media settimanale target**: 1.900 kcal/giorno

### Proteine

**Target giornaliero**: 130-140g di proteine

---

## 2) Struttura dei 5 pasti giornalieri

| Pasto | Codice | Ora | Cosa | Kcal stima | Proteine stima |
|-------|--------|-----|------|------------|----------------|
| Colazione | B | 07:30 | Porridge 50g avena + 200ml latte avena | 280 | 8g |
| Snack 1 | S1 | 10:30 | 1 frutto + 30g frutta secca | 270 | 5g |
| Pranzo | L | 12:30 | 80g cereali (secchi) + 100g legumi (cotti) + verdure | 500 | 18g |
| Snack 2 | S2 | 16:15 | 150g yogurt greco + 2 scoops proteine | 330 | 63g |
| Cena | D | 18:30 | 150g proteina + verdure + cioccolato fondente | 510 | 42g |

---

## 3) Tabelle del database

### meals

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| id | integer PK | Auto-increment |
| date | date | Data del pasto |
| meal_type | text | `B`, `S1`, `L`, `S2`, `D` |
| name | text | Descrizione breve del pasto |
| servings | numeric | Numero porzioni (default 1) |
| recipe_id | uuid FK | Opzionale, riferimento a ricetta |
| image_url | text | URL immagine del pasto |

### meal_ingredients

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| id | integer PK | Auto-increment |
| meal_id | integer FK | Riferimento al pasto |
| ingredient_id | uuid FK | Riferimento all'ingrediente |
| quantity_g | numeric | Quantità in grammi |

### ingredients

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| id | uuid PK | Auto-generated |
| name | text | Nome ingrediente |
| kcal_per_100g | numeric | Calorie per 100g |
| protein_per_100g | numeric | Proteine per 100g |
| fat_per_100g | numeric | Grassi per 100g |
| carbs_per_100g | numeric | Carboidrati per 100g |
| sugar_per_100g | numeric | Zuccheri per 100g |
| fibre_per_100g | numeric | Fibre per 100g |
| salt_per_100g | numeric | Sale per 100g |
| category | text | Categoria ingrediente |
| brand | text | Marca (opzionale) |
| serving_size_g | numeric | Porzione standard in grammi |
| image_url | text | URL immagine ingrediente |

---

## 4) Workflow di logging

### Passo 1: Simone descrive il pasto (testo o foto)

Se è una **foto**, analizzare visivamente e stimare:
- Ogni ingrediente visibile
- Quantità approssimativa in grammi
- Kcal e proteine per ingrediente
- Totale del pasto

Se è **testo**, estrarre gli ingredienti e le quantità.

### Passo 2: Mostrare la stima a Simone

Formato tabellare:

```
🍽️ Pranzo — 12:30

| Ingrediente | Quantità | Kcal | Proteine |
|-------------|----------|------|----------|
| Riso basmati (secco) | 80g | 288 | 6g |
| Ceci (cotti) | 100g | 164 | 9g |
| Zucchine | 150g | 26 | 2g |
| Olio EVO | 10ml | 88 | 0g |
| **TOTALE** | | **566** | **17g** |

Budget giornaliero: 1.230/1.700 kcal — Rimangono 470 kcal
Proteine: 94/135g — Mancano 41g
```

### Passo 3: Salvare nel database

#### Verificare o creare ingredienti

```sql
SELECT id, name, kcal_per_100g, protein_per_100g
FROM ingredients
WHERE name ILIKE '%{NOME_INGREDIENTE}%'
LIMIT 5;
```

Se l'ingrediente non esiste, crearlo (con immagine Pexels automatica — vedi Memory).

#### Creare il pasto

```sql
INSERT INTO meals (date, meal_type, name, servings)
VALUES ('{DATA}', '{TIPO}', '{DESCRIZIONE}', 1)
RETURNING id;
```

#### Aggiungere gli ingredienti al pasto

```sql
INSERT INTO meal_ingredients (meal_id, ingredient_id, quantity_g)
VALUES
  ({MEAL_ID}, '{INGREDIENT_ID_1}', {QUANTITA_1}),
  ({MEAL_ID}, '{INGREDIENT_ID_2}', {QUANTITA_2}),
  ({MEAL_ID}, '{INGREDIENT_ID_3}', {QUANTITA_3});
```

---

## 5) Totale giornaliero corrente

### Query totali del giorno

```sql
SELECT 
  m.meal_type,
  m.name,
  SUM(mi.quantity_g * i.kcal_per_100g / 100) AS total_kcal,
  SUM(mi.quantity_g * i.protein_per_100g / 100) AS total_protein
FROM meals m
JOIN meal_ingredients mi ON m.id = mi.meal_id
JOIN ingredients i ON mi.ingredient_id = i.id
WHERE m.date = CURRENT_DATE
GROUP BY m.id, m.meal_type, m.name
ORDER BY 
  CASE m.meal_type 
    WHEN 'B' THEN 1 
    WHEN 'S1' THEN 2 
    WHEN 'L' THEN 3 
    WHEN 'S2' THEN 4 
    WHEN 'D' THEN 5 
  END;
```

### Somma totale del giorno

```sql
SELECT 
  SUM(mi.quantity_g * i.kcal_per_100g / 100) AS daily_kcal,
  SUM(mi.quantity_g * i.protein_per_100g / 100) AS daily_protein
FROM meals m
JOIN meal_ingredients mi ON m.id = mi.meal_id
JOIN ingredients i ON mi.ingredient_id = i.id
WHERE m.date = CURRENT_DATE;
```

---

## 6) Analisi foto pasto

Quando Simone invia una foto del cibo:

1. **Identificare** ogni alimento visibile nella foto
2. **Stimare** le porzioni in grammi (basandosi su dimensioni piatto, proporzioni)
3. **Calcolare** kcal e proteine per ogni ingrediente
4. **Sommare** per il totale del pasto
5. **Confrontare** con il budget giornaliero rimanente
6. **Segnalare** se il pasto sfora il budget o se le proteine sono insufficienti

---

## 7) Regole nutrizionali

- **Niente cibo dopo le 19:00**
- **Niente alcol**
- **Niente caffè**
- **Carboidrati concentrati al mattino**, proteine alla sera
- **~3 ore tra un pasto e l'altro**
- **Attenzione alle porzioni di frutta secca** (alta densità calorica)

---

## 8) Attrezzatura cucina disponibile

Per suggerimenti di ricette o metodi di cottura, Simone ha a disposizione:
- Air Fryer
- Thermomix / Bimby
- Nutribullet
- KitchenAid
- Magic Mix (x3)
- Slow Cooker
- Instant Pot
- M-Cuisine Rice Cooker

---

## Log operativo

Dopo ogni registrazione, annotare:
- Pasto registrato (tipo + descrizione)
- Kcal e proteine del pasto
- Totale giornaliero aggiornato (kcal e proteine)
- Kcal rimanenti rispetto al target del giorno
- Proteine rimanenti rispetto al target
- Eventuali flag (sforamento, pasto saltato, orario anomalo)
```

---