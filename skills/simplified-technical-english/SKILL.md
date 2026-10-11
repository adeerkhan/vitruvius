---
name: simplified-technical-english
description: >
  Write and rewrite text in Simplified Technical English (ASD-STE100), a
  controlled language for clear technical documentation. Use when the user asks
  for STE, Simplified Technical English, controlled language, or plain technical
  writing, or asks to write, rewrite, review, or check technical documentation,
  procedures, manuals, instructions, warnings, or reports.
argument-hint: "<text or document to write, rewrite, or check> [--mode procedural|descriptive|mixed]"
license: MIT for this skill's text; the approved-word list derives from the ASD-STE100 dictionary, which is ASD property. See references/asd-notice.md.
metadata:
  version: "0.1.1"
  source-specification: ASD-STE100 Issue 7 (2017-01-25)
---
<!-- VITRUVIUS-COMPILED-SKILL:BEGIN v1 sha256=30156167087d642b91e99be6d96c4b3e9be964474dbbcaf2ff4cf4bb136dd930 -->

# Simplified Technical English

Write technical text in Simplified Technical English (STE), the controlled
language of ASD-STE100. The specification gives 53 writing rules and a dictionary
of approved words. Readers who do not know much English can understand STE text.

Obey the rules in this file for the technical text that you write. The rules in
this file are the most important rules. The full set is in
`references/writing-rules.md`. The approved words are in
`references/word-list.md`.

## When to use this in a research run

Apply STE to the parts of a deliverable that tell a reader what to do or what is
true about a system:

- Procedures, work instructions, and checklists
- Warnings and cautions
- Error messages, field descriptions, and requirement statements
- A plain-language explanation or summary that the user asks for

**Do not rewrite the evidence.** Quotations, source titles, data tables, and
literature-review prose keep their own wording. Rewriting a quoted provision into
STE changes the quotation. Keep the quotation exactly, then explain it in STE in
a separate sentence.

If the user asks for a different style, the request of the user wins.

## Scope

Apply STE to technical output: documentation, procedures, manuals, instructions,
reports, error messages, and answers about technical subjects.

Do not apply STE to:

- Marketing text or brand text
- Poems, stories, or conversation
- Code blocks, identifiers, commands, file paths, and quoted error messages
- Quoted text and official names of products, parts, and documents

## Step 1: Classify the text

Before you write, classify each part of the text:

- **Procedural text** tells the reader to do something. Example: "Remove the four
  bolts."
- **Descriptive text** gives information. Example: "The pump supplies fuel to the
  engine."

The two types have different limits. Do not mix the two types in one paragraph.

## Step 2: Obey the verb rules

- Use only these verb forms: infinitive, imperative, simple present, simple past,
  future with "will", and past participle as an adjective.
- Do not use the "-ing" form of a verb. Approved "-ing" words are only: mating,
  missing, remaining, lighting, opening, routing, servicing, during.
- Do not use a helping verb with a past participle. Write "the operator adjusted
  the linkage", not "the operator has adjusted the linkage".
- Use the active voice. Write "a relay connects the circuits", not "the circuits
  are connected by a relay".
- In procedures, use the imperative. Write "Set the switch to ON."
- If there is no agent, use "you" or "we" as the subject.
- Use only "can", "must", and "will" as helping verbs. Do not use "should",
  "would", "may", "might", or "shall".
- A past participle after "is" or "are" shows a condition and is permitted. "The
  wires are disconnected."

## Step 3: Obey the sentence rules

- Procedural sentences: maximum 20 words.
- Descriptive sentences: maximum 25 words.
- Paragraphs: maximum 6 sentences, and only one topic.
- Write only one instruction in each sentence. Two actions are permitted only
  when they occur at the same time.
- Write only one topic in each sentence.
- When a condition comes before a command, put a comma after the condition. "If
  the light comes on, stop the engine."
- Keep the articles, the subjects, the verbs, and the conjunction "that". Write
  "make sure that the file exists".
- Do not use contractions. Write "do not", not "don't".
- Do not use semicolons. Write two sentences.
- Use a vertical list for complex text. In a list of commands with "not", write
  "not" again in each item.

## Step 4: Obey the word rules

- Use only: approved words from `references/word-list.md`, technical names, and
  technical verbs.
- A technical name is the official name of a part, tool, material, system,
  document, or term of your subject. Examples: "engine", "firewall", "torque
  wrench", "SKILL.md".
- Use an approved word only as its given part of speech. "Test" is a noun, not a
  verb. Write "do a test", not "test the system".
- Use one name for one item in the full text. Do not change between names for the
  same item.
- Write noun clusters of maximum three words. Break long clusters with "of", "on",
  "in", or "for".
- Do not make phrasal verbs. Write "extinguish the fire", not "put out the fire".
- Do not use vague words. Write the specific quantity, name, or action.
- Use American English spelling.
- Common replacements are in `references/substitutions.md`.

## Step 5: Write safety instructions correctly

- Use "WARNING" for a risk of injury or death to persons.
- Use "CAUTION" for a risk of damage to objects.
- Start with a simple command or condition. Then give the risk.
- Example: "WARNING: Do not touch the connector. The connector can have a
  dangerous voltage."

## Step 6: Check your text

After you write, check your text. Do these steps:

1. If you can run scripts and `python3` is available, run the checker that ships
   with this skill: `python3 <skill-dir>/scripts/ste_check.py --mode
   <procedural|descriptive|mixed> <file>`. In a repository checkout,
   `<skill-dir>` is `skills/simplified-technical-english`.
2. If you cannot run scripts, do a manual scan of the checklist below.
3. Correct each error.
4. Check the text again. Stop only when the text has no errors.

Manual scan checklist:

- Find semicolons and contractions. Remove them.
- Find "has", "have", and "had" before a past participle. Use the simple past
  tense.
- Find "should", "would", "may", "might", and "shall". Replace them or remove
  them.
- Find "-ing" words that are not approved and are not in technical names. Rewrite
  them.
- Find passive voice. Make the agent the subject, or use the imperative.
- Count the words in the longest sentences. Divide sentences that are too long.
- Count the sentences in each paragraph. Divide paragraphs that have more than 6
  sentences.
- Find words that are not approved and are not technical names. Replace them.

The check tool cannot find all the errors. The tool cannot know if a word has its
approved meaning. You must also compare your words with `references/word-list.md`.

## Reference files

- `references/writing-rules.md` — all 53 rules and 4 recommendations, with
  examples. Read this file when you rewrite a document or when a rule is not
  clear.
- `references/word-list.md` — the 869 approved words with their parts of speech
  and forms.
- `references/substitutions.md` — replacements for frequent unapproved words, and
  the categories of technical names and technical verbs.
- `examples/before-after.md` — examples of text before and after the change to
  STE.
- `references/asd-notice.md` — the copyright and no-affiliation notice for
  ASD-STE100 and for this skill.

## Basis

The source of this skill is ASD-STE100 Issue 7 (2017). ASD releases new issues of
the specification. You can get the specification free of charge from
https://www.asd-ste100.org. This skill is not an official ASD document. This skill
cannot make sure that your text obeys the official specification fully. Refer to
`references/asd-notice.md` for the copyright information.

## Boundaries

- **Research-only, not for final engineering sign-off.** This skill controls
  language only. It does not certify that a document obeys ASD-STE100.
- Keep every number, unit, symbol, and safety consequence exactly as the source
  states it. STE shortens sentences; it never changes a value or drops a risk.
- If a document must comply with ASD-STE100, use the official specification and
  an approved process.
