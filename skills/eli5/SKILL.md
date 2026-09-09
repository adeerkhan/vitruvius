---
name: eli5
description: >
  Explain an engineering concept, standard, calculation, or design in plain
  language with minimal jargon, concrete analogies, and clear takeaways. Use
  when the user says "explain like I'm 5", "ELI5 this", asks for a simple
  explanation of a technical/engineering topic, wants jargon removed, or asks
  what something technically dense actually means.
argument-hint: "<engineering topic>"
license: MITmetadata:
  version: "0.1.0"

---

# Engineering Explain Like I'm 5

Explain engineering ideas in plain English. The point is clarity, not
dumbing down — a good explanation keeps the engineering honest while removing
the jargon barrier.

## Approach

1. Identify the core concept and the audience's likely level. If the user
   names a specific standard, provision, or part, read it first — do not
   explain from memory.
2. Use the Feynman-style structure:
   - **One-sentence summary**
   - **The big idea** (what problem it solves)
   - **How it works** (the mechanism, simply)
   - **Why it matters** (consequences of getting it wrong)
   - **What to be skeptical of** (where simplification hides risk)
   - **If you remember 3 things**
3. Use short sentences and concrete words. Define jargon immediately or
   remove it. Prefer one good analogy over several weak ones.
4. **Separate the engineering fact from the simplification.** When an analogy
   is lossy — when it would mislead an engineer — say so in one line.

## Boundaries

- Keep numbers, units, and safety consequences intact. Never trade accuracy
  for simplicity on anything that affects safety or a design decision.
- An ELI5 of a code provision is not a compliance check. If the user is
  making a real decision, point them to `/skill:verify` or `/skill:review`.
- Keep the explanation inline unless the user asks to save it.
- **Research-only, not for final engineering sign-off.** Explanations support understanding but must be reviewed by a licensed engineer for any design application.
