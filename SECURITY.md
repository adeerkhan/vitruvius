# Security Policy

## Reporting a Security Vulnerability

If you discover a security vulnerability in Vitruvius, please report it by:

1. **Do NOT** open a public GitHub issue
2. Email the maintainer directly (see profile for contact)
3. Include: description, reproduction steps, affected versions, suggested fix

We aim to acknowledge reports within 48 hours and release fixes promptly.

## Security Scanning

Vitruvius runs automated security scans on every PR via GitHub Actions (`security-scan.yml`).

The scanner checks for:

- **Hardcoded secrets** — API keys, tokens, passwords in code
- **Dangerous function calls** — eval, exec, os.system, child_process
- **Data exfiltration patterns** — curl/wget piped to shell, webhook callbacks
- **Personal paths** — hardcoded `/Users/<name>/` paths that leak user info

## Skill Security Rules

All skills MUST follow these rules:

1. **No hardcoded secrets** — Use environment variables or user-provided keys
2. **No eval/exec** — Never execute dynamic code from untrusted sources
3. **No data exfiltration** — Do not send user data to external services without explicit consent
4. **Bounded file access** — Only read/write within the project directory
5. **No personal paths** — Use relative paths or `~` expansion, never hardcoded absolute paths

## CI/CD Security

- All PRs run `npm test` which includes structural validation
- Security scan runs on every PR touching `skills/` or `scripts/`
- Weekly scheduled scan catches issues in unchanged code
- Releases are published only after full test suite passes

## Dependencies

- Minimize external dependencies
- All dependencies are audited via `npm audit`
- Known vulnerabilities block CI until resolved
