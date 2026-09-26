# Input Gate

Every research-producing skill opens with the same short gate before it spends a
tool call. It is a visible, one-question check — not a form, and not a hidden
phase. The shared method's gate lives in `engineering-research`; this file is the
portable version for skills that run on their own.

All must hold before searching:

1. **Ask** — the specific question this run answers, in one sentence. If it is
   too vague to answer with evidence, ask the user ONE clarifying question, then
   proceed.
2. **Artifact / scope** — what is under study (files, repo + commit, documents,
   standards) and what is out of scope. A run with no artifact is a literature
   review; say so rather than implying an artifact was read.
3. **Context** — jurisdiction/edition, host, and the decision the answer serves,
   or record that edition-sensitive claims will be marked `partial`.
4. **Effort** — the user's turn/token budget if given; otherwise thorough until
   the evidence saturates (see `references/context-management.md`).
5. **Writes** — file writes available, or return content inline and say the
   artifacts were not persisted (see the File Write Fallback in
   `engineering-research`).

Machine-enforce only the high-risk intake: a claim about an artifact under study
must name that artifact (and its commit) before it is made. Everything else is a
gate stated in the output, not a silent assumption.

If a gate fails, resolve it before searching. Do not degrade silently; record
the resolution where the run keeps its decisions.

Research-only, not for final engineering sign-off.
