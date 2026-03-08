---
allowed-tools: mcp__todoist__create_tasks, AskUserQuestion
description: Add a task to the Work project in Todoist
---

Add a task to the **Work** project in Todoist.

## How It Works

The user provides the task name. If they also provide timeframe/priority/due date inline, use those. Otherwise, **YOU MUST call AskUserQuestion** to ask for the missing params.

## Inline Format (optional)

```
/task-add-work [task name], [timeframe], [priority], [due date]
```

Parsing shorthand:
- **Timeframe**: week/tw, sprint/ts, month/tm, year/ty, next week/nw
- **Priority**: p1 (urgent), p2 (high), p3 (medium), p4 (normal)
- **Due date**: today, tomorrow/tmr, monday, or a date like "march 5"

## CRITICAL RULE

If the user does NOT provide timeframe, priority, AND due date inline, you MUST call `AskUserQuestion` BEFORE creating the task. DO NOT assume defaults. DO NOT skip this step.

## AskUserQuestion Call

Call with exactly this structure:

```json
{
  "questions": [
    {
      "question": "Timeframe?",
      "header": "Timeframe",
      "multiSelect": false,
      "options": [
        { "label": "This Week", "description": "Section: This Week" },
        { "label": "This Sprint", "description": "Section: This Sprint" },
        { "label": "This Month", "description": "Section: This Month" },
        { "label": "This Year", "description": "Section: This Year" }
      ]
    },
    {
      "question": "Priority?",
      "header": "Priority",
      "multiSelect": false,
      "options": [
        { "label": "p1", "description": "Urgent" },
        { "label": "p2", "description": "High" },
        { "label": "p3", "description": "Medium" },
        { "label": "p4", "description": "Normal" }
      ]
    },
    {
      "question": "Due date?",
      "header": "Due date",
      "multiSelect": false,
      "options": [
        { "label": "No date", "description": "No due date" },
        { "label": "Today", "description": "Due today" },
        { "label": "Tomorrow", "description": "Due tomorrow" },
        { "label": "Next Monday", "description": "Due next Monday" }
      ]
    }
  ]
}
```

Only ask questions for params NOT provided inline. For example if user writes `/task-add-work fix bug, p1` — only ask timeframe and due date (priority already set to p1).

## FALLBACK: If AskUserQuestion returns empty/blank answers

If AskUserQuestion returns and the answers are empty, blank, or you see "User answered Claude's questions:" with no actual selections, DO NOT proceed with defaults. DO NOT retry AskUserQuestion (it won't work). Instead, immediately ask in plain text:

"Timeframe? (week / sprint / month / year)
Priority? (p1 / p2 / p3 / p4)
Due date? (no date / today / tomorrow / next monday)"

Wait for the user to reply before creating the task. NEVER assume defaults when answers are missing.

## Todoist IDs

- **Project ID (Work)**: `6VqRM39cGMjV8pP7`
- **Sections**:
  - This Week: `6fm2MrvGJPv5r4Pf`
  - Next Week: `6fm2MrvG7V3qHw97`
  - This Sprint: `6fm2MrvRgWjGFX6f`
  - This Month: `6fm2MrwHRg8JJpC7`
  - This Year: `6fm2Mrw8cx9chJ57`

## Multiple Tasks

If multiple tasks (separated by "e", "and", ";"), parse and create ALL. Ask params once and apply to all unless each task has its own.

## After Getting All Params

Call `mcp__todoist__create_tasks` and give one-line confirmation per task.
