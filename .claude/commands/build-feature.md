---
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(*), Agent, mcp__supabase__execute_sql, mcp__supabase__list_tables
description: Build a complete feature from a brief. Trigger on 'build', 'new feature', 'implementa'.
---

# Build Feature

You are building a feature for the CRM project. Read the brief below, then follow the methodology.

## Brief
$ARGUMENTS

## Project state
!`git status --short`
!`git branch --show-current`

## Methodology

Read `docs/build-system/codebase-map.md` for architecture context.

1. **Explore** — Understand the codebase areas this feature touches. Read existing code before writing new code. Check `docs/build-system/gotchas.md` for known pitfalls.
2. **Design** — Draft a plan. Reference patterns in `docs/build-system/patterns-*.md`. Prefer reusing existing utilities over creating new abstractions. Present the plan to the user for approval before implementing.
3. **Implement** — Write the code. One concern at a time. Commit logical units.
4. **Verify** — Run through `docs/build-system/quality-gate.md`. Fix what fails.
5. **Log** — Append any new gotchas discovered to `docs/build-system/gotchas.md`.

If something unexpected comes up, adapt. These are goals, not a railroad.
