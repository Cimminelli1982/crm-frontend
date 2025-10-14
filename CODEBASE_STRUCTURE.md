# CRM Frontend - Handler Pattern & State Management Structure

## Overview
This codebase uses a **custom hook pattern** to separate business logic from UI components. State management and data operations are handled in hooks, then passed to components as props.

## Key Architecture Patterns

### 1. Custom Hooks for Business Logic
- **Location**: `/src/hooks/`
- **Purpose**: Encapsulate all state management, API calls, and business logic
- **Example**: `useQuickEditModal.js` manages all quick edit modal operations

### 2. Component Structure
```
Component (UI)
    ↓ uses
Custom Hook (Logic)
    ↓ calls
Supabase (Database)
```

## Handler Pattern Example: Quick Edit Modal

### The Problem We Solved
When marking an "Inbox" contact as complete, we need to:
1. Force user to select a category first (can't complete Inbox contacts)
2. Update the category in the database
3. Set `show_missing` to false
4. Update local state properly

### Implementation Structure

#### 1. Hook Layer (`/src/hooks/useQuickEditModal.js`)
```javascript
// Handler defined in the hook
const handleMarkCompleteWithCategory = useCallback(async (newCategory) => {
  // Direct database update - both fields in one call
  const { error } = await supabase
    .from('contacts')
    .update({
      category: newCategory,
      show_missing: false,
      last_modified_at: new Date().toISOString()
    })
    .eq('contact_id', contactForQuickEdit.contact_id);

  // Update local state
  setQuickEditContactCategory(newCategory);
  setQuickEditShowMissing(false);

  // Update contact object
  contactForQuickEdit.category = newCategory;
  contactForQuickEdit.show_missing = false;

  // Trigger refresh callback
  if (onContactUpdate) onContactUpdate();
});

// Export in the hook's return object
return {
  // ... other state and handlers
  handleMarkCompleteWithCategory,
  // ...
};
```

#### 2. Component Layer (`/src/components/ContactsListDRY.js`)
```javascript
// Use the hook
const quickEditModal = useQuickEditModal(handleContactUpdate);

// Destructure the handler
const {
  // ... other handlers
  handleMarkCompleteWithCategory,
  // ...
} = quickEditModal;

// Pass to child component as prop
<QuickEditModalRefactored
  // ... other props
  handleMarkCompleteWithCategory={handleMarkCompleteWithCategory}
/>
```

#### 3. Modal Component (`/src/components/QuickEditModalRefactored.js`)
```javascript
// Receive handler as prop
const QuickEditModalRefactored = ({
  // ... other props
  handleMarkCompleteWithCategory,
  // ...
}) => {
  // Use the handler when user selects category
  const success = await handleMarkCompleteWithCategory(selectedCategory);
};
```

## Important Patterns to Follow

### 1. State Updates Are Asynchronous
❌ **Wrong**:
```javascript
setQuickEditContactCategory(selectedCategory);
await onSave(); // This will use OLD state value!
```

✅ **Right**:
```javascript
// Option 1: Update database directly with new value
await supabase.update({ category: selectedCategory });

// Option 2: Pass value explicitly to handler
await handleSaveWithCategory(selectedCategory);
```

### 2. Always Update Multiple Places
When changing data, update:
1. Database (Supabase)
2. Local React state (setState)
3. Contact object reference
4. Trigger refresh callbacks

### 3. Handler Naming Convention
- `handleSave[Feature]` - Save/update operations
- `handleAdd[Item]` - Add new items
- `handleRemove[Item]` - Remove items
- `handleUpdate[Field]` - Update specific fields
- `handle[Action]With[Context]` - Complex operations

### 4. Hook Export Pattern
All hooks should export:
```javascript
return {
  // State values
  someState,
  setSomeState,

  // Handlers (grouped at end)
  handleAction1,
  handleAction2,
  handleComplexOperation,
};
```

## Common Gotchas

### 1. The onSave Override Problem
`onSave()` (which calls `handleSaveQuickEditContact`) saves ALL form fields using current state values. If you update the database separately then call `onSave()`, it might override your changes with old state values.

**Solution**: Either update state first, or don't call `onSave()` after direct database updates.

### 2. Missing Handler in Destructuring
If you add a new handler to a hook, you must:
1. Add it to the hook's return object
2. Destructure it in the component using the hook
3. Pass it as a prop to child components that need it

### 3. Foreign Key Constraints
When deleting contacts, remember to handle related tables first due to foreign key constraints. The codebase has many related tables:
- contact_emails
- contact_mobiles
- contact_companies
- attachments
- interactions
- etc.

## File Structure

```
/src
  /hooks
    useQuickEditModal.js    # Business logic for quick edit
    useContactsData.js      # Data fetching and caching
  /components
    ContactsListDRY.js      # Main list component (uses hooks)
    QuickEditModalRefactored.js  # Modal UI (receives props)
    /quickEditModal         # Sub-components for modal tabs
      InfoTab.js
      ContactsTab.js
      WorkTab.js
      RelatedTab.js
      KeepInTouchTab.js
```

## Testing Changes

When modifying handlers:
1. Check that the handler is exported from the hook
2. Verify it's destructured in the parent component
3. Ensure it's passed as a prop to child components
4. Test that database updates work correctly
5. Confirm local state updates properly
6. Check that UI refreshes after operations

## Database Schema Notes

Key tables and their relationships:
- `contacts` - Main contact table
  - `category` - Enum field (Inbox, Skip, Founder, etc.)
  - `show_missing` - Boolean for incomplete contacts
- `contact_emails` - Email addresses (1:many)
- `contact_companies` - Company associations (many:many)
- `keep_in_touch` - Relationship management data

## Supabase Integration

All database operations use the Supabase client:
```javascript
import { supabase } from '../lib/supabaseClient';

// Query example
const { data, error } = await supabase
  .from('contacts')
  .select('*')
  .eq('category', 'Inbox');

// Update example
const { error } = await supabase
  .from('contacts')
  .update({ category: 'Founder' })
  .eq('contact_id', contactId);
```

## Key Takeaways

1. **Business logic stays in hooks**, not components
2. **Components are just UI** - they receive props and render
3. **State updates are async** - be careful with timing
4. **Always update all references** - database, state, objects, callbacks
5. **Follow the pattern** - consistency makes debugging easier