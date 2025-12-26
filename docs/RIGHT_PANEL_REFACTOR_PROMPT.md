# Right Panel Refactoring - Agent Prompt

## Obiettivo

Refactoring completo della colonna destra del Command Center per renderla **universale e consistente** su tutte le 8 tabs principali.

---

## Contesto Attuale

### File Principale
- `/src/pages/CommandCenterPage.js` (~14k righe)
- Contiene codice inline duplicato per Contact Details (~468 righe) e Company Details (~476 righe)

### 8 Tabs Principali
1. **Email** - Thread email con partecipanti (from/to/cc)
2. **WhatsApp** - Chat con partecipanti (gruppo o 1:1)
3. **Calendar** - Eventi con attendees
4. **Deals** - Pipeline deals con contatti linkati
5. **Keep in Touch** - Lista contatti con frequenza KIT
6. **Introductions** - Introduzioni con introducer/introducees
7. **Notes** - Note con contatti/companies linkati
8. **Lists** - Liste email con membri

### Componenti Esistenti (da riutilizzare)
- `src/components/command-center/WhatsAppChatTab.js`
- `src/components/command-center/SendEmailTab.js`
- `src/components/command-center/ChatTab.js`
- `src/components/command-center/DataIntegrityTab.js`
- `src/components/command-center/CRMTab.js`
- `src/components/command-center/DealsTab.js`
- `src/components/command-center/IntroductionsTab.js`
- `src/components/command-center/TasksTab.js`
- `src/components/command-center/NotesTab.js`
- `src/components/command-center/ListsTab.js`
- `src/components/command-center/NotesFullTab.js`

### Componenti Già Creati (da integrare)
- `src/components/command-center/ContactDetailsTab.js` - Dettagli contatto (editable/readonly)
- `src/components/command-center/CompanyDetailsTab.js` - Dettagli company (editable/readonly)

---

## Nuova Architettura

### 1. Hook Centralizzato: `useContactDetails`

Creare `/src/hooks/useContactDetails.js`:

```javascript
/**
 * Hook per fetchare tutti i dettagli di un contatto
 *
 * @param {string} contactId - UUID del contatto
 * @returns {Object} {
 *   contact,           // dati base da contacts table
 *   emails,            // array da contact_emails
 *   mobiles,           // array da contact_mobiles
 *   companies,         // array da contact_companies + companies join
 *   tags,              // array da contact_tags + tags join
 *   cities,            // array da contact_cities + cities join
 *   completenessScore, // da contact_completeness table
 *   loading,           // boolean
 *   error,             // error object or null
 *   refetch            // function per refresh manuale
 * }
 */
```

**Query da includere:**
```sql
-- contacts base
SELECT contact_id, first_name, last_name, category, job_role,
       show_missing, profile_image_url, linkedin, score,
       birthday, description
FROM contacts WHERE contact_id = $1

-- contact_completeness
SELECT completeness_score FROM contact_completeness WHERE contact_id = $1

-- contact_emails
SELECT email_id, email, is_primary, type
FROM contact_emails WHERE contact_id = $1
ORDER BY is_primary DESC

-- contact_mobiles
SELECT mobile_id, mobile, is_primary, type
FROM contact_mobiles WHERE contact_id = $1
ORDER BY is_primary DESC

-- contact_companies + companies
SELECT cc.contact_companies_id, cc.company_id, cc.is_primary, cc.relationship,
       c.name, c.category, c.website, c.linkedin
FROM contact_companies cc
JOIN companies c ON cc.company_id = c.company_id
WHERE cc.contact_id = $1
ORDER BY cc.is_primary DESC

-- contact_tags + tags
SELECT ct.entry_id, ct.tag_id, t.name
FROM contact_tags ct
JOIN tags t ON ct.tag_id = t.tag_id
WHERE ct.contact_id = $1

-- contact_cities + cities
SELECT cc.entry_id, cc.city_id, c.name, c.country
FROM contact_cities cc
JOIN cities c ON cc.city_id = c.city_id
WHERE cc.contact_id = $1
```

