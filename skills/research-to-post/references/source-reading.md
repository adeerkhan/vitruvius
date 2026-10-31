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
mkdir -p outputs/.drafts/<slug>-images/
pdfimages -png -p outputs/.drafts/<slug>-source.pdf outputs/.drafts/<slug>-images/img
```

Write `outputs/.drafts/<slug>-source.md` from the text, with one heading per
page, and list the extracted figures at the end. `pdftotext` separates pages
with a form feed (`\f`); split on it and number the pages.

Read the intro, the result, and the conclusion. The hook usually lives in one of
those, not in the related-work section.

## Pick the best figure

Open the extracted images and choose the one that carries the hook:

- a result figure or table the number comes from,
- a before/after,
- a mechanism diagram,
- the figure the paper's own caption calls the main result.

Skip logos, author photos, and decorative images. If the figure is vector and
`pdfimages` returns nothing useful, render the page and crop it:

```bash
pdftoppm -png -r 150 -f <page> -l <page> outputs/.drafts/<slug>-source.pdf outputs/.drafts/<slug>-images/page
```

Save the chosen image to `outputs/<slug>-media.png`. Record:

- `alt`: what the image shows, including the number and baseline if it has one.
- `caption`: the figure number and a one-line description.
- `credit`: the authors, figure number, and source.
- `license`: the actual license (CC BY 4.0, Apache 2.0, ...).
- `licenseChecked`: `true` only after you read the license.
- `sourceUrl`: the paper or project page.

If the license is unclear, do not use the image. The card can be text-only.

## GitHub repository

Read the README and the docs:

```bash
curl -L "https://raw.githubusercontent.com/<owner>/<repo>/main/README.md" -o outputs/.drafts/<slug>-readme.md
```

If the README links a project page, open it. The project page often has the
plain-language explanation and the demo the README only describes. Use one
screenshot, GIF, or video from the repo or project page as the media item.

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
