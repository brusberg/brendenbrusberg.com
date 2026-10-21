# Resume PDF

`main.tex` preserves the original ModernCV classic design: Latin Modern typography, optical sizes, slanted subtitle/contact details, contact icons, red headings, margins, and one-page layout. `original-reference.pdf` is the original published LaTeX PDF used for visual comparison. The resume content is unchanged.

The mobile compatibility repair changes font storage rather than the design:

- The original Latin Modern outlines are converted to embedded TrueType fonts, retaining their advance widths, kerning, and Unicode mappings. Derived fonts are renamed `BBResume-*` under the GUST license.
- Font Awesome contact symbols and bullets are PDF vector paths. They look the same and no longer depend on a mobile viewer interpreting an icon font.
- One full-width bullet explicitly retains the original pdfTeX line break and its ±2% font expansion, since XeTeX does not provide pdfTeX's automatic expansion.

## Build and publish

Install [Tectonic](https://tectonic-typesetting.github.io/) (verified with 0.17.0), then run from the repository root:

```sh
sh scripts/build-resume.sh
```

The first compilation downloads LaTeX packages. The script replaces `public/assets/brenden-brusberg-resume.pdf` only after successful compilation without missing-character or layout warnings. Vercel serves the committed PDF; the website build does not need TeX.

After editing content, keep `resume/index.html` in sync. Bump the PDF download's version query after rebuilding to avoid a cached mobile download.

## Verify appearance and content

Compare the complete rendered page with `original-reference.pdf`, including the name, subtitle, contact symbols, section positions, and line breaks. Check one Letter page, embedded TrueType fonts with Unicode maps, clickable contact links, and unchanged extracted resume text. The PDF keeps the original fixed print layout; `/resume/` provides the responsive reading layout.

## Asset sources and regeneration

The bundled fonts derive from the [Latin Modern distribution](https://ctan.org/pkg/lm), licensed under `fonts/GUST-FONT-LICENSE.TXT`; the original authors' documentation is retained in `fonts/README-Latin-Modern.TXT`. The manifest below identifies each derivative and its corresponding original OTF. The conversion approximates cubic outlines with quadratic curves to a maximum error of 0.25 font units; advances, shaping tables, and Unicode mappings are retained.

| Derivative TTF | Original OTF |
| --- | --- |
| bbresume-lmroman10-regular.ttf | lmroman10-regular.otf |
| bbresume-lmroman10-bold.ttf | lmroman10-bold.otf |
| bbresume-lmroman10-italic.ttf | lmroman10-italic.otf |
| bbresume-lmroman10-bolditalic.ttf | lmroman10-bolditalic.otf |
| bbresume-lmroman12-regular.ttf | lmroman12-regular.otf |
| bbresume-lmroman17-regular.ttf | lmroman17-regular.otf |
| bbresume-lmromanslant10-regular.ttf | lmromanslant10-regular.otf |
| bbresume-lmromanslant17-regular.ttf | lmromanslant17-regular.otf |

Icons use the unmodified glyph outlines from Font Awesome Free 5 by Fonticons, Inc. (`FontAwesome5Free-Regular-400.otf`, `FontAwesome5Free-Solid-900.otf`, and `FontAwesome5Brands-Regular-400.otf` from the Tectonic bundle). Their license and attribution are in `icons/LICENSE.txt`.

Regeneration requires Python with `fonttools==4.60.1` and `pypdf`. The committed assets are sufficient for ordinary resume builds.

```sh
python scripts/convert-resume-fonts.py docs/resume/fonts /path/to/selected-latin-modern-fonts/*.otf
python scripts/build-resume-icons.py /path/to/font-awesome-otfs docs/resume/icons
```
