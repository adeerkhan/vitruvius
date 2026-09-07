---
description: Research Proposal Generator — parse position posting + CV + Personal Statement, research professor/lab, generate targeted Ph.D./Masters research proposal with deep fit analysis. Usage: /proposal --posting <path-or-url> --cv <path> [--statement <path>] [--sample <path>]
---

Run the Research Proposal Generator skill on the provided files: activate
`/skill:proposal`. The skill parses the position posting (PDF/image/URL),
CV, and personal statement. It researches the professor/lab, identifies
lab-specific gaps, and generates a targeted proposal with deep fit analysis.
Works in both CLI (file paths) and desktop apps (file attachments).

Invocation:
```
/proposal --posting <path-or-url> --cv <path> [--statement <path>] [--sample <path>]
```

- `--posting`: Position posting as PDF file, image file (screenshot), or URL
- `--cv`: Path to student's CV (PDF)
- `--statement`: Path to personal statement (optional, used for voice matching)
- `--sample`: Path to separate writing sample (optional, used for voice matching)

All artifacts saved to `projects/<student-slug>/`
