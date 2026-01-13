---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(git push:*), Bash(git diff:*), Bash(git log:*)
description: Push all local changes to GitHub (local is most up to date)
---

Push all local changes to GitHub. The local version is always the most up to date.

## Current State
- Status: !`git status --short`
- Branch: !`git branch --show-current`

## Your Task

1. Stage all changes with `git add .`
2. Look at the diff to understand what changed
3. Create a clear, concise commit message summarizing the changes
4. Commit with the message (include Co-Authored-By: Claude <noreply@anthropic.com>)
5. Push to the current branch

Be concise in your commit message - focus on what changed, not implementation details.
