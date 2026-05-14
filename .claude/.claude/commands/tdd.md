---
description: Enforce test-driven development workflow. Scaffold interfaces, generate tests FIRST, then implement minimal code to pass.
---

# TDD Command

Enforce test-driven development methodology.

## TDD Cycle
```
RED → GREEN → REFACTOR → REPEAT
RED:     Write a failing test
GREEN:   Write minimal code to pass
REFACTOR: Improve code, keep tests passing
REPEAT:  Next feature/scenario
```

## Steps
1. **Scaffold** - Define interfaces/types first
2. **Write Tests** - Write failing tests (RED)
3. **Run Tests** - Verify they fail for the right reason
4. **Implement** - Write minimal code to pass (GREEN)
5. **Run Tests** - Verify they pass
6. **Refactor** - Improve while keeping tests green
7. **Coverage** - Ensure 80%+ test coverage

## Rules
- Tests MUST be written BEFORE implementation
- Never skip the RED phase
- Never write code before tests
- 80% minimum coverage for all code

## For this project
Run tests with: `yarn test:forms` or `yarn test:stepped-form`
