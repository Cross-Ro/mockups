# Planner-First Workflow (CRITICAL)

## Rule
NEVER create section, snippet, or TypeScript files directly from a Figma design.
The planner agent workflow MUST run first — no exceptions.

## Required Sequence
1. **Planner agent** creates `features/[name]/brief.md` + `test-scenarios.md`
2. **Confirm** brief with user
3. **Then** build code

## Enforcement
- Before writing to `sections/`, `snippets/`, or `ts/sections/`: verify `features/[name]/brief.md` exists
- If `/plan` is invoked with a Figma URL → spawn planner agent, not inline planning
- If user says "build this" with a Figma link → run planner agent first, ask user to confirm brief before writing any code

## What Counts as Skipping
- Writing Liquid/TS files without a brief.md → VIOLATION
- Creating a plan inline instead of using the planner agent → VIOLATION
- Creating brief.md yourself instead of delegating to planner agent → VIOLATION
