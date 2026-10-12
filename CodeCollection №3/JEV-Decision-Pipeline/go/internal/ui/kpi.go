package ui

import (
	"fmt"
	"image/color"
	"math"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/text/v2"
	"github.com/hajimehoshi/ebiten/v2/vector"

	"jev/internal/sim"
)

// KPI metrics from styles.css (.kpi, .seg-bar, .spark, .thin-bar, .track, .conf-bar).
const (
	kpiPadX     = 14
	kpiPadY     = 12
	kpiGap      = 6
	kpiValueH   = 44 // 44 px numbers at line-height 1
	segGap      = 2
	segH        = 6
	trackH      = 4
	barLabelW   = 28
	barGap      = 8
	sparkW      = 110
	sparkH      = 40
	sparkMin    = 180 // sim.Spark values lie in [180, 300)
	sparkRange  = 120
	latencyLoop = 12.0 // seconds for the latency track to sweep once
	latencySeg  = 0.18 // moving segment width as a share of the track
	confBarH    = 6
)

var (
	colText   = color.NRGBA{0xE8, 0xED, 0xF5, 0xFF}
	colText2  = color.NRGBA{0x7D, 0x8A, 0xA0, 0xFF}
	colText3  = color.NRGBA{0x4A, 0x55, 0x68, 0xFF}
	colLime   = color.NRGBA{0xC6, 0xF2, 0x3A, 0xFF}
	colReview = color.NRGBA{0xFF, 0x9F, 0x43, 0xFF}
	colLLM    = color.NRGBA{0x3A, 0x45, 0x58, 0xFF}
)

type point struct{ X, Y float64 }

// drawKPIs paints the four KPI cards with their 2 px accent top line.
func (g *Game) drawKPIs(accent color.NRGBA) {
	k := sim.KPIs(g.t)
	sp := sim.Spark(g.t, g.seed)
	conf := sim.Confidence(g.t, g.cases)
	cards := Frame.KPIs
	for _, r := range cards {
		drawBox(g.canvas, r)
		fillRect(g.canvas, r.X, r.Y, r.W, 2, accent)
	}
	g.drawDecisionsCard(cards[0], k, accent)
	g.drawLatencyCard(cards[1], sp, accent)
	g.drawCostCard(cards[2], accent)
	g.drawConfidenceCard(cards[3], conf, accent)
}

// cardBody is the content box inside a card's padding.
func cardBody(r Rect) Rect {
	return Rect{r.X + kpiPadX, r.Y + kpiPadY, r.W - 2*kpiPadX, r.H - 2*kpiPadY}
}

// cardLabel draws the dim uppercase label and returns the top of the next row.
func (g *Game) cardLabel(b Rect, label string) float64 {
	lh := lineH(g.fonts.caption)
	drawLine(g.canvas, label, g.fonts.caption, b.X, b.Y, lh, colText2)
	return b.Y + lh + kpiGap
}

func (g *Game) drawDecisionsCard(r Rect, k sim.KPIsResult, accent color.NRGBA) {
	b := cardBody(r)
	y := g.cardLabel(b, "DECISIONS · THIS RUN")
	drawLine(g.canvas, k.DecisionsText, g.fonts.value, b.X, y, kpiValueH, colText)
	y += kpiValueH + kpiGap
	w := segmentWidth(b.W, sim.DecisionSegments, segGap)
	for i := 0; i < sim.DecisionSegments; i++ {
		clr := colBorder
		if i < k.Segments {
			clr = accent
		}
		fillRect(g.canvas, b.X+float64(i)*(w+segGap), y, w, segH, clr)
	}
	y += segH + kpiGap
	drawLine(g.canvas, "SIM · one loop = 10 000", g.fonts.caption, b.X, y, lineH(g.fonts.caption), colText3)
}

func (g *Game) drawLatencyCard(r Rect, sp sim.SparkResult, accent color.NRGBA) {
	b := cardBody(r)
	y := g.cardLabel(b, "MEDIAN LATENCY · REPORTED")
	drawLine(g.canvas, "~256", g.fonts.value, b.X, y, kpiValueH, colText)
	unitX := b.X + textWidth("~256", g.fonts.value) + 4
	drawBaseline(g.canvas, "ms", g.fonts.unit, unitX, baselineOf(g.fonts.value, y, kpiValueH), colText)
	// The sparkline is bottom-aligned with the value row (align-items: flex-end).
	origin := point{b.X + b.W - sparkW, y + kpiValueH - sparkH}
	drawSpark(g.canvas, sparkPoints(sp.Values, sp.Offset, sparkW, sparkH), origin, accent)
	y += kpiValueH + kpiGap
	fillRect(g.canvas, b.X, y, b.W, 2, colBorder)
	if x, w := movingSegment(b.X, b.W, latencyRun(g.t)); w > 0 {
		fillRect(g.canvas, x, y-1, w, 4, accent)
	}
	y += 2 + kpiGap
	drawLine(g.canvas, "public demos · not SLAs", g.fonts.caption, b.X, y, lineH(g.fonts.caption), colText3)
}

