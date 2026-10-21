"""Convert original OTF outlines to TrueType without changing glyph advances.

Usage: python scripts/convert-resume-fonts.py OUTPUT_DIRECTORY INPUT.otf [...]
Requires fonttools==4.60.1. Input fonts and licenses are documented in docs/resume.
"""

import sys
from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont


def convert(source: Path, destination: Path) -> None:
    font = TTFont(source, recalcTimestamp=False)
    glyph_set = font.getGlyphSet()
    original_metrics = font["hmtx"].metrics.copy()
    original_cmap = font.getBestCmap().copy()
    glyphs = {}
    for name in font.getGlyphOrder():
        pen = TTGlyphPen(glyph_set)
        glyph_set[name].draw(Cu2QuPen(pen, max_err=0.25, reverse_direction=True))
        glyphs[name] = pen.glyph()

    del font["CFF "]
    font.sfntVersion = "\x00\x01\x00\x00"
    builder = FontBuilder(font=font)
    builder.isTTF = True
    builder.setupGlyf(glyphs)
    builder.setupMaxp()
    # Keep original shaping, kerning, Unicode mapping, and advance widths.
    # Rename the derivative as requested by the GUST Font License.
    for record in font["name"].names:
        if record.nameID in (1, 3, 4, 6, 16):
            record.string = ("BBResume-" + record.toUnicode()).encode(record.getEncoding())
    font["post"].formatType = 2.0
    font["post"].extraNames = []
    font["post"].mapping = {}
    font.save(destination)

    saved = TTFont(destination)
    assert saved["hmtx"].metrics == original_metrics
    assert saved.getBestCmap() == original_cmap
    assert saved.getGlyphOrder() == font.getGlyphOrder()


if __name__ == "__main__":
    output = Path(sys.argv[1])
    output.mkdir(parents=True, exist_ok=True)
    for filename in sys.argv[2:]:
        source = Path(filename)
        convert(source, output / ("bbresume-" + source.stem + ".ttf"))
