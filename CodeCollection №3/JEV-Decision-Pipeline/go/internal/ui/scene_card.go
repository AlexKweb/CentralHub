package ui

import (
	"image/color"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/vector"

	"jev/internal/sim"
)

// Card and header textures are drawn at 2× the 100 px-per-unit layout (SPEC §6.2).
const (
	cardTexW = 460 // 2.3 units
	cardTexH = 200 // 1.0 unit
	headTexH = 100 // 0.5 units
)

var (
	colCardBorder = color.NRGBA{0x2A, 0x33, 0x48, 0xFF}
	colCardFill   = color.NRGBA{0x0D, 0x13, 0x20, 0xE6}
	colCardTitle  = color.NRGBA{0xE6, 0xEB, 0xF5, 0xFF}
	colCardLabel  = color.NRGBA{0x7D, 0x87, 0x99, 0xFF}
	colCardValue  = color.NRGBA{0xC9, 0xD1, 0xE0, 0xFF}
	colInk        = color.NRGBA{0x05, 0x07, 0x0B, 0xFF}
)

// cardState is everything a card texture depends on; the cache repaints only when it changes.
type cardState struct {
	Title  string
	Color  color.NRGBA
	Rows   []sim.Row
	Lit    bool
	Accent color.NRGBA
	Plate  string
}

// paintCard draws a card at 2× density. Lit cards get the accent border, a 12 % fill and a bottom plate.
func (g *Game) paintCard(dst *ebiten.Image, st cardState) {
	body := Rect{W: cardTexW, H: cardTexH}
	fillRound(dst, body, 12, colCardFill)
	border := colCardBorder
	if st.Lit {
		fillRound(dst, body, 12, withAlpha(st.Accent, 0.12))
		border = st.Accent
	}
	strokeRoundW(dst, body, 12, 2, border)

	fillRect(dst, 24, 24, 14, 14, st.Color)
	drawBaseline(dst, fitText(st.Title, g.fonts.cardTitle, cardTexW-76), g.fonts.cardTitle, 52, 48, colCardTitle)
	for i, row := range st.Rows {
		base := 88 + float64(i)*34
		drawBaseline(dst, fitText(row.K, g.fonts.cardRow, 0.45*cardTexW), g.fonts.cardRow, 24, base, colCardLabel)
		v := fitText(row.V, g.fonts.cardRow, 0.55*cardTexW)
		clr := colCardValue
		if row.Hl {
			clr = st.Color
		}
		drawBaseline(dst, v, g.fonts.cardRow, cardTexW-24-textWidth(v, g.fonts.cardRow), base, clr)
	}
	if st.Lit && st.Plate != "" {
		fillRound(dst, Rect{X: 16, Y: 168, W: 428, H: 26}, 4, st.Accent)
		drawBaseline(dst, fitText(st.Plate, g.fonts.cardPlate, 404), g.fonts.cardPlate, 28, 188, colInk)
	} else {
		fillRect(dst, 24, 176, 36, 4, st.Color)
	}
}

// paintHeader draws a column's number and title with an underline in the column colour.
func (g *Game) paintHeader(dst *ebiten.Image, col sim.Column, clr color.NRGBA) {
	num := fitText(col.Num, g.fonts.cardRow, 56)
	drawBaseline(dst, num, g.fonts.cardRow, 0, 52, colCardLabel)
	x := textWidth(num, g.fonts.cardRow) + 20
	title := fitText(col.Title, g.fonts.cardHead, cardTexW-x)
	drawBaseline(dst, title, g.fonts.cardHead, x, 52, colCardTitle)
	fillRect(dst, 0, 72, x+textWidth(title, g.fonts.cardHead), 4, clr)
}

// strokeRoundW strokes a rounded rectangle whose outer edge is exactly r, so a width-w stroke stays inside it.
func strokeRoundW(dst *ebiten.Image, r Rect, k, w float64, clr color.Color) {
	inset := w/2 - 0.5 // roundRect already insets by half a pixel
	r = Rect{X: r.X + inset, Y: r.Y + inset, W: r.W - 2*inset, H: r.H - 2*inset}
	vector.StrokePath(dst, roundRect(r, k), &vector.StrokeOptions{Width: float32(w)}, pathOptions(clr))
}
