package ui

import (
	"image/color"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/text/v2"
)

// Panel metrics from styles.css (.panel, .panel-head, .panel-body).
const (
	panelBorder  = 1
	panelPadX    = 12
	panelPadY    = 10
	panelBodyGap = 8 // margin-top of .panel-body below the title row
	headSquare   = 6
	headTextX    = 14 // title offset: the 6 px square plus its 8 px margin
)

// Panel colours from SPEC §7 and the React styles.
var (
	colPink    = color.NRGBA{0xFF, 0x5C, 0x8A, 0xFF}
	colCyan    = color.NRGBA{0x4F, 0xD1, 0xE8, 0xFF}
	colBlue    = color.NRGBA{0x5B, 0x9B, 0xFF, 0xFF}
	colAmber   = color.NRGBA{0xF7, 0xB7, 0x31, 0xFF}
	colSoft    = color.NRGBA{0xC9, 0xD1, 0xDD, 0xFF}
	colLaneLLM = color.NRGBA{0x5A, 0x64, 0x75, 0xFF}
	colSegOff  = color.NRGBA{0x1A, 0x21, 0x30, 0xFF}
)

// bottomPanels are the seven SPEC §7 panels; boxes and white titles are painted once into the chrome image.
var bottomPanels = []struct {
	zone  Rect
	title string
}{
	{Frame.Parallel, "PARALLEL QUESTIONS"},
	{Frame.Confidence, "CONFIDENCE STREAM"},
	{Frame.UseCases, "12 USE CASES"},
	{Frame.Chief, "chief.py"},
	{Frame.RunLog, "RUN LOG"},
	{Frame.Split, "THE SPLIT"},
	{Frame.Guardrails, "GUARDRAILS"},
}

// buildChrome paints the static parts of the bottom panels onto a transparent frame-sized image.
func (g *Game) buildChrome() *ebiten.Image {
	img := ebiten.NewImage(FrameWidth, FrameHeight)
	lh := lineH(g.fonts.caption)
	for _, p := range bottomPanels {
		drawBox(img, p.zone)
		c := panelContent(p.zone)
		drawLine(img, p.title, g.fonts.caption, c.X+headTextX, c.Y, lh, colText)
	}
	return img
}

func (g *Game) drawBottomPanels(accent color.NRGBA) {
	g.drawParallel(accent)
	g.drawStream(accent)
	g.drawUseCases(accent)
	g.drawChief(accent)
	g.drawRunLog(accent)
	g.drawSplit(accent)
	g.drawGuardrails(accent)
}

// panelContent is the box inside a panel's border and padding.
func panelContent(z Rect) Rect {
	return Rect{
		X: z.X + panelBorder + panelPadX,
		Y: z.Y + panelBorder + panelPadY,
		W: z.W - 2*(panelBorder+panelPadX),
		H: z.H - 2*(panelBorder+panelPadY),
	}
}

// panelBody is the .panel-body box: everything below the title row and its gap.
func (g *Game) panelBody(z Rect) Rect {
	c := panelContent(z)
	top := c.Y + lineH(g.fonts.caption) + panelBodyGap
	return Rect{X: c.X, Y: top, W: c.W, H: c.Y + c.H - top}
}

// panelHead paints the accent square and right-hand label of a title row; both follow the case accent, so they are drawn each frame.
func (g *Game) panelHead(z Rect, right string, accent color.NRGBA) {
	c := panelContent(z)
	lh := lineH(g.fonts.caption)
	fillRect(g.canvas, c.X, baselineOf(g.fonts.caption, c.Y, lh)-headSquare, headSquare, headSquare, accent)
	drawLineRight(g.canvas, right, g.fonts.caption, c.X+c.W, c.Y, lh, accent)
}

// fitText shortens s with an ellipsis so it fits maxW, as text-overflow: ellipsis does.
func fitText(s string, face text.Face, maxW float64) string {
	if textWidth(s, face) <= maxW {
		return s
	}
	r := []rune(s)
	for n := len(r) - 1; n > 0; n-- {
		if t := string(r[:n]) + "…"; textWidth(t, face) <= maxW {
			return t
		}
	}
	return "…"
}

// typeColor is the colour of a case type: choice pink, score cyan, noul lime.
func typeColor(name string) color.NRGBA {
	switch name {
	case "score":
		return colCyan
	case "noul":
		return colLime
	}
	return colPink
}
