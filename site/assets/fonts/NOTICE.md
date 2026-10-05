# Bundled fonts

Two self-hosted `woff2` files, fetched once and committed so the site has no
third-party request on its critical path. Both are licensed under the SIL Open
Font License 1.1, whose text is included beside them (OFL §1 requires the
license to accompany any redistribution).

| File | Family | Style | Bytes | SHA-256 |
|------|--------|-------|-------|---------|
| `inter-var-latin.woff2` | Inter | roman, variable `wght 400–700` | 72,920 | `2c295d99e26dcf357d4d01bcf270fd6924b600c9a13dd8c363ef114f4c6976fa` |
| `playfair-display-var-italic-latin.woff2` | Playfair Display | italic, variable `wght 400–700` | 38,804 | `54af24bd0f911f0fd7399d5445ea2023ff501d6a69f2d728f1213072f977ab14` |

- `OFL-inter.txt` — Inter, "Copyright 2020 The Inter Project Authors".
- `OFL-playfairdisplay.txt` — Playfair Display.

Retrieved 2026-10-06 from the exact URLs recorded in `site/assets/css/site.css`,
which are the resolved `src` URLs from the Google Fonts stylesheet for
`Inter:wght@400..700` and `Playfair+Display:ital,wght@400..700`. The version
numbers are not recorded because the served URLs
(`.../s/inter/v20/…`, `.../s/playfairdisplay/v40/…`) are Google Fonts' internal
revision identifiers, not an upstream release number. The hashes are the
identity here: re-fetch and a hash change means the served file changed.

## Subset coverage is a real constraint on the copy

Both files are the `latin` subset. The `unicode-range` they are served with is:

```
U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193,
U+2212, U+2215, U+FEFF, U+FFFD
```

So `—` `·` `•` `×` `“ ”` render in Inter. `→` (U+2192) does **not**, and neither
does `✓` or `⌘`. Anywhere the page wants an arrow or a tick, it draws one as
inline SVG or a CSS border instead of using a glyph, so the whole page stays on
exactly two font files rather than silently falling back to a system font.

## Replacing these

`site/assets/css/site.css` holds the only `@font-face` rules. Swap the file,
update the table above with the new hash and byte count, and keep both OFL
files next to them.