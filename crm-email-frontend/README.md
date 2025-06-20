# CRM Email Marketing Frontend

Interfaccia frontend per creare e gestire liste email che si integra con le Supabase Edge Functions.

## 🚀 Come Iniziare

### Installazione
```bash
cd crm-email-frontend
npm install
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:5173`

## 📧 Funzionalità Create Email List

### Interfaccia Semplice
- **Pagina**: "Create List (Simple)"
- **Componente**: `CreateEmailList.tsx`
- Interfaccia base per creare liste email

### Interfaccia Avanzata
- **Pagina**: "Create List (Advanced)" 
- **Componente**: `CreateEmailListPage.tsx`
- Interfaccia completa con selezione contatti e statistiche

## 🔧 Edge Function Integration

### Endpoint
```
POST https://efazuvegwxouysfcgwja.supabase.co/functions/v1/create-email-list
```

### Parametri Richiesti
```typescript
{
  name: string,              // Nome della lista (obbligatorio)
  description?: string,      // Descrizione opzionale
  listType: 'static' | 'dynamic',  // Tipo di lista
  queryFilters?: object,     // Filtri per liste dinamiche
  contactIds: string[]       // Array di ID contatti (per liste statiche)
}
```

### Esempio di Chiamata
```javascript
const response = await fetch('https://efazuvegwxouysfcgwja.supabase.co/functions/v1/create-email-list', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY',
    'apikey': 'YOUR_SUPABASE_ANON_KEY'
  },
  body: JSON.stringify({
    name: 'My Email List',
    description: 'Lista per campagna Q1 2024',
    listType: 'static',
    contactIds: ['contact-1', 'contact-2', 'contact-3']
  })
})
```

### Risposta di Successo
```json
{
  "success": true,
  "message": "List created successfully",
  "list": {
    "list_id": "uuid-here",
    "name": "My Email List",
    "description": "Lista per campagna Q1 2024",
    "list_type": "static",
    "total_contacts": 3,
    "active_contacts": 3,
    "created_at": "2024-01-15T10:30:00Z",
    "members_count": 3
  }
}
```

## 🎨 Caratteristiche UI

### Tema Matrix
- **Colori**: Verde su nero (stile Matrix)
- **Font**: Monospace per il look cyberpunk
- **Animazioni**: Effetti glow e transizioni fluide

### Componenti Principali
- **CreateEmailListForm**: Form principale per creazione liste
- **ContactFilters**: Filtri per selezione contatti
- **ContactList**: Lista contatti con ricerca
- **Button**: Componente button personalizzato

## 📱 Responsive Design
- Layout adattivo per desktop e mobile
- Sidebar collassabile
- Grid responsive per statistiche

## 🔍 Funzionalità Avanzate

### Selezione Contatti
- Ricerca per nome
- Checkbox multipla
- Statistiche in tempo reale
- Validazione email

### Validazione
- Nome lista obbligatorio
- Almeno un contatto per liste statiche
- Controllo formato email
- Feedback errori in tempo reale

### Stati Loading
- Spinner durante caricamento contatti
- Disabilitazione bottoni durante invio
- Messaggi di successo/errore

## 🛠️ Sviluppo

### Struttura File
```
src/
├── components/
│   ├── CreateEmailListForm.tsx    # Form avanzato
│   ├── CreateEmailList.tsx        # Form semplice
│   ├── ContactFilters.tsx         # Filtri contatti
│   └── ui/
│       └── Button.tsx             # Componente button
├── pages/
│   └── CreateEmailListPage.tsx    # Pagina completa
├── lib/
│   └── supabase.ts               # Client Supabase
└── App.tsx                       # App principale
```

### Tecnologie
- **React 18** con TypeScript
- **Vite** per build e dev server
- **Tailwind CSS** per styling
- **Lucide React** per icone
- **Supabase** per backend

## 🚀 Deploy

### Build Production
```bash
npm run build
```

### Variabili Ambiente
```env
VITE_SUPABASE_URL=https://efazuvegwxouysfcgwja.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 📝 Testing Edge Function

### Con curl
```bash
curl -i --location --request POST 'https://efazuvegwxouysfcgwja.supabase.co/functions/v1/create-email-list' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "name": "Test List",
    "description": "Lista di test",
    "listType": "static",
    "contactIds": ["contact-id-1", "contact-id-2"]
  }'
```

### Con JavaScript
```javascript
// Test dalla console browser
const testCreateList = async () => {
  const response = await fetch('https://efazuvegwxouysfcgwja.supabase.co/functions/v1/create-email-list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    },
    body: JSON.stringify({
      name: 'Test dalla Console',
      listType: 'static',
      contactIds: ['test-1', 'test-2']
    })
  })
  
  console.log(await response.json())
}

testCreateList()
```

## 🎯 Prossimi Passi

1. **Liste Dinamiche**: Implementare filtri dinamici
2. **Gestione Liste**: Pagina per modificare/eliminare liste
3. **Invio Email**: Interfaccia per campagne email
4. **Analytics**: Dashboard con statistiche dettagliate
5. **Template**: Editor per template email

## 🐛 Debug

### Problemi Comuni
- **CORS Error**: Verificare headers Authorization e apikey
- **404 Function**: Controllare che la Edge Function sia deployata
- **Contatti non caricati**: Verificare connessione database
- **Styling rotto**: Controllare Tailwind CSS setup

### Log Debugging
```javascript
// Abilitare log dettagliati
localStorage.setItem('debug', 'true')
```
