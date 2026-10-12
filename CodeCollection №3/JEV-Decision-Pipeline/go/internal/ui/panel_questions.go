package ui

import (
	"fmt"
	"image/color"
	"math"

	"github.com/hajimehoshi/ebiten/v2/vector"

	"jev/internal/sim"
)

// Parallel questions and confidence stream metrics from styles.css (.pq-*, .stream-*, .legend-row).
const (
	pqRowH        = 14
	pqRowGap      = 7
	pqLabelW      = 62
	pqAnswerW     = 64
	pqGap         = 8
	streamSamples = 80
	streamYMin    = 0.55
	streamYMax    = 1.05
	streamGate    = 0.85
	streamDashOn  = 4
	streamDashOff = 3
	chartRadius   = 4
	legendGap     = 10
	legendTopGap  = 6
)

// streamSeries pairs each sim curve index with its type name and legend label.
var streamSeries = [3]struct{ kind, label string }{
	{"choice", "Choice"},
	{"score", "Score"},
	{"noul", "Noul"},
}

func (g *Game) drawParallel(accent color.NRGBA) {
	z := Frame.Parallel
	g.panelHead(z, "one state", accent)
	body := g.panelBody(z)
	lh := lineH(g.fonts.caption)
	trackX := body.X + pqLabelW + pqGap
	trackW := body.X + body.W - pqAnswerW - pqGap - trackX
	tl := sim.Timeline(g.t)
	for i, row := range sim.Bars(g.seed, tl.CaseIndex, g.cases) {
		top := body.Y + float64(i)*(pqRowH+pqRowGap)
		cy := top + pqRowH/2
		drawLine(g.canvas, row.Label, g.fonts.caption, body.X, top, pqRowH, colText2)
		fill := row.Value * sim.BarGrow(g.t, i) * trackW
		fillRect(g.canvas, trackX, cy-2, trackW, 4, colBorder)
		fillRect(g.canvas, trackX, cy-2, fill, 4, typeColor(row.Type))
		if fill > 0 {
			fillRect(g.canvas, trackX+fill-1, cy-5, 2, 10, colWhite)
		}
		ans := colText3
		if row.Bright {
			ans = colText
		}
		drawLineRight(g.canvas, row.Answer, g.fonts.caption, body.X+body.W, top, pqRowH, ans)
	}
	drawLine(g.canvas, "three answers ≈ one cheap decision", g.fonts.caption, body.X, body.Y+body.H-lh, lh, accent)
}

func (g *Game) drawStream(accent color.NRGBA) {
	z := Frame.Confidence
	g.panelHead(z, "SIM", accent)
	body := g.panelBody(z)
	lh := lineH(g.fonts.caption)
	legendY := body.Y + body.H - lh
	chart := Rect{X: body.X, Y: body.Y, W: body.W, H: legendY - legendTopGap - body.Y}
	strokeRound(g.canvas, chart, chartRadius, colBorder)
	in := Rect{X: chart.X + panelBorder, Y: chart.Y + panelBorder, W: chart.W - 2*panelBorder, H: chart.H - 2*panelBorder}

	gateY := streamY(streamGate, in)
	for x := in.X; x < in.X+in.W; x += streamDashOn + streamDashOff {
		fillRect(g.canvas, x, gateY, math.Min(streamDashOn, in.X+in.W-x), 1, colWhite)
	}
	gateLH := lineH(g.fonts.micro)
	drawLineRight(g.canvas, fmt.Sprintf("%.2f", streamGate), g.fonts.micro, in.X+in.W-4, gateY-gateLH, gateLH, colWhite)

	for k, s := range streamSeries {
		var p vector.Path
		for i := 0; i < streamSamples; i++ {
			x := float64(i) / (streamSamples - 1)
			px, py := in.X+x*in.W, streamY(sim.Stream(g.t, g.seed, k, x), in)
			if i == 0 {
				p.MoveTo(float32(px), float32(py))
			} else {
				p.LineTo(float32(px), float32(py))
			}
		}
		vector.StrokePath(g.canvas, &p, &vector.StrokeOptions{Width: 1.5}, pathOptions(typeColor(s.kind)))
	}

	x := body.X
	for _, s := range streamSeries {
		drawLine(g.canvas, s.label, g.fonts.caption, x, legendY, lh, typeColor(s.kind))
		x += textWidth(s.label, g.fonts.caption) + legendGap
	}
	drawLineRight(g.canvas, "under → human", g.fonts.caption, body.X+body.W, legendY, lh, colText3)
}

// streamY maps a confidence value into the chart's inner box: 0.55 sits at the bottom edge and 1.05 at the top.
func streamY(v float64, in Rect) float64 {
	return in.Y + in.H*(1-(v-streamYMin)/(streamYMax-streamYMin))
}
