# Supabase Patterns

DB query patterns. Full schema is in `CLAUDE.md` — refer to it, don't duplicate.

---

## Query with Joins

```javascript
// FK joins use table(columns) — NO alias syntax
const { data, error } = await supabase
  .from('contacts')
  .select(`
    *,
    contact_emails(*),
    contact_mobiles(*),
    contact_companies(*, companies(*)),
    contact_tags(*, tags(*))
  `)
  .eq('contact_id', id)
  .single();
```

**WRONG** (alias syntax — will fail silently):
```javascript
// ❌ DO NOT DO THIS
.select('*, emails:contact_emails(*)')
```

---

## Insert + Return

```javascript
const { data, error } = await supabase
  .from('contacts')
  .insert({
    first_name: 'John',
    last_name: 'Doe',
    category: 'Inbox',
    created_by: 'User',
  })
  .select()
  .single();
```

---

## Upsert

```javascript
const { data, error } = await supabase
  .from('contact_emails')
  .upsert(
    { contact_id: id, email: 'x@y.com', is_primary: true },
    { onConflict: 'contact_id,email' }
  );
```

---

## Update

```javascript
const { error } = await supabase
  .from('contacts')
  .update({ category: 'Professional Investor', last_modified_by: 'User' })
  .eq('contact_id', id);
```

---

## Delete (junction table)

```javascript
const { error } = await supabase
  .from('contact_tags')
  .delete()
  .eq('contact_id', contactId)
  .eq('tag_id', tagId);
```

---

## Existing Views

- `contact_completeness` — 20-point scoring (has photo, email, mobile, company, etc.)
- `company_completeness` — similar for companies
- `contacts_clarissa_processing` — 5-dimension quality (completeness, photo, note, company, company_complete)

---

## Enum Values

All enum values are documented in `CLAUDE.md` under "Enum Values". Key ones:

- `contact_category`: Inbox, Professional Investor, Founder, Friend and Family, etc.
- `company_category`: Professional Investor, Startup, Corporation, etc.
- `creation_source`: User, LLM, Edge Function
- `contact_point_type`: work, personal, other, WhatsApp

---

## Gotchas

- `tags` table uses field `name`, NOT `tag_name`
- FK joins: `table(columns)` — no alias with `:`
- Always `.select()` after `.insert()` if you need the returned data
- `contact_id` is uuid, auto-generated — don't set it manually on insert