---

### 2. Nuovo Componente: `UniversalRightPanel`

Creare `/src/components/command-center/UniversalRightPanel.js`:

**Props:**
```javascript
{
  theme,                    // 'dark' | 'light'

  // Context - cosa è selezionato nel main panel
  mainTab,                  // 'email' | 'whatsapp' | 'calendar' | 'deals' | 'keepintouch' | 'introductions' | 'notes' | 'lists'
  selectedItem,             // thread | chat | event | deal | contact | intro | note | list

  // Lista contatti disponibili (per dropdown)
  availableContacts,        // Array di { contact_id, first_name, last_name, email, role, completeness_score, show_missing }

  // Callbacks
  onAddContact,             // () => void - apre modal creazione contatto
  onAddCompany,             // () => void - apre modal creazione company
  onAddDeal,                // () => void
  onAddNote,                // () => void
  onAddIntro,               // () => void
  onAddCalendarEvent,       // () => void
  onAddTask,                // () => void
  onAddToList,              // () => void

  // Per Keep in Touch
  onUpdateContactField,     // (field, value) => void
  onManageEmails,           // () => void
  onManageMobiles,          // () => void
  onManageCompanies,        // () => void
  onManageTags,             // () => void
  onManageCities,           // () => void
  onEnrichContact,          // () => void - Apollo enrichment
  onEnrichCompany,          // () => void

  // Per Chat Claude
  chatMessages,
  chatInput,
  setChatInput,
  chatLoading,
  sendMessageToClaude,
  // ... altri props per ChatTab

  // Per Data Integrity
  // ... props esistenti da DataIntegrityTab

  // Per WhatsApp/Email
  // ... props esistenti da WhatsAppChatTab e SendEmailTab

  // Navigation
  navigate,                 // react-router navigate

  // Collapsed state
  collapsed,
  onToggleCollapse,
}
```

**Struttura interna:**

```jsx
<ActionsPanel collapsed={collapsed}>
  {/* Collapse button */}
  <CollapseButton onClick={onToggleCollapse} />

  {/* Dropdown contatti - solo se mainTab !== 'keepintouch' */}
  {mainTab !== 'keepintouch' && availableContacts.length > 0 && (
    <ContactSelector
      contacts={availableContacts}
      selectedContactId={selectedContactId}
      onSelect={setSelectedContactId}
      onAddNew={onAddContact}
    />
  )}

  {/* Tab icons - 10 tabs, alcune nascoste contestualmente */}
  <TabBar>
    <TabIcon id="contact" icon={FaUser} active={activeTab === 'contact'} />
    <TabIcon id="company" icon={FaBuilding} active={activeTab === 'company'} />
    <TabIcon id="chat" icon={FaRobot} active={activeTab === 'chat'} />
    <TabIcon id="dataIntegrity" icon={FaDatabase} active={activeTab === 'dataIntegrity'} />
    <TabIcon id="add" icon={FaPlus} active={activeTab === 'add'} />
    <TabIcon id="whatsapp" icon={FaWhatsapp} active={activeTab === 'whatsapp'} />
    <TabIcon id="email" icon={FaEnvelope} active={activeTab === 'email'} />
    {mainTab !== 'keepintouch' && (
      <TabIcon id="kit" icon={FaBell} active={activeTab === 'kit'} />
    )}
    {mainTab !== 'notes' && (
      <TabIcon id="notes" icon={FaStickyNote} active={activeTab === 'notes'} />
    )}
    {mainTab !== 'lists' && (
      <TabIcon id="lists" icon={FaList} active={activeTab === 'lists'} />
    )}
  </TabBar>

  {/* Tab content */}
  <TabContent>
    {activeTab === 'contact' && (
      <ContactDetailsTab
        theme={theme}
        contact={contactData.contact}
        emails={contactData.emails}
        mobiles={contactData.mobiles}
        companies={contactData.companies}
        tags={contactData.tags}
        cities={contactData.cities}
        editable={mainTab === 'keepintouch'} // editabile solo in KIT
        onUpdateField={onUpdateContactField}
        onEnrich={onEnrichContact}
        onManageEmails={onManageEmails}
        onManageMobiles={onManageMobiles}
        onManageCompanies={onManageCompanies}
        onManageTags={onManageTags}
        onManageCities={onManageCities}
        loading={contactData.loading}
      />
    )}

    {activeTab === 'company' && (
      <CompanyDetailsTab
        theme={theme}
        companies={contactData.companies}
        editable={mainTab === 'keepintouch'}
        // ... altre props
      />
    )}

    {activeTab === 'chat' && <ChatTab {...chatProps} />}
    {activeTab === 'dataIntegrity' && <DataIntegrityTab {...dataIntegrityProps} />}
    {activeTab === 'add' && <AddMenu {...addMenuProps} />}
    {activeTab === 'whatsapp' && <WhatsAppChatTab {...whatsappProps} />}
    {activeTab === 'email' && <SendEmailTab {...emailProps} />}
    {activeTab === 'kit' && <KeepInTouchTab {...kitProps} />}
    {activeTab === 'notes' && <NotesTab {...notesProps} />}
    {activeTab === 'lists' && <ListsTab {...listsProps} />}
  </TabContent>
</ActionsPanel>
```

