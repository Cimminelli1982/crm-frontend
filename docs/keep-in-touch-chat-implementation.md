# Keep in Touch Chat Implementation

## Obiettivo
Aggiungere una tab Chat nella sezione Keep in Touch che permetta a Claude di vedere il contatto selezionato e tutti i dati correlati.

## Cosa è stato fatto

### 1. Aggiunta Tab Chat in Keep in Touch
- File: `src/pages/CommandCenterPage.js`
- Aggiunta icona FaRobot nella barra delle tab (dopo Email)
- Aggiunto rendering condizionale del componente ChatTab quando `activeActionTab === 'kitChat'`

### 2. Bottoni Quick Action per Keep in Touch
- File: `src/components/command-center/ChatTab.js`
- Aggiunto prop `keepInTouchMode`
- Bottoni specifici: Calendar, Note, Task, Deal, Intro, WhatsApp, Email
- Stile: sfondo neutro con icone colorate

### 3. Context per Claude
- File: `src/hooks/useChatWithClaude.js`
- Aggiunto parametro `keepInTouchContact` e altri dati correlati
- Funzione `buildKeepInTouchContext()` che costruisce il context string

### 4. Fetch dati correlati (PROBLEMATICO)
- File: `src/pages/CommandCenterPage.js`
- useEffect che fetcha quando `selectedKeepInTouchContact?.contact_id` cambia:
  - `notes_contacts` -> `notes` (campo `text`, non `content`)
  - `deals_contacts` -> `deals` (campo `opportunity`, non `deal_name`)
  - `introduction_contacts` -> `introductions`
  - `command_center_inbox` per email recenti
- **RIMOSSA** query `tasks` (tabella non esiste)

### 5. Fix ordine useState
- Gli state Keep in Touch erano dichiarati DOPO la chiamata a `useChatWithClaude`
- Spostati PRIMA della chiamata al hook (linea ~429)

## Problemi attuali

### Il contatto non viene letto correttamente
- La view `mv_keep_in_touch` ritorna campi diversi dalla tabella `contacts`
- `buildKeepInTouchContext()` usa `first_name`/`last_name` ma la view probabilmente usa `full_name`
- I dati visibili nell'UI (nome, tag, job, company, interactions) NON arrivano a Claude

### keepInTouchFullContext è sempre null
- Le query Supabase per notes/deals/introductions potrebbero fallire
- I dati non vengono caricati nel state `keepInTouchFullContext`

## File modificati
1. `src/pages/CommandCenterPage.js` - State, useEffect, rendering ChatTab
2. `src/hooks/useChatWithClaude.js` - Hook con context Keep in Touch
3. `src/components/command-center/ChatTab.js` - Prop keepInTouchMode e bottoni

## TODO per completare
1. Verificare i campi esatti della view `mv_keep_in_touch`
2. Aggiornare `buildKeepInTouchContext()` per usare i campi corretti
3. Debug delle query Supabase per notes/deals/introductions
4. Testare che Claude riceva tutti i dati del contatto
