# Performance Optimization

## Model Selection Strategy
**Haiku 4.5** (fast, cost-efficient):
- Lightweight agents with frequent invocation
- Simple code generation tasks

**Sonnet 4.6** (best coding model):
- Main development work
- Complex coding tasks
- Orchestrating multi-agent workflows

**Opus 4.6** (deepest reasoning):
- Complex architectural decisions
- Research and analysis tasks

## Context Window Management
Avoid last 20% of context window for:
- Large-scale refactoring
- Feature implementation spanning multiple files
- Debugging complex interactions

## Build Troubleshooting
If build fails:
1. Analyze error messages carefully
2. Fix incrementally
3. Verify after each fix
4. Run `yarn build` to confirm
