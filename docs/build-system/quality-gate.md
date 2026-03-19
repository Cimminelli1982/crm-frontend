# Quality Gate

Run through this checklist after implementing a feature. Fix what fails before shipping.

---

## Build

- [ ] Dev server compiles without errors (`PORT=3002 npm run new-crm:dev`)
- [ ] No TypeScript/ESLint errors in terminal output
- [ ] **Do NOT run `npm build`** — dev server with hot reload is the test environment

## Frontend

- [ ] Component renders correctly
- [ ] Interactions work (click, submit, close, etc.)
- [ ] Both light and dark theme supported (check `theme` prop)
- [ ] No console.error in browser DevTools
- [ ] No regressions on existing tabs (quick visual check)

## Backend (if new endpoint)

- [ ] Endpoint responds correctly: `curl -X POST http://localhost:3001/endpoint -H 'Content-Type: application/json' -d '{...}'`
- [ ] Error cases return proper status codes + `{ success: false, error: '...' }`
- [ ] No unhandled promise rejections in server logs

## Database (if schema changes)

- [ ] Data written correctly (verify with SQL query)
- [ ] Foreign keys reference correct tables
- [ ] Enum values match existing enums in `CLAUDE.md`
- [ ] No orphaned records after operations

## Code Quality

- [ ] Follows existing patterns (hooks, modals, endpoints — see `patterns-*.md`)
- [ ] No over-engineering (no new abstractions for single use)
- [ ] No security vulnerabilities (input validation at boundaries)
- [ ] Toast feedback for async operations (loading → success/error)
- [ ] No hardcoded values that should be configurable