---

### 2b. Dropdown Secondario Contestuale

Sotto le icone tabs, appare un **dropdown secondario** contestuale quando:

```
┌─────────────────────────────────────────┐
│ [Dropdown Contatto]                      │  ← ContactSelector
├─────────────────────────────────────────┤
│ 👤 🏢 🤖 📊 ➕ 💬 📧 🔔 📝 📋           │  ← TabBar
├─────────────────────────────────────────┤
│ [Dropdown Secondario]                    │  ← SecondarySelector (contestuale)
├─────────────────────────────────────────┤
│  Tab Content                             │
└─────────────────────────────────────────┘
```

**Quando appare il dropdown secondario:**

| Tab Attiva | Dropdown Secondario | Condizione |
|------------|---------------------|------------|
| 🏢 Company | Lista companies | contatto ha 2+ companies |
| 💬 WhatsApp | Lista chat | contatto ha 2+ chat WhatsApp |
| 🤝 Intro (se aggiunta) | Lista introductions | contatto in 2+ intro |
| 📝 Notes | Lista notes | contatto ha 2+ notes linkate |
| 💰 Deals | Lista deals | contatto in 2+ deals |
| 📋 Lists | Lista email lists | contatto in 2+ liste |

**Query aggiuntive per secondary dropdown:**
```sql
-- WhatsApp chats per contatto
SELECT c.id, c.chat_name, c.is_group
FROM chats c
JOIN contact_chats cc ON c.id = cc.chat_id
WHERE cc.contact_id = $1

-- Introductions per contatto
SELECT i.introduction_id, i.introduction_date, i.status,
       ic.role
FROM introductions i
JOIN introduction_contacts ic ON i.introduction_id = ic.introduction_id
WHERE ic.contact_id = $1

-- Notes per contatto
SELECT n.note_id, n.title, n.created_at
FROM notes n
JOIN notes_contacts nc ON n.note_id = nc.note_id
WHERE nc.contact_id = $1

-- Deals per contatto
SELECT d.deal_id, d.opportunity, d.stage
FROM deals d
JOIN deals_contacts dc ON d.deal_id = dc.deal_id
WHERE dc.contact_id = $1

-- Lists per contatto
SELECT l.list_id, l.name
FROM lists l
JOIN list_members lm ON l.list_id = lm.list_id
WHERE lm.contact_id = $1
```

---

### 3. Nuovo Componente: `ContactSelector` (Dropdown)

Creare `/src/components/command-center/ContactSelector.js`:

