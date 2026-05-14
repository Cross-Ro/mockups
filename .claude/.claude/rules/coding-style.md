# Coding Style

## Immutability (CRITICAL)
ALWAYS create new objects, NEVER mutate existing ones:
- Use spread operators, map, filter — not direct mutation
- Rationale: Prevents hidden side effects, easier debugging

## File Organization
MANY SMALL FILES > FEW LARGE FILES:
- 200-400 lines typical, 800 max
- Extract utilities from large modules
- Organize by feature/domain

## Error Handling
ALWAYS handle errors comprehensively:
- Handle errors explicitly at every level
- Never silently swallow errors
- Log detailed context server-side

## Input Validation
ALWAYS validate at system boundaries:
- Validate all user input before processing
- Fail fast with clear error messages
- Never trust external data

## Code Quality Checklist
Before marking work complete:
- [ ] Code is readable and well-named
- [ ] Functions are small (<50 lines)
- [ ] Files are focused (<800 lines)
- [ ] No deep nesting (>4 levels)
- [ ] Proper error handling
- [ ] No hardcoded values
- [ ] No mutation (immutable patterns used)
