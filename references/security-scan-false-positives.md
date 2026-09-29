# Security Scan False Positives

Known patterns that trigger the security scanner but are safe. Stolen from
Scientific Agent Skills' false positive documentation.

Before "fixing" a finding, check this list. Verify the finding against the
code — findings sometimes cite files the skill does not contain.

**This file explains the patterns. It does not grant the waiver.**
The machine-enforced allowlist is `WAIVERS` in `scripts/security-scan.mjs`.
Until 2026-09-29 this file was the only place a false positive could be
recorded and nothing read it, so there was no way to legitimately silence a
real one: the scanner failed on every finding, and the only options were to
delete working code or to disable the scanner, which the last line of this
file forbids.

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

1. Add the pattern here, with the pattern, why it is safe, and when to allow
   it — so a reader can judge it.
2. Add a matching entry to `WAIVERS` in `scripts/security-scan.mjs`. The
   scanner reads that list; it does not read this file. The entry is keyed on
   `file` and `rule` — never on a line number, which moves on every edit above
   it:

   ```js
   {
     file: "scripts/extract-pdf.mjs",
     rule: "dangerous function call",
     reason: "spawns pdftotext with a fixed argv, never a shell string",
     removeWhen: "the PDF path moves to a pure-JS parser and the subprocess goes away",
   }
   ```

3. Both `reason` and `removeWhen` are required. An entry missing either fails
   the build and suppresses nothing, so a half-written waiver cannot quietly
   become permission.
4. A waiver that matches no finding also fails the build, as stale. If you fix
   the underlying code, delete the waiver in the same change.
5. Note the false positive in the PR description.

Do not silence the scanner globally — whitelist specific patterns, not entire
rules. `WAIVERS` currently holds no entries, because the scanner reports no
findings today; that is the correct state, not an oversight.
