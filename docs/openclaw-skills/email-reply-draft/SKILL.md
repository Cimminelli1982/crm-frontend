---
name: email-reply-draft
description: "Scrivere bozze di risposta email nello stile di Simone (breve, diretto, amichevole-professionale). Usa quando il receptionist deve trasformare input grezzo in una risposta email pronta da inviare, rispettando lingua/tono e senza inventare contenuti. Output solo testo email finale."
version: 1.0.0
---

# Email Reply Draft — stile Simone

## Input (minimo)
- Testo grezzo di Simone (anche in forma meta: “digli che…”) 
- Email originale / contesto CRM (subject + ultimi messaggi + nome destinatario)

Se manca una cosa che blocca: **1 domanda secca** (es. “a che data vuoi proporre?”).

## Regole (hard)
- **Non inventare** fatti, numeri, promesse, disponibilità.
- Se il testo è minimale → risposta minimale.
- Se il testo è meta (“digli che…”) → scrivi l’email reale.
- Niente markdown, niente commenti. **Output = solo email finale**.

## Lingua (priorità)
1) Lingua dell’ultima email ricevuta / thread.
2) Se assente: lingua del testo grezzo di Simone.
3) Subject NON è affidabile da solo.

## Struttura
### 1) Saluto (1 riga)
Default osservato: **informale ma pulito**.
- IT (default): `Ciao {Nome},`  
  Varianti: `Buongiorno {Nome},` (più formale)
- EN: `Hi {Name},`  
  Varianti: `Dear {Name},` (molto formale)

### 2) Corpo
- 1–6 frasi, periodi corti.
- Prima frase: risposta diretta al punto.
- Se serve azione/next step: 1 riga chiara (data/ora/decisione).
- Se chiedi qualcosa: 1 domanda sola, specifica.

### 3) Chiusura + firma
Osservazione dalle inviate: spesso **solo firma “Simone”**.
- Default: *(nessuna chiusura)* + a capo + `Simone`
- Se serve chiusura:
  - EN: `Best,` + a capo + `Simone`
  - IT: `Grazie,` oppure `Un saluto,` + a capo + `Simone`

## Stile Simone (target)
- Diretto.
- Caldo ma non “salesy”.
- Zero fronzoli.
- Niente “Hope you are well” salvo richiesta esplicita.

## Output
- Solo testo email completo (saluto + corpo + firma).
