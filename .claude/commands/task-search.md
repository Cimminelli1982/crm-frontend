---
allowed-tools: mcp__supabase__execute_sql, mcp__todoist__get_tasks_list, mcp__todoist__get_tasks, mcp__todoist__get_projects_list, mcp__todoist__get_projects, mcp__todoist__get_sections_list, mcp__todoist__get_labels_list
description: Search tasks in Todoist (via Supabase)
---

Search tasks based on the user's request: $ARGUMENTS

## Supabase Project
- **Project ID**: `efazuvegwxouysfcgwja`

## Strategy: Supabase FIRST, Todoist for date filters

### 1. Text search → Use Supabase (ALWAYS)
Tasks are synced to the `tasks` table in Supabase. Use SQL with `ILIKE` for keyword searches — it's fast and accurate. Todoist's `search:` filter is unreliable and returns false positives.

```sql
SELECT content, due_date, due_string, priority, status,
       todoist_project_name, todoist_section_name
FROM tasks
WHERE content ILIKE '%keyword%'
  AND status = 'open'
ORDER BY due_date ASC NULLS LAST;
```

### Tasks table schema (DO NOT query information_schema)
```
task_id                 uuid PK
todoist_id              text
content                 text (task name)
description             text
due_date                date
due_datetime            timestamptz
due_string              text (e.g. "every 5th May")
priority                integer (1=urgent, 4=normal)
status                  text (open/completed)
todoist_project_id      text
todoist_project_name    text
todoist_section_id      text
todoist_section_name    text
todoist_url             text
completed_at            timestamptz
created_at              timestamptz
updated_at              timestamptz
synced_at               timestamptz
created_by              text
parent_id               uuid
todoist_parent_id       text
task_order              integer
```

### 2. Date-based filters → Use Todoist API
For queries like "today", "overdue", "next 7 days", use `get_tasks_list` with Todoist filters:
- `"today"` — due today
- `"overdue"` — overdue tasks
- `"7 days"` — due in the next 7 days
- `"no date"` — tasks without a due date
- `"#ProjectName"` — tasks in a project
- `"@label"` — tasks with a label
- `"P1"` / `"P2"` — by priority
- `"(today | overdue) & #Work"` — combine with & | !

### 3. Hybrid: combine both
For queries like "overdue tasks about Node House", first use Todoist for the date filter, then cross-reference with Supabase for the keyword.

## Instructions
1. Present results clearly: task name, due date, project, section, priority.
2. The user speaks both Italian and English — interpret queries in either language.
3. Default to `status = 'open'` unless the user asks about completed tasks.
4. Use `get_projects_list` if the user asks about projects or needs a project ID.
