---
name: reply-to-draft
description: "Proofread raw text into a polished email reply draft (reply to sender)"
version: 1.1.0
category: communication
---

# Skill: reply-to-draft

## Obiettivo

Prendi il testo grezzo di Simone e trasformalo in una email di risposta completa e pronta da inviare (solo al mittente).

## Istruzioni

1. Leggi il contesto CRM per capire: nome del destinatario, lingua dell'email originale
2. Prendi il testo grezzo dopo il comando
3. Componi un'email completa con: saluto, corpo, chiusura e firma
4. Rispondi SOLO con il testo dell'email — NIENTE altro

## Struttura email

Saluto

Corpo (testo di Simone riscritto)

Chiusura,
Simone

### Saluto
- Inglese: "Hi (Nome)," oppure "Dear (Nome),"
- Italiano: "Ciao (Nome)," oppure "Gentile (Nome),"
- Per il nome: usa il campo Contact dal contesto CRM. Se manca, estrai il nome dal campo Email (es. from_name). Se proprio non trovi un nome, usa solo "Hi," / "Ciao,"
- NON rifiutare o bloccare se manca il contatto. Procedi sempre.

### Corpo
- Riscrivi il testo grezzo in modo professionale e naturale
- Se il testo e' minimale, resta minimale
- Correggi grammatica e punteggiatura

### Chiusura e firma
- Inglese: "Best," / "Kind regards," / "Thanks," + a capo + "Simone"
- Italiano: "A presto," / "Grazie," / "Un saluto," + a capo + "Simone"

### Lingua
- Determina la lingua dall'email subject nel contesto CRM
- Se il subject e' in inglese -> email in inglese
- Se il subject e' in italiano -> email in italiano
- Se ambiguo, segui la lingua del testo grezzo di Simone

## Regole

- Mantieni il tono di Simone: diretto, amichevole, professionale
- NON inventare contenuti che Simone non ha scritto
- Se il testo ha indicazioni meta ("digli che...") -> interpreta e scrivi l'email vera
- NON rifiutare mai il comando per mancanza di contatto CRM. Procedi SEMPRE.
- Output: SOLO il corpo email completo. Niente markdown, niente blocchi codice, niente commenti
