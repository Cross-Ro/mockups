# Load Memory

Read the project memory index and all referenced memory files to load context before starting work.

## Steps

1. Run `ls ~/.claude/projects/` to list all project memory directories
2. Find the directory whose name corresponds to the current project path (directory names are the project path with `/` replaced by `-`)
3. Read `~/.claude/projects/<matched-dir>/memory/MEMORY.md` to get the index
4. For each file listed in the index, read it in full
5. Hold this context silently — apply patterns, preferences, and project context throughout the current task

## Rules
- Do not summarize or echo the memory contents back unless explicitly asked
- Apply reference patterns as defaults — prefer them over generic approaches
- If a memory file conflicts with something observed in the current codebase, trust the codebase and note the stale memory