```jsx
/**
 * Dropdown per selezionare un contatto dalla lista disponibile
 *
 * Mostra per ogni contatto:
 * - Avatar/Initials
 * - Nome completo
 * - Ruolo nel contesto (From, To, CC, Attendee, Introducer, etc.)
 * - % completeness con indicatore visivo
 * - Checkbox "mark as complete" (se show_missing = true)
 *
 * Footer:
 * - "+ Add new contact" link
 */
```

**UI:**
```
┌─────────────────────────────────────────┐
│ [Avatar] Katherine Manson      85% [✓] │ ▼
├─────────────────────────────────────────┤
│ [Av] Ellyn Williams (From)     62%     │
│ [Av] Katherine Manson (CC)     85% ✓   │ ← selected
│ [Av] Barbara Vadrucci (CC)     90% ✓   │
│─────────────────────────────────────────│
│ + Add new contact                       │
└─────────────────────────────────────────┘
```

---

### 4. Nuovo Componente: `AddMenu`

Creare `/src/components/command-center/AddMenu.js`:

Menu per creare nuove entità:
- 👤 Add Contact
- 🏢 Add Company
- 💰 Add Deal
- 📝 Add Note
- 🤝 Add Introduction
- 📅 Add Calendar Event
- ✅ Add Task (Todoist)
- 📋 Add to List

Ogni opzione apre la rispettiva modal.

---

### 5. Nuovo Componente: `KeepInTouchTab`

Creare `/src/components/command-center/KeepInTouchTab.js`:

Mostra e permette di editare le impostazioni Keep in Touch per il contatto selezionato:
- Frequency (dropdown: Not Set, Weekly, Monthly, Quarterly, etc.)
- Why keeping in touch (textarea)
- Snooze days
- Next follow-up notes
- Christmas wishes setting
- Easter wishes setting

Dati dalla tabella `keep_in_touch`:
```sql
SELECT frequency, why_keeping_in_touch, snooze_days,
       next_follow_up_notes, christmas, easter
FROM keep_in_touch
WHERE contact_id = $1
```

---

## Logica Estrazione Contatti per Tab

### Email Tab
```javascript
// Da selectedThread, estrarre:
const availableContacts = [
  ...fromContacts.map(c => ({ ...c, role: 'From' })),
  ...toContacts.map(c => ({ ...c, role: 'To' })),
  ...ccContacts.map(c => ({ ...c, role: 'CC' })),
];
```

### WhatsApp Tab
```javascript
// Da selectedWhatsappChat:
const availableContacts = chat.participants.map(p => ({
  ...p.contact,
  role: chat.is_group ? 'Group Member' : 'Chat'
}));
```

### Calendar Tab
```javascript
// Da selectedCalendarEvent:
const availableContacts = event.attendees.map(a => ({
  ...a.contact,
  role: 'Attendee'
}));
```

### Deals Tab
```javascript
// Da selectedPipelineDeal:
const availableContacts = deal.contacts.map(c => ({
  ...c,
  role: 'Deal Contact'
}));
```

### Keep in Touch Tab
```javascript
// Contatto già selezionato dalla lista sinistra
const availableContacts = [selectedKeepInTouchContact];
// Non mostrare dropdown
```

### Introductions Tab
```javascript
// Da selectedIntroductionItem:
const availableContacts = [
  ...introducers.map(c => ({ ...c, role: 'Introducer' })),
  ...introducees.map(c => ({ ...c, role: 'Introducee' })),
];
```

### Notes Tab
```javascript
// Da selectedNote.linked_contacts:
const availableContacts = note.contacts.map(c => ({
  ...c,
  role: 'Linked'
}));
```

### Lists Tab
```javascript
// Da selectedMember:
const availableContacts = [selectedMember.contact];
// Oppure tutti i membri della lista
```

---

## Visibilità Tabs per Main Tab

| Main Tab | 👤 | 🏢 | 🤖 | 📊 | ➕ | 💬 | 📧 | 🔔 | 📝 | 📋 |
|----------|----|----|----|----|----|----|----|----|----|----|
| Email | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| WhatsApp | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Calendar | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Deals | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Keep in Touch | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Introductions | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Notes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Lists | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## Files da Modificare

