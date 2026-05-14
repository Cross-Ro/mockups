---
description: Restate requirements, assess risks, and create step-by-step implementation plan. WAIT for user CONFIRM before touching any code.
---

# Plan Command

Invoke the **planner** agent to create a comprehensive implementation plan before writing any code.

## What This Command Does
1. **Restate Requirements** - Clarify what needs to be built
2. **Identify Risks** - Surface potential issues and blockers
3. **Create Step Plan** - Break down implementation into phases
4. **Wait for Confirmation** - MUST receive user approval before proceeding

## How It Works
The planner agent will:
1. Analyze the request and restate requirements clearly
2. Break down into phases with specific, actionable steps
3. Identify dependencies between components
4. Assess risks and potential blockers
5. Present the plan and WAIT for explicit confirmation

## Important
**CRITICAL**: Will NOT write any code until you explicitly confirm with "yes" or "proceed".