func (g *Game) drawCostCard(r Rect, accent color.NRGBA) {
	b := cardBody(r)
	y := g.cardLabel(b, "COST · 10 000 DECISIONS")
	cost := fmt.Sprintf("≈ $%.2f", float64(sim.CostPerDecisionMicros*sim.DecisionsPerLoop)/1e6)
	drawGlow(g.canvas, cost, g.fonts.value, b.X, y, kpiValueH, accent)
	drawLine(g.canvas, cost, g.fonts.value, b.X, y, kpiValueH, accent)
	y += kpiValueH + kpiGap

	lh := lineH(g.fonts.caption)
	perMillion := fmt.Sprintf("$%.3f / M in · out free", float64(sim.CostPerDecisionMicros)/1000)
	trackX := b.X + barLabelW + barGap
	drawLine(g.canvas, "jev", g.fonts.small, b.X, y, lh, colText2)
	jevRight := b.X + b.W - textWidth(perMillion, g.fonts.caption) - barGap
	jevW := jevRight - trackX
	ty := y + (lh-trackH)/2
	fillRect(g.canvas, trackX, ty, jevW, trackH, colBorder)
	fillRect(g.canvas, trackX, ty, jevW*0.04, trackH, accent)
	drawLineRight(g.canvas, perMillion, g.fonts.caption, b.X+b.W, y, lh, colText2)
	y += lh + kpiGap

	drawLine(g.canvas, "LLM", g.fonts.small, b.X, y, lh, colText2)
	ty = y + (lh-trackH)/2
	fillRect(g.canvas, trackX, ty, b.X+b.W-trackX, trackH, colLLM)
}

func (g *Game) drawConfidenceCard(r Rect, conf sim.ConfidenceResult, accent color.NRGBA) {
	b := cardBody(r)
	y := g.cardLabel(b, "CONFIDENCE · LIVE")
	value := colText
	if conf.Hundredths != nil {
		value = colLime
	}
	drawLine(g.canvas, conf.Text, g.fonts.value, b.X, y, kpiValueH, value)
	if conf.Badge != nil {
		badge := *conf.Badge
		bh := lineH(g.fonts.badge) + 12
		bw := textWidth(badge, g.fonts.badge) + 20
		br := Rect{b.X + b.W - bw, y + kpiValueH - bh, bw, bh}
		fill := colReview
		if badge == "PASS" {
			fill = colLime
		}
		fillRound(g.canvas, br, 4, fill)
		drawLine(g.canvas, badge, g.fonts.badge, br.X+10, br.Y+6, lineH(g.fonts.badge), colBG)
	}
	y += kpiValueH + kpiGap
	fillRect(g.canvas, b.X, y, b.W, confBarH, colBorder)
	fillRect(g.canvas, b.X, y, b.W*conf.Fill, confBarH, colLime)
	fillRect(g.canvas, b.X+b.W*float64(sim.GateHundredths)/100, y-3, 2, confBarH+6, colWhite)
	y += confBarH + kpiGap
	lh := lineH(g.fonts.caption)
	drawLine(g.canvas, "calibrate on yours", g.fonts.caption, b.X, y, lh, colText3)
	drawLineRight(g.canvas, fmt.Sprintf("gate %.2f", float64(sim.GateHundredths)/100), g.fonts.caption, b.X+b.W, y, lh, colText3)
}

// segmentWidth is the width of each of n equal segments that share total with gap between them.
func segmentWidth(total float64, n int, gap float64) float64 {
	return (total - gap*float64(n-1)) / float64(n)
}

// latencyRun is the track position in [0, 1) at time t.
func latencyRun(t float64) float64 {
	return math.Mod(t/latencyLoop, 1)
}

// movingSegment is the visible span of the latency segment at fraction frac, clipped to the track.
func movingSegment(x, w, frac float64) (float64, float64) {
	left := x + frac*w
	right := math.Min(x+w, left+latencySeg*w)
	return left, math.Max(0, right-left)
}

// sparkPoints maps sim.Spark values into a w×h box. The first point may lie left of the box; the line is cut where it enters, as an svg with overflow hidden would.
func sparkPoints(values []float64, offset, w, h float64) []point {
	step := w / float64(len(values)-1)
	pts := make([]point, len(values))
	for i, v := range values {
		pts[i] = point{(float64(i) - offset) * step, h * (1 - (v-sparkMin)/sparkRange)}
	}
	if len(pts) > 1 && pts[0].X < 0 {
		a, b := pts[0], pts[1]
		f := -a.X / (b.X - a.X)
		pts[0] = point{0, a.Y + f*(b.Y-a.Y)}
	}
	return pts
}

func drawSpark(dst *ebiten.Image, pts []point, origin point, clr color.Color) {
	var p vector.Path
	for i, q := range pts {
		x, y := float32(origin.X+q.X), float32(origin.Y+q.Y)
		if i == 0 {
			p.MoveTo(x, y)
		} else {
			p.LineTo(x, y)
		}
	}
	vector.StrokePath(dst, &p, &vector.StrokeOptions{Width: 1.5}, pathOptions(clr))
}

// drawGlow fakes CSS text-shadow 0 0 18px rgba(accent, .6) with faint copies on rings around the glyphs.
func drawGlow(dst *ebiten.Image, s string, face text.Face, x, top, lh float64, clr color.NRGBA) {
	glow := withAlpha(clr, 0.05)
	for _, r := range []float64{3, 6, 9} {
		for k := 0; k < 8; k++ {
			a := float64(k) * math.Pi / 4
			drawLine(dst, s, face, x+r*math.Cos(a), top+r*math.Sin(a), lh, glow)
		}
	}
}
