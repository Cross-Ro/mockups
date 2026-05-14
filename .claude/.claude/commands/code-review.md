# Code Review

Comprehensive security and quality review of uncommitted changes:

1. Get changed files: `git diff --name-only HEAD`
2. For each changed file, check for:

**Security Issues (CRITICAL):**
- Hardcoded credentials, API keys, tokens
- XSS vulnerabilities — unescaped user input in HTML/Liquid
- Missing input validation
- Path traversal risks

**Code Quality (HIGH):**
- Functions > 50 lines
- Files > 800 lines
- Nesting depth > 4 levels
- Missing error handling
- console.log statements left in
- TODO/FIXME comments without ticket refs

**Best Practices (MEDIUM):**
- Mutation patterns (use immutable instead)
- Missing tests for new JS/JSX code
- Accessibility issues (a11y) in Liquid/HTML

3. Generate report with:
   - Severity: CRITICAL, HIGH, MEDIUM, LOW
   - File location and line numbers
   - Issue description
   - Suggested fix

4. Block commit if CRITICAL or HIGH issues found

Never approve code with security vulnerabilities!
