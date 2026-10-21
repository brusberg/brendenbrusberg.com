"""Preserve the original Font Awesome glyphs as font-independent PDF artwork.

Usage: python scripts/build-resume-icons.py FONT_DIRECTORY OUTPUT_DIRECTORY
Requires fonttools==4.60.1 and pypdf. See docs/resume/README.md for font sources.
"""

import sys
from pathlib import Path

from fontTools.pens.basePen import BasePen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont
from pypdf import PdfWriter
from pypdf.generic import DecodedStreamObject, NameObject


class PdfPathPen(BasePen):
    def __init__(self, glyph_set):
        super().__init__(glyph_set)
        self.commands = []

    def _moveTo(self, point):
        self.commands.append(f"{point[0]} {point[1]} m")

    def _lineTo(self, point):
        self.commands.append(f"{point[0]} {point[1]} l")

    def _curveToOne(self, *points):
        self.commands.append(" ".join(str(v) for p in points for v in p) + " c")

    def _closePath(self):
        self.commands.append("h")


def build(font_directory: Path, output: Path) -> None:
    output.mkdir(parents=True, exist_ok=True)
    icons = [
        ("Envelope", "Free-Regular-400", 0xF0E0),
        ("Globe", "Free-Solid-900", 0xF57D),
        ("LinkedIn", "Brands-Regular-400", 0xF0E1),
        ("GitHub", "Brands-Regular-400", 0xF09B),
        ("Circle", "Free-Regular-400", 0xF111),
    ]
    macros = ["% Generated vector glyphs: original shapes, no icon font dependency."]
    for name, family, codepoint in icons:
        font = TTFont(font_directory / f"FontAwesome5{family}.otf")
        glyph_set = font.getGlyphSet()
        glyph_name = font.getBestCmap()[codepoint]
        bounds = BoundsPen(glyph_set)
        glyph_set[glyph_name].draw(bounds)
        _, bottom, right, top = bounds.bounds
        advance = font["hmtx"][glyph_name][0]
        width = max(advance, right)
        em = font["head"].unitsPerEm
        pen = PdfPathPen(glyph_set)
        glyph_set[glyph_name].draw(pen)
        color = "0.8 0.16078 0.26668" if name == "Circle" else "0.28235 0.28235 0.28235"
        stream = DecodedStreamObject()
        stream.set_data((f"q 1 0 0 1 0 {-bottom} cm {color} rg\n" + "\n".join(pen.commands) + "\nf Q").encode())
        writer = PdfWriter()
        page = writer.add_blank_page(width=width, height=top-bottom)
        page[NameObject("/Contents")] = writer._add_object(stream)
        writer.write(output / f"{name}.pdf")
        macros.append(
            rf"\newcommand{{\resume{name}}}{{\raisebox{{{bottom/em:.8f}em}}{{\includegraphics[width={width/em:.8f}em]{{icons/{name}.pdf}}}}\kern{(advance-width)/em:.8f}em}}"
        )
    (output / "icons.tex").write_text("\n".join(macros) + "\n")


if __name__ == "__main__":
    build(Path(sys.argv[1]), Path(sys.argv[2]))
