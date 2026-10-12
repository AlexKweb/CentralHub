package ui

import (
	"fmt"
	"image/color"
	"slices"

	"jev/internal/sim"
)

// Use-case grid metrics from styles.css (.tile-grid, .case-tile, .tile-mark).
const (
	tileCols      = 3
	tileRows      = 4
	tileGap       = 4
	tileRadius    = 4
	tilePadX      = 8
	tilePadY      = 4
	tileLineH     = 13
	tileMarkSize  = 5
	tileMarkInset = 5
)

// tileRect is the box of use-case tile i in the 3×4 grid that fills body.
func tileRect(body Rect, i int) Rect {
	w := (body.W - tileGap*(tileCols-1)) / tileCols
	h := (body.H - tileGap*(tileRows-1)) / tileRows
	col, row := i%tileCols, i/tileCols
	return Rect{
		X: body.X + float64(col)*(w+tileGap),
		Y: body.Y + float64(row)*(h+tileGap),
		W: w,
		H: h,
	}
}

// caseTileAt returns the index of the use-case tile under the frame point (x, y).
func caseTileAt(body Rect, x, y float64) (int, bool) {
	for i := 0; i < sim.NumCases; i++ {
		r := tileRect(body, i)
		if x >= r.X && x < r.X+r.W && y >= r.Y && y < r.Y+r.H {
			return i, true
		}
	}
	return 0, false
}

func (g *Game) drawUseCases(accent color.NRGBA) {
	z := Frame.UseCases
	tl := sim.Timeline(g.t)
	g.panelHead(z, fmt.Sprintf("case %02d", tl.CaseNumber), accent)
	body := g.panelBody(z)
	queued := sim.Queued(g.t, g.seed, tl.CaseIndex)
	for i, c := range g.cases {
		r := tileRect(body, i)
		current := i == tl.CaseIndex
		numC, nameC := colText, colText2
		if current {
			fillRound(g.canvas, r, tileRadius, accent)
			strokeRound(g.canvas, r, tileRadius, accent)
			numC, nameC = colBG, colBG
		} else {
			strokeRound(g.canvas, r, tileRadius, colBorder)
		}
		top := r.Y + panelBorder + tilePadY + (r.H-2*(panelBorder+tilePadY)-2*tileLineH)/2
		x := r.X + panelBorder + tilePadX
		drawLine(g.canvas, fmt.Sprintf("%02d", i+1), g.fonts.small, x, top, tileLineH, numC)
		drawLine(g.canvas, c.Tile, g.fonts.caption, x, top+tileLineH, tileLineH, nameC)
		if current || slices.Contains(queued, i) {
			mark := accent
			if current {
				mark = colBG
			}
			fillRect(g.canvas, r.X+r.W-panelBorder-tileMarkInset-tileMarkSize, r.Y+panelBorder+tileMarkInset, tileMarkSize, tileMarkSize, mark)
		}
	}
}
