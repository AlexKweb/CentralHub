package ui

import (
	"image/color"
	"math"

	"github.com/hajimehoshi/ebiten/v2"

	"jev/internal/sim"
)

// Run log metrics from styles.css (.log-window, .log-row, .log-tag).
const (
	logLineH   = 15
	logWindowH = 75
	logTagW    = 64
)

// drawRunLog scrolls the rows inside an offscreen buffer, which clips them to the window.
func (g *Game) drawRunLog(accent color.NRGBA) {
	z := Frame.RunLog
	g.panelHead(z, "8 l/s", accent)
	body := g.panelBody(z)
	view := sim.Log(g.t, g.seed, g.cases)
	rows := view.Lines
	// One row below the window, so the upward scroll never reveals an empty gap.
	if next := sim.Log(g.t+1.0/sim.LogSlotsPerSecond, g.seed, g.cases).Lines; len(next) > 0 {
		rows = append(rows, next[len(next)-1])
	}
	g.logBuf.Clear()
	for i, line := range rows {
		top := (float64(i) - view.Scroll) * logLineH
		drawLine(g.logBuf, line.Tag, g.fonts.small, 0, top, logLineH, logTagColor(line.Tag))
		text := fitText(line.Text, g.fonts.caption, body.W-logTagW)
		drawLine(g.logBuf, text, g.fonts.caption, logTagW, top, logLineH, colText2)
	}
	var op ebiten.DrawImageOptions
	op.GeoM.Translate(math.Round(body.X), math.Round(body.Y))
	g.canvas.DrawImage(g.logBuf, &op)
}

func logTagColor(tag string) color.NRGBA {
	switch tag {
	case "ask":
		return colSoft
	case "jev":
		return colBlue
	case "gate":
		return colAmber
	case "code":
		return colCyan
	case "limit":
		return colText2
	}
	return colText
}
