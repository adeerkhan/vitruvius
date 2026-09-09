---
name: software
description: >
  Software engineering research. Use when the user invokes /software or asks
  for software engineering research — technical landscape and architecture
  investigations, framework/library/methodology comparison, protocol or
  standards research, security best-practice verification, reproducibility
  audits of a codebase or paper-vs-code claims, API and system design prior
  art. Dispatches to the shared engineering-research method with the software
  evidence landscape.
argument-hint: "<research question> [--deep | --quick]"
allowed-tools: Write Edit Bash
license: MITmetadata:
  version: "0.1.0"

---

# Software Engineering Research

Activate the `/skill:engineering-research` method and run it with this
domain payload. Do not restate the research loop here.

## Evidence landscape

- **Primary sources:** official documentation, language/library/framework
  specs and RFCs, source repositories, issue trackers, release notes, vendor
  docs, published benchmarks with a reproducible methodology.
- **Standards bodies:** IETF RFCs, W3C, ISO/IEC, IEEE, NIST — cite the exact
  document + section when one governs.
- **Prior art:** public codebases (read the actual code before describing
  it), architectural decision records, well-cited engineering blogs,
  peer-reviewed systems literature. For papers and academic prior art, use
  the `/skill:scholarly-research` discovery layers (OpenAlex, Semantic
  Scholar, arXiv).
- **Accept with caveats:** established trade press and secondary summaries.
  Deprioritize undated posts, listicles, and social media without primary
  links.

## Verification criteria

- **Claims about code:** read the code or the official doc before describing
  behavior. A repo exists ≠ a feature exists — verify in the source.
- **Version specificity:** claims must name the version, commit, or release
  they were checked against. Unversioned claims are `inferred`.
- **Benchmarks:** a number must trace to a reproducible methodology — harness,
  hardware, dataset, date. "Verified faster" is not a claim.
- **Security:** any security claim must name the exact CVE, advisory, or
  standard (CWE, OWASP) and the version range it applies to.
- **Paper-vs-code audits:** compare claimed methods, defaults, metrics, and
  data handling against the actual code; call out missing code, mismatches,
  ambiguous defaults, and reproduction risks.

## Deliverable shape

Follow the method's artifact contract. In the final artifact, end with a
**Sources** section of URLs (repo, doc, RFC, advisory), each annotated with
what was checked (e.g. "read §2.3 of the spec" or "verified in commit
abc1234"), and mark every claim `verified`, `inferred`, or `blocked`.

## Invocation Flags

Accept `--deep` and `--quick` flags and pass them through to the
`engineering-research` method. See that skill for flag semantics.

## Gap Detection

If research hits an evidence dead-end — no standard, paper, codebase, or
dataset addresses the question after exhausting the discovery layers — suggest
running `/gap-analysis software <sub-topic>` to formally validate and document
the gap. Do not invoke gap-analysis automatically; offer it as a next step and
wait for the user to confirm.

## Scope and Boundaries

- This skill produces research — it does NOT produce final designs or implementation guidance.
- **Research-only, not for final engineering sign-off.** Licensed engineers must review and approve any design based on this research.
