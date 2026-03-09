---
allowed-tools: Bash(ssh:*), Read, Write
description: Create a new skill for Barbara (OpenClaw agent on 209.97.183.72)
---

# Create a New Skill for Barbara (OpenClaw)

You are going to create a new skill for Barbara, an AI agent running on an OpenClaw
server at 209.97.183.72.

## Server Access
- SSH: `ssh root@209.97.183.72`
- User: `openclaw`
- Workspace: `/home/openclaw/.openclaw/workspace/`

## Architecture
- Barbara is the "main" agent
- Skills live in: `/home/openclaw/.openclaw/workspace/skills/`
- Soul file (competence index): `/home/openclaw/.openclaw/workspace/SOUL.md`
- Env vars: `/opt/openclaw.env` (use `sudo /usr/local/bin/openclaw-setenv VAR "value"`)
- Supabase access via REST: `$SUPABASE_URL`, `$SUPABASE_KEY`
- Modules (reusable schemas): `/home/openclaw/.openclaw/workspace/modules/`

## Skill File Pattern

Every skill is a markdown file at `skills/<name>.md` with this structure:

1. **Header**: `# skills/<name>.md — <description>`
2. **Obiettivo**: one-liner of what the skill does
3. **Section 0) Prerequisiti**: env vars needed, tables involved
4. **Numbered sections**: each capability (query, create, update, etc.) with:
   - Input description
   - curl command or SQL query (using `$SUPABASE_URL` and `$SUPABASE_KEY`)
   - Example output
5. **Workflow section**: typical usage flow
6. **Log section**: what to log in `ops-log.md`

## Steps to Create a Skill

1. **Read existing skills** for reference:
   ```bash
   ssh root@209.97.183.72 "ls /home/openclaw/.openclaw/workspace/skills/"
   ssh root@209.97.183.72 "cat /home/openclaw/.openclaw/workspace/skills/deals.md"
   ```

2. **Create the skill file**:
   ```bash
   ssh root@209.97.183.72 "cat > /home/openclaw/.openclaw/workspace/skills/<name>.md << 'SKILL_EOF'
   <skill content>
   SKILL_EOF"
   ```

3. **Update SOUL.md** — add the new skill to the competence index:
   ```bash
   ssh root@209.97.183.72 "cat /home/openclaw/.openclaw/workspace/SOUL.md"
   ```
   Then edit to add the new area entry following the existing pattern.

4. **Set env vars** if needed:
   ```bash
   ssh root@209.97.183.72 "sudo -u openclaw sudo /usr/local/bin/openclaw-setenv VAR_NAME 'value'"
   ```

5. **Verify**: Read the created file back and check SOUL.md was updated.

## Current SOUL.md Structure (competence index)

Each skill area in SOUL.md follows this pattern:
```
- Area <Name> (dettagli: `skills/<name>.md`)
  - Capability 1
  - Capability 2
  - ...
```

## Important Rules
- Skills use `curl` with Supabase REST API (not SQL directly)
- Always `source /opt/openclaw.env` before curl commands
- Never put secrets in skill files — reference env vars
- Log operations in `ops-log.md`
- Skills should be executable "a freddo" (cold start): include all prerequisites and examples

## Your Task

Ask the user what skill they want to create for Barbara, then:
1. Understand the requirements
2. Write the skill file on the server
3. Update SOUL.md
4. Set any needed env vars
