# Resume PDF

`main.tex` is the editable LaTeX source for `public/assets/brenden-brusberg-resume.pdf`.
Its content matches the published resume; the contact icons have been replaced by ordinary text labels.

The source uses XeTeX via Tectonic and bundled Liberation Serif 2.1.5 TrueType fonts.
The generated PDF embeds its fonts and Unicode mappings. The previous PDF used Type 1 fonts and Font Awesome's private-use glyphs; this rebuild uses TrueType fonts and ordinary contact labels for broader viewer compatibility.
The fonts are distributed under the SIL Open Font License in `fonts/LICENSE`.

## Build

Install [Tectonic](https://tectonic-typesetting.github.io/) (verified with 0.17.0), then run from the repository root:

```sh
sh scripts/build-resume.sh
```

The first compilation downloads LaTeX packages. The script replaces the public PDF only after a successful compilation without missing-character or layout warnings. The website build serves the committed PDF and does not need a TeX installation.

After changing resume content, keep `resume/index.html` in sync. After rebuilding the PDF, update the version query on its download link to avoid reusing a cached mobile download.

## Verification

Render the PDF and inspect the whole page. Confirm that it remains one US Letter page, contacts are clickable, fonts are embedded, and extracted text retains every resume section. The PDF is a fixed print layout; `/resume/` provides the responsive reading layout for small screens.
