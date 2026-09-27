# Schema Validation Patterns

Structured validation helpers from `scientific-agent-skills`. Use these patterns
when validating JSON records, evidence entries, or any structured data in the
research loop.

## Core Helpers

### `_object(value, path)` — validate a dictionary
```python
def _object(value, path):
    if not isinstance(value, dict):
        add("TYPE_OBJECT", path, "must be an object")
        return None
    return value
```

### `_text(obj, key, path, max_chars=500)` — validate a string field
```python
def _text(obj, key, path, max_chars=500):
    value = obj.get(key)
    if is_placeholder(value):
        add("TEXT_REQUIRED", f"{path}.{key}", "requires non-placeholder text")
        return None
    if len(value) > max_chars:
        add("TEXT_BOUNDED", f"{path}.{key}", f"must not exceed {max_chars} characters")
    return value.strip()
```

### `_choice(obj, key, allowed, path)` — validate an enum field
```python
def _choice(obj, key, allowed, path):
    value = obj.get(key)
    if not isinstance(value, str) or value not in allowed:
        add("CHOICE_INVALID", f"{path}.{key}", f"must be one of: {', '.join(sorted(allowed))}")
        return None
    return value
```

### `_date(value)` — validate an ISO date
```python
def _date(value):
    if not isinstance(value, str) or len(value) != 10:
        add("DATE_INVALID", path, "must be an ISO date (YYYY-MM-DD)")
        return None
    return value
```

## Evidence Validation Pattern

From `scientific-agent-skills/skills/iso-standards-readiness/scripts/_common.py`:

```python
def evidence(obj, path, min_items=1):
    raw = _list(obj.get("evidence"), f"{path}.evidence", min_items=min_items)
    if raw is None:
        return []
    evidence = []
    for index, item in enumerate(raw):
        item_path = f"{path}.evidence[{index}]"
        record = _object(item, item_path)
        if record is None:
            continue
        _text(record, "id", item_path, max_chars=120)
        # ... validate verification status, source, etc.
        evidence.append(record)
    return evidence
```

## Numeric Fact Validation Pattern

From `scientific-agent-skills/skills/scientific-writing/scripts/check_consistency.py`:

```python
def validate_numeric_facts(data):
    issues = []
    facts = require_list(data.get("numeric_facts"), "numeric_facts")
    seen_ids = set()
    by_concept = {}
    for index, raw_fact in enumerate(facts):
        fact = require_object(raw_fact, f"numeric_facts[{index}]")
        fact_id = fact.get("fact_id")
        if not FACT_ID_RE.fullmatch(fact_id):
            issues.append(issue("error", "INVALID_FACT_ID", location=...))
        elif fact_id in seen_ids:
            issues.append(issue("error", "DUPLICATE_FACT_ID", item_id=fact_id))
        else:
            seen_ids.add(fact_id)
        # Check for repeated values, units, denominators across facts
        # with the same concept
    return issues, len(facts)
```

## Claim Auditing Pattern

From `scientific-agent-skills/skills/scientific-writing/scripts/audit_claims.py`:

```python
def load_sources(path):
    """Load a JSON source manifest and return {evidence_id: is_verified}."""
    data = require_object(read_json(path), "source_manifest")
    sources = {}
    for raw_source in require_list(data.get("sources"), "sources"):
        source = require_object(raw_source, ...)
        evidence_id = source.get("evidence_id")
        verification = require_object(source.get("verification"), "verification")
        sources[evidence_id] = (
            verification.get("status") == "verified"
            and verification.get("source_opened") is True
        )
    return sources

def audit_markdown(text, claims, sources):
    """Audit markdown claim markers against a claim registry and source manifest."""
    issues = []
    used_claims = set()
    # Parse claim markers like [C1], [C2] in the markdown
    # Check each claim exists in the registry
    # Check each claim's source is verified
    return issues, used_claims
```

## Usage in Vitruvius

These patterns apply to:
- **Evidence ledger validation** — validate source records, search records, and claim records
- **Provenance sidecar validation** — validate the provenance structure
- **Problem anchor validation** — validate artifact and decision records
- **Goal-check validation** — validate scope, prompt, and findings records

The key principle: **validate structure first, then content, then cross-references**. Each validation step adds issues to a list rather than failing fast, so the caller sees all problems at once.
