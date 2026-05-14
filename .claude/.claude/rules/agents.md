# Agent Orchestration

## Available Agents
Located in `~/.claude/agents/`:
| Agent | Purpose | When to Use |
|-------|---------|-------------|
| planner | Implementation planning | Complex features, refactoring |
| architect | System design | Architectural decisions |
| code-reviewer | Code review | After writing code |

## Immediate Agent Usage
No user prompt needed:
1. Complex feature requests → Use **planner** agent
2. Code just written/modified → Use **code-reviewer** agent
3. Architectural decision → Use **architect** agent

## Parallel Task Execution
ALWAYS use parallel Task execution for independent operations:
- Run multiple agents simultaneously when tasks are independent
- Don't run sequentially when parallel is possible
