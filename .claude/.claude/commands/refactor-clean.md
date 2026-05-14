# Refactor Clean

Safely identify and remove dead code with test verification at every step.

## Step 1: Detect Dead Code
```bash
npx depcheck          # Unused npm dependencies
npx knip              # Unused exports, files, dependencies
```
Or use Grep to find exports with zero imports.

## Step 2: Categorize Findings
| Tier | Examples | Action |
|------|----------|--------|
| **SAFE** | Unused utilities, internal functions | Delete with confidence |
| **CAUTION** | Components, entry points | Verify no dynamic imports |
| **DANGER** | Config files, webpack entries | Investigate before touching |

## Step 3: Safe Deletion Loop
For each SAFE item:
1. Run full test suite — Establish baseline
2. Delete the dead code
3. Re-run test suite — Verify nothing broke
4. If tests fail — Immediately revert with `git checkout -- <file>`
5. If tests pass — Move to next item

## Rules
- **Never delete without running tests first**
- **One deletion at a time** — Atomic changes make rollback easy
- **Skip if uncertain** — Better to keep dead code than break production
