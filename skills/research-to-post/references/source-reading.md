# Reading the Source

Read the source before writing. A title is not a source. An abstract is a
summary, not the paper.

## PDF to Markdown

Download a remote PDF:

```bash
mkdir -p outputs/.drafts/
curl -L "<pdf-url>" -o outputs/.drafts/<slug>-source.pdf
```

Convert it:

```bash
pdftotext -layout -enc UTF-8 outputs/.drafts/<slug>-source.pdf outputs/.drafts/<slug>-source.txt
```

Write `outputs/.drafts/<slug>-source.md` from the text, with one heading per
page. `pdftotext` separates pages with a form feed (`\f`); split on it and number
the pages.

Read the intro, the result, and the conclusion. The hook usually lives in one of
those, not in the related-work section.

## GitHub repository

Read the README and the docs:

```bash
curl -L "https://raw.githubusercontent.com/<owner>/<repo>/main/README.md" -o outputs/.drafts/<slug>-readme.md
```

If the README links a project page, open it. The project page often has the
plain-language explanation and the demo the README only describes.

## Project page

```bash
curl -L "<project-url>" -o outputs/.drafts/<slug>-project.html
```

Read the headline, the first two sections, and the "how it works" part. Those
are the parts a reader will click for.

## What to look for

- The one sentence that makes you say "wait, really?"
- A number that sounds wrong until the source explains it.
- A common assumption the source contradicts.
- A before/after.
- The part the abstract leaves out.

Do not write the post from the abstract. If you could not open the source, say
so and stop; do not invent its contents.
