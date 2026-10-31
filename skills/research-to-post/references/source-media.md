# Source and Media

Read the source's own material before drafting. A paper's abstract is not the
paper; a README is not the demo. This file gives the commands and the selection
rules.

## PDF to Markdown

Download a remote PDF first:

```bash
mkdir -p outputs/.drafts/
curl -L "<pdf-url>" -o outputs/.drafts/<slug>-source.pdf
```

Extract the text and the figures:

```bash
pdftotext -layout -enc UTF-8 outputs/.drafts/<slug>-source.pdf outputs/.drafts/<slug>-source.txt
mkdir -p outputs/.drafts/<slug>-images/
pdfimages -png -p outputs/.drafts/<slug>-source.pdf outputs/.drafts/<slug>-images/img
```

Write `outputs/.drafts/<slug>-source.md` from the text, with one heading per
page and an image list:

```markdown
# Source: <title>

## Page 1

<page 1 text>

## Page 2

<page 2 text>

## Extracted images

- ![page 1](<slug>-images/img-001-000.png)
- ![page 1](<slug>-images/img-001-001.png)
```

`pdftotext` separates pages with a form feed (`\f`). Split on it and number the
pages. Open the extracted images; they are the figures, tables, and diagrams.
Pick the one that carries the hook's claim.

If `pdfimages` returns no useful figures, render the page and crop the figure:

```bash
pdftoppm -png -r 150 -f <page> -l <page> outputs/.drafts/<slug>-source.pdf outputs/.drafts/<slug>-images/page
```

A paper you cannot open is `blocked`: cite it from metadata and make no claim
about its contents.

## GitHub repository

Read the README and the docs, then list the media in the tree:

```bash
curl -L "https://raw.githubusercontent.com/<owner>/<repo>/main/README.md" -o outputs/.drafts/<slug>-readme.md
curl -L "https://api.github.com/repos/<owner>/<repo>/git/trees/main?recursive=1" -o outputs/.drafts/<slug>-tree.json
```

Look for `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.mp4`, `.webm`, and
`.mov`. Prefer, in order:

1. a screenshot or GIF of the workflow/demo in `site/screenshots/`, `assets/`,
   `docs/`, or `site/public/`;
2. the `og:image` or social card;
3. a diagram that explains the mechanism.

Skip logos, favicons, and skill icons unless the post is about the icon itself.
The README often links a project page; go there next.

## Project page

Fetch the page and collect its media:

```bash
curl -L "<project-url>" -o outputs/.drafts/<slug>-project.html
```

Look for `og:image`, `twitter:image`, `<img src>`, `<video src>`, `<source src>`,
and `.gif` URLs. The project page usually has the demo the README only
describes.

## Save the chosen media

```bash
curl -L "<media-url>" -o outputs/<slug>-media-1.png
```

Use a local file under `outputs/` so the card works offline. Record in the card
JSON:

- `alt`: what the visual shows, including the number and baseline if it has one.
- `caption`: the figure/table/screenshot label.
- `credit`: author, figure number, repo, or project page.
- `license`: the actual license (CC BY 4.0, Apache 2.0, ...).
- `licenseChecked`: `true` only after you read the license.
- `sourceUrl`: the page a reader can open.

If the license is unclear, do not use the media. Use a chart built only from
ledger numbers or a text card instead. Never use a stock photo or a generated
image as evidence.

## Choosing the visual

| Source | The visual that fits |
|--------|----------------------|
| Paper, result-first | The results figure/table the number comes from |
| Paper, mechanism | The schematic or the before/after figure |
| GitHub repo | The workflow screenshot or demo GIF |
| Project page | The hero screenshot or demo video |
| No usable media | A chart of the ledger number vs its baseline, or a text card |

The visual must carry the same claim as the hook. A beautiful screenshot of a
different feature is a different post.