### 1. Creare nuovi files
- `/src/hooks/useContactDetails.js`
- `/src/components/command-center/UniversalRightPanel.js`
- `/src/components/command-center/ContactSelector.js`
- `/src/components/command-center/AddMenu.js`
- `/src/components/command-center/KeepInTouchTab.js`

### 2. Modificare files esistenti
- `/src/pages/CommandCenterPage.js` - Rimuovere codice inline Contact/Company Details (~940 righe), usare UniversalRightPanel
- `/src/components/command-center/ListsTab.js` - Rimuovere codice inline, usare hook e componenti condivisi
- `/src/components/command-center/ContactDetailsTab.js` - Già creato, verificare integrazione
- `/src/components/command-center/CompanyDetailsTab.js` - Già creato, verificare integrazione

---

## Database Tables Reference

```
contacts (contact_id uuid PK)
contact_emails (email_id, contact_id FK, email, is_primary, type)
contact_mobiles (mobile_id, contact_id FK, mobile, is_primary, type)
contact_companies (contact_companies_id, contact_id FK, company_id FK, is_primary, relationship)
contact_tags (entry_id, contact_id FK, tag_id FK)
contact_cities (entry_id, contact_id FK, city_id FK)
contact_completeness (contact_id FK, completeness_score)
keep_in_touch (contact_id FK UNIQUE, frequency, why_keeping_in_touch, snooze_days, next_follow_up_notes, christmas, easter)
companies (company_id uuid PK, name, category, website, linkedin, description)
company_domains (company_id FK, domain, is_primary)
company_tags (entry_id, company_id FK, tag_id FK)
company_cities (entry_id, company_id FK, city_id FK)
tags (tag_id uuid PK, name)
cities (city_id, name, country)
```

---

## Testing Checklist

Dopo l'implementazione, verificare che:

1. [ ] Email tab: dropdown mostra from/to/cc, click cambia dettagli
2. [ ] WhatsApp tab: dropdown mostra partecipanti chat/gruppo
3. [ ] Calendar tab: dropdown mostra attendees
4. [ ] Deals tab: dropdown mostra contatti del deal
5. [ ] Keep in Touch: NO dropdown, dettagli contatto selezionato
6. [ ] Introductions: dropdown mostra introducer + introducees
7. [ ] Notes: dropdown mostra contatti linkati
8. [ ] Lists: dettagli membro selezionato
9. [ ] Tutte le 10 tabs funzionano correttamente
10. [ ] Edit mode funziona in Keep in Touch
11. [ ] Read-only mode nelle altre tabs
12. [ ] Completeness % visibile nel dropdown
13. [ ] "Mark as complete" funziona
14. [ ] "Add new contact" nel dropdown funziona
15. [ ] AddMenu crea correttamente tutte le entità
16. [ ] WhatsApp/Email tabs inviano messaggi
17. [ ] Chat Claude ha contesto corretto
18. [ ] Data Integrity mostra issues

---

## Note Implementative

1. **Usa styled-components** per gli stili (già usato nel progetto)
2. **Supabase client** per tutte le query DB
3. **react-hot-toast** per notifiche
4. **react-icons/fa** per icone
5. **Theme** supporta 'dark' e 'light'
6. Il refactoring deve essere **backward compatible** - non rompere funzionalità esistenti
7. Testare su tutte le 8 tabs principali prima di considerare completato

---

## Priorità Implementazione

1. **Fase 1**: Creare `useContactDetails` hook
2. **Fase 2**: Creare `ContactSelector` dropdown
3. **Fase 3**: Creare `UniversalRightPanel` container
4. **Fase 4**: Creare `AddMenu` e `KeepInTouchTab`
5. **Fase 5**: Integrare in `CommandCenterPage.js`
6. **Fase 6**: Rimuovere codice duplicato
7. **Fase 7**: Test e fix
