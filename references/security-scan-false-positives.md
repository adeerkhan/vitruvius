# Security Scan False Positives

Known patterns that trigger the security scanner but are safe. Stolen from
Scientific Agent Skills' false positive documentation.

Before "fixing" a finding, check this list. Verify the finding against the
code — findings sometimes cite files the skill does not contain.

---

## HIGH Severity False Positives

### `child_process` in Node.js scripts

**Pattern:** `HIGH: ... dangerous function call` on `child_process`

**Why it's safe:** Node.js scripts use `child_process` for legitimate subprocess
calls (e.g., running `git`, `npm`, or other CLI tools). The scanner flags any
`child_process` usage.

**When to allow:** The script uses `child_process` with an explicit command
argument (not user input) and does not pipe to `sh`/`bash`/`cmd`.

---

## MEDIUM Severity False Positives

### Generic username paths

**Pattern:** `MEDIUM: ... personal path (/Users/runner/...)`

**Why it's safe:** CI runners use `/Users/runner/` or `/home/runner/` as
their home directory. These are not personal paths.

**When to allow:** The username is `runner`, `root`, `user`, or another
generic CI username.

---

## LOW Severity False Positives

### `eval` in identifiers

**Pattern:** `HIGH: ... dangerous function call` on substrings like `retrieval`,
`executor`, `model.eval()`

**Why it's safe:** The scanner flags `eval` as a substring. Identifiers like
`retrieval` or `executor` contain `eval` but are not calls to `eval()`.

**When to allow:** The match is inside an identifier, not a function call.
Check for `eval(` with an opening parenthesis.

---

## How to Document a New False Positive

When you encounter a new false positive:

1. Add it to this file with the pattern, why it's safe, and when to allow it.
2. Update `scripts/security-scan.mjs` to whitelist the pattern if possible.
3. Note the false positive in the PR description.

Do not silence the scanner globally — whitelist specific patterns, not entire
rules.
