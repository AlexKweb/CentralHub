package ui

import (
	"fmt"
	"image/color"
	"math"
	"strings"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/text/v2"

	"jev/internal/sim"
)

// Case-header metrics from styles.css (.case-badge, .case-title, .stage-btn).
const (
	caseTitleX  = 152 // title offset from the zone's left edge
	stageBtnW   = 62
	stageBtnH   = 28
	stageBtnGap = 6
	stageBtnY   = 4 // offset from the zone's top edge
	buttonR     = 4
	pulsePeriod = 1.2 // seconds per next-stage pulse
)

var (
	colCaseSub  = color.NRGBA{0xC9, 0xD1, 0xDD, 0xFF}
	stageLabels = [5]string{"STATE", "ASK", "JEV", "GATE", "CODE"}
)

// drawCaseHeader paints the case badge, the title and subtitle, and the five stage buttons.
func (g *Game) drawCaseHeader(accent color.NRGBA) {
	z := Frame.Case
	tl := sim.Timeline(g.t)
	badge := fmt.Sprintf("CASE %02d / %d", tl.CaseNumber, sim.NumCases)
	bw := textWidth(badge, g.fonts.badge) + 24
	fillRound(g.canvas, Rect{z.X, z.Y + stageBtnY, bw, stageBtnH}, buttonR, accent)
	drawLine(g.canvas, badge, g.fonts.badge, z.X+12, z.Y+stageBtnY, stageBtnH, colBG)

	title := strings.ToUpper(g.cases[tl.CaseIndex].Title)
	drawLine(g.canvas, title, g.fonts.caseTitle, z.X+caseTitleX, z.Y, 36, colText)
	if sub := sim.Subtitle(g.t, g.cases); sub != "" {
		drawLine(g.canvas, sub, g.fonts.label, z.X+caseTitleX, z.Y+38, 18, colCaseSub)
	}

	states := sim.Buttons(tl.StageIndex)
	for i, r := range stageButtons(z) {
		drawStageButton(g.canvas, r, stageLabels[i], g.fonts.small, states[i], accent, g.t)
	}
}

// drawStageButton paints a stage button in its SPEC §5 state; t drives the next-stage pulse.
func drawStageButton(dst *ebiten.Image, r Rect, label string, face text.Face, state string, accent color.NRGBA, t float64) {
	var fill, border, ink color.NRGBA
	switch state {
	case "done":
		border, ink = accent, colText2
	case "current":
		fill, border, ink = accent, accent, colBG
	case "next":
		fill = withAlpha(accent, pulseAlpha(t))
		border, ink = withAlpha(accent, 0.6), colText
	default:
		border, ink = colBorder, colText3
	}
	if fill.A > 0 {
		fillRound(dst, r, buttonR, fill)
	}
	strokeRound(dst, r, buttonR, border)
	drawLine(dst, label, face, r.X+(r.W-textWidth(label, face))/2, r.Y, r.H, ink)
}

// stageButtons places the five buttons flush right in the case zone, 6 px apart.
func stageButtons(z Rect) [5]Rect {
	var out [5]Rect
	x := z.X + z.W - (5*stageBtnW + 4*stageBtnGap)
	for i := range out {
		out[i] = Rect{x + float64(i)*(stageBtnW+stageBtnGap), z.Y + stageBtnY, stageBtnW, stageBtnH}
	}
	return out
}

// stageAt returns the index of the stage button under the logical point (x, y).
func stageAt(z Rect, x, y float64) (int, bool) {
	for i, r := range stageButtons(z) {
		if x >= r.X && x < r.X+r.W && y >= r.Y && y < r.Y+r.H {
			return i, true
		}
	}
	return 0, false
}

// pulseAlpha is the next-stage fill opacity: 0.18 → 0.34 → 0.18 per period, eased like the CSS keyframes.
func pulseAlpha(t float64) float64 {
	phase := math.Mod(t, pulsePeriod) / pulsePeriod
	return 0.18 + 0.16*(0.5-0.5*math.Cos(2*math.Pi*phase))
}
