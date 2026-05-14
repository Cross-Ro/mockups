# Security Guidelines

## Mandatory Security Checks
Before ANY commit:
- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated
- [ ] XSS prevention (sanitized HTML)
- [ ] Authentication/authorization verified
- [ ] Error messages don't leak sensitive data

## Secret Management
- NEVER hardcode secrets in source code
- ALWAYS use environment variables (.env)
- Validate that required secrets are present at startup
- Rotate any secrets that may have been exposed

## Security Response Protocol
If security issue found:
1. STOP immediately
2. Fix CRITICAL issues before continuing
3. Rotate any exposed secrets
4. Review entire codebase for similar issues
