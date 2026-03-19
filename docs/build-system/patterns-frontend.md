# Frontend Patterns

Real snippets from the codebase. Copy and adapt — don't reinvent.

---

## New Hook (`hooks/command-center/useXxxData.js`)

```javascript
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const useXxxData = (activeTab) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch on tab activation
  useEffect(() => {
    if (activeTab === 'xxx') {
      fetchItems();
    }
  }, [activeTab]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('table')
        .select('*, related_table(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData) => {
    const toastId = toast.loading('Creating...');
    try {
      const { data, error } = await supabase
        .from('table')
        .insert(formData)
        .select()
        .single();
      if (error) throw error;
      toast.success('Created!', { id: toastId });
      setItems(prev => [data, ...prev]);
      return data;
    } catch (err) {
      toast.error('Failed to create', { id: toastId });
      throw err;
    }
  };

  // Return flat object — all state + handlers
  return {
    items,
    setItems,
    loading,
    selectedItem,
    setSelectedItem,
    fetchItems,
    handleCreate,
  };
};

export default useXxxData;
```

**Integration in CommandCenterPage.js:**
```javascript
import useXxxData from '../hooks/command-center/useXxxData';

// Inside component:
const xxxHook = useXxxData(activeTab);
const { items, selectedItem, handleCreate } = xxxHook;
```

---

## New Modal (`components/modals/XxxModal.js`)

Standard props: `isOpen`, `onClose`, `theme`, `onSuccess`.

```javascript
import React, { useState } from 'react';
import styled from 'styled-components';
import { FaTimes } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const Overlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: ${p => p.theme === 'light' ? '#fff' : '#1F2937'};
  border-radius: 12px;
  width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 24px;
`;

const XxxModal = ({ isOpen, onClose, theme, onSuccess }) => {
  const [form, setForm] = useState({ name: '' });
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setSaving(true);
    const toastId = toast.loading('Saving...');
    try {
      const { data, error } = await supabase
        .from('table')
        .insert(form)
        .select()
        .single();
      if (error) throw error;
      toast.success('Saved!', { id: toastId });
      onSuccess?.(data);
      onClose();
    } catch (err) {
      toast.error('Error: ' + err.message, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Modal theme={theme} onClick={e => e.stopPropagation()}>
        {/* content */}
      </Modal>
    </Overlay>
  );
};

export default XxxModal;
```

**Render in CommandCenterPage.js** (at bottom of JSX, around line ~3877):
```jsx
<XxxModal
  isOpen={xxxModalOpen}
  onClose={() => setXxxModalOpen(false)}
  theme={theme}
  onSuccess={(data) => {
    // update local state, refetch, etc.
  }}
/>
```

---

## Header Tab

Tabs are defined as an array passed to `DesktopHeader`. Each tab:
```javascript
{
  id: 'tabId',
  label: 'Tab Name',
  icon: FaIconComponent,
  count: itemCount,        // shows badge if > 0
  hasUnread: boolean,      // shows unread dot
}
```

---

## Command Palette / directAction

Three files involved:

1. **`commandDefinitions.js`** — define the action:
```javascript
{
  id: 'my-action',
  label: 'My Action',
  directAction: 'my-action',  // key for slash command mapping
}
```

2. **`useAgentChat.js`** — map to slash command:
```javascript
const SLASH_COMMANDS = {
  '/my-action': 'my-action',
  // ...
};
```

3. **`AgentChatTab.js`** — handle via `slashActions` if custom UI logic needed, otherwise auto-dispatched to backend `/chat`.

---

## Toast Pattern

```javascript
// Loading → success/error with same ID (replaces the loading toast)
const toastId = toast.loading('Working...');
try {
  // ... async work
  toast.success('Done!', { id: toastId });
} catch (err) {
  toast.error('Failed: ' + err.message, { id: toastId });
}
```

---

## Styled Components + Theme

Always support both themes:
```javascript
const Container = styled.div`
  background: ${p => p.theme === 'light' ? '#fff' : '#1F2937'};
  color: ${p => p.theme === 'light' ? '#111827' : '#F9FAFB'};
  border: 1px solid ${p => p.theme === 'light' ? '#E5E7EB' : '#374151'};
`;
```

Common color pairs (light / dark):
- Background: `#fff` / `#1F2937`
- Text primary: `#111827` / `#F9FAFB`
- Text secondary: `#6B7280` / `#9CA3AF`
- Border: `#E5E7EB` / `#374151`
- Hover bg: `#F3F4F6` / `#374151`
- Surface: `#F9FAFB` / `#111827`
