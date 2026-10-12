package ui

import (
	"fmt"
	"image/color"
	"math"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/vector"

	"jev/internal/sim"
)

// Split and guardrail metrics from styles.css (.split-lanes, .guard-*, .segments).
const (
	laneLabelW  = 84
	guardLabelW = 70
	guardValueW = 80
	railGap     = 10
	splitSegH   = 10
	segGapPx    = 2
	trackBarH   = 6
	actionSegs  = 10
	lockW       = 10
	lockH       = 12
	lockGap     = 6
	guardRows   = 3
	splitRows   = 3
)

// drawSegments paints n equal segments across r; the first lit ones take the on colour.
func drawSegments(dst *ebiten.Image, r Rect, n, lit int, on color.NRGBA) {
	w := (r.W - segGapPx*float64(n-1)) / float64(n)
	for i := 0; i < n; i++ {
		clr := colSegOff
		if i < lit {
			clr = on
		}
		fillRect(dst, r.X+float64(i)*(w+segGapPx), r.Y, w, r.H, clr)
	}
}

// spacedTop places row k of n rows, each rowH tall, in a box of height h spread space-evenly, as the split and guardrail bodies are.
func spacedTop(y, h, rowH float64, n, k int) float64 {
	gap := (h - float64(n)*rowH) / float64(n+1)
	return y + gap*float64(k+1) + rowH*float64(k)
}

func (g *Game) drawSplit(accent color.NRGBA) {
	z := Frame.Split
	g.panelHead(z, "who does what", accent)
	body := g.panelBody(z)
	rowH := lineH(g.fonts.caption)
	vals := sim.Split(g.t, g.seed)
	left := body.X + laneLabelW + railGap
	width := body.X + body.W - left
	lanes := [splitRows]struct {
		label  string
		strong bool
		on     color.NRGBA
	}{
		{"LLM writes", false, colLaneLLM},
		{"Jev decides", true, accent},
		{"code acts", false, colCyan},
	}
	for k, ln := range lanes {
		top := spacedTop(body.Y, body.H, rowH, splitRows, k)
		face, clr := g.fonts.caption, colText2
		if ln.strong {
			face, clr = g.fonts.small, colText
		}
		drawLine(g.canvas, ln.label, face, body.X, top, rowH, clr)
		drawSegments(g.canvas, Rect{X: left, Y: top + (rowH-splitSegH)/2, W: width, H: splitSegH}, sim.SplitSegments, vals[k], ln.on)
	}
}

func (g *Game) drawGuardrails(accent color.NRGBA) {
	z := Frame.Guardrails
	g.panelHead(z, "always on", accent)
	body := g.panelBody(z)
	rowH := lineH(g.fonts.caption)
	k := sim.KPIs(g.t)
	spend := k.SpendText + " / 1.00"
	acts := sim.Actions(g.t, g.seed)
	actText := fmt.Sprintf("%d / %d", acts, actionSegs)
	valW := math.Max(guardValueW, math.Max(textWidth(spend, g.fonts.caption), textWidth(actText, g.fonts.caption)))
	left := body.X + guardLabelW + railGap
	right := body.X + body.W - valW - railGap

	top := spacedTop(body.Y, body.H, rowH, guardRows, 0)
	drawLine(g.canvas, "spend cap", g.fonts.caption, body.X, top, rowH, colText2)
	cy := top + rowH/2
	fillRect(g.canvas, left, cy-trackBarH/2, right-left, trackBarH, colBorder)
	fillRect(g.canvas, left, cy-trackBarH/2, (right-left)*float64(min(100, k.SpendCents))/100, trackBarH, colLime)
	drawLineRight(g.canvas, spend, g.fonts.caption, body.X+body.W, top, rowH, colText)

	top = spacedTop(body.Y, body.H, rowH, guardRows, 1)
	drawLine(g.canvas, "actions", g.fonts.caption, body.X, top, rowH, colText2)
	drawSegments(g.canvas, Rect{X: left, Y: top + (rowH-splitSegH)/2, W: right - left, H: splitSegH}, actionSegs, acts, accent)
	drawLineRight(g.canvas, actText, g.fonts.caption, body.X+body.W, top, rowH, colText)

	top = spacedTop(body.Y, body.H, rowH, guardRows, 2)
	drawLock(g.canvas, body.X, top+(rowH-lockH)/2, colAmber)
	drawLine(g.canvas, "never auto-post to X · progress saved", g.fonts.caption, body.X+lockW+lockGap, top, rowH, colAmber)
}

// drawLock paints the 10×12 padlock of the guardrail footer with its top-left corner at (x, y).
func drawLock(dst *ebiten.Image, x, y float64, clr color.Color) {
	strokeRound(dst, Rect{X: x + 1, Y: y + 5, W: 8, H: 6}, 1, clr)
	var p vector.Path
	p.MoveTo(float32(x+3), float32(y+5))
	p.LineTo(float32(x+3), float32(y+3.5))
	p.CubicTo(float32(x+3), float32(y+2.4), float32(x+3.9), float32(y+1.5), float32(x+5), float32(y+1.5))
	p.CubicTo(float32(x+6.1), float32(y+1.5), float32(x+7), float32(y+2.4), float32(x+7), float32(y+3.5))
	p.LineTo(float32(x+7), float32(y+5))
	vector.StrokePath(dst, &p, &vector.StrokeOptions{Width: 1.2}, pathOptions(clr))
}
