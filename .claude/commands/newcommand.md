---
allowed-tools: Write(.claude/commands/*.md)
description: Create a new Claude Code slash command
---

Create a new Claude Code command in the `.claude/commands/` directory.

## Command File Structure

Commands are markdown files with YAML frontmatter:

```markdown
---
allowed-tools: Bash(command:*), Read, Write, etc.
description: Short description shown in command list
---

Instructions for Claude when the command is invoked.

## Dynamic Content

Use !`shell command` to inject live output into the prompt.
Example: !`git status --short`
```

## Key Elements

1. **File location**: `.claude/commands/<command-name>.md`
2. **Filename**: Use kebab-case (e.g., `my-command.md` creates `/my-command`)
3. **allowed-tools**: Pre-authorize specific tools to skip permission prompts
   - Use wildcards: `Bash(git:*)` allows all git commands
   - Multiple tools: comma-separated list
4. **description**: Shows in autocomplete when user types `/`
5. **Body**: Markdown instructions Claude follows when command runs

## Examples

**Simple command:**
```markdown
---
description: Run tests
allowed-tools: Bash(npm test:*)
---
Run `npm test` and fix any failures.
```

**With dynamic content:**
```markdown
---
description: Review current changes
allowed-tools: Bash(git:*)
---
Review these changes:
!`git diff --staged`
```

## Your Task

Ask the user what command they want to create, then write the appropriate `.md` file to `.claude/commands/`.
