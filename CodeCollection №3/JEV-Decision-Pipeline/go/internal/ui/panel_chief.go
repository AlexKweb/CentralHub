package ui

import (
	"image/color"

	"jev/internal/sim"
)

// chiefLineH is the line pitch of the chief.py panel (.chief-line in styles.css).
const chiefLineH = 13

func (g *Game) drawChief(accent color.NRGBA) {
	z := Frame.Chief
	g.panelHead(z, "14 l/s", accent)
	body := g.panelBody(z)
	lines := sim.Chief(g.t, g.chiefText).Visible
	for i, line := range lines {
		top := body.Y + float64(i)*chiefLineH
		if top+chiefLineH > body.Y+body.H {
			break
		}
		current := i == len(lines)-1
		if current {
			fillRect(g.canvas, body.X, top, body.W, chiefLineH, withAlpha(accent, 0.18))
		}
		x := body.X
		for _, tok := range tokenizeChief(line) {
			drawLine(g.canvas, tok.text, g.fonts.caption, x, top, chiefLineH, chiefColor(tok.kind))
			x += textWidth(tok.text, g.fonts.caption)
		}
		if current {
			// Block cursor sits one pixel after the text, with its bottom at the baseline plus one.
			base := baselineOf(g.fonts.caption, top, chiefLineH)
			fillRect(g.canvas, x+1, base-10, 6, 11, accent)
		}
	}
}

func chiefColor(k chiefKind) color.NRGBA {
	switch k {
	case tokKeyword:
		return colPink
	case tokClass:
		return colCyan
	case tokString:
		return colSoft
	case tokComment:
		return colText3
	}
	return colText
}
