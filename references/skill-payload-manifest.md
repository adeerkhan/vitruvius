# Skill Payload Manifest

Each skill's SKILL.md carries a content-addressed hash in its header. This
proves the installed payload matches the repo's version — a tampered or
drifted skill is detected before it runs.

## Header Format

```
<!-- VITRUVIUS-COMPILED-SKILL:BEGIN v1 sha256=<64 lowercase hex> -->
```

The header is the first line of SKILL.md. The hash is computed over the
entire file content **after** the header line (i.e., the skill body).

## Computing the Hash

1. Read the SKILL.md file.
2. Extract the header line (first line).
3. Hash the remaining bytes (everything after the header line) with SHA-256.
4. Format as `<!-- VITRUVIUS-COMPILED-SKILL:BEGIN v1 sha256=<hash> -->`.

## Verifying the Hash

1. Read the SKILL.md file.
2. Extract the header line (first line).
3. Compute the SHA-256 hash of the remaining bytes.
4. Compare with the hash in the header.
5. If they match, the payload is intact. If they don't, refuse to run and
   report the mismatch.

## What This Catches

- **Accidental edits** — a skill modified locally without updating the hash.
- **Partial installs** — a skill copied incompletely.
- **Version drift** — an old version of a skill mixed with a new version.

## What This Does NOT Catch

- **Semantic drift** — a skill that was intentionally edited and the hash
  updated to match. This is a content-addressing system, not a signature
  system. It proves the payload matches the hash, not that the hash matches
  the repo's canonical version.

## Script

`scripts/skill-payload-manifest.mjs` computes and verifies all skill hashes.
Run it before installing or updating skills:

```bash
node scripts/skill-payload-manifest.mjs --verify
node scripts/skill-payload-manifest.mjs --update
```

`--verify` checks all skills and reports mismatches. `--update` recomputes
and writes the hash headers.
