package ui

import (
	"bytes"
	"image/color"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/text/v2"
	"github.com/hajimehoshi/ebiten/v2/vector"

	"jev/internal/assets"
	"jev/internal/sim"
)

var (
	colBG     = color.NRGBA{0x05, 0x07, 0x0B, 0xFF}
	colBorder = color.NRGBA{0x1E, 0x26, 0x36, 0xFF}
	colPanel  = color.NRGBA{0x0A, 0x0E, 0x16, 0xE0}
	colWhite  = color.NRGBA{0xFF, 0xFF, 0xFF, 0xFF}
	colDim    = color.NRGBA{0x6B, 0x74, 0x85, 0xFF}
	colTick   = color.NRGBA{0x2A, 0x33, 0x45, 0xFF}
)

const (
	boxRadius   = 6
	footerTicks = 50
	footerTickH = 6
	footerMarkH = 8
	headerTag   = "centralhub · demo"
	footerLeft  = "LLM WRITES · JEV DECIDES · CODE ACTS"
	footerRight = "metrics illustrative · prices and gate from the article"
)

type fonts struct {
	title, label, caption text.Face
}

func newFonts() (fonts, error) {
	bold, err := text.NewGoTextFaceSource(bytes.NewReader(assets.FontBold()))
	if err != nil {
		return fonts{}, err
	}
	regular, err := text.NewGoTextFaceSource(bytes.NewReader(assets.FontRegular()))
	if err != nil {
		return fonts{}, err
	}
	return fonts{
		title:   &text.GoTextFace{Source: bold, Size: 18},
		label:   &text.GoTextFace{Source: regular, Size: 13},
		caption: &text.GoTextFace{Source: regular, Size: 11},
	}, nil
}

// newBackdrop paints the scene base once: #05070B with dark bands above y=200 and below y=1150.
func newBackdrop() *ebiten.Image {
	img := ebiten.NewImage(FrameWidth, FrameHeight)
	img.Fill(colBG)
	for y := 0; y < 200; y++ {
		a := 0.9 * (1 - float64(y)/200)
		vector.FillRect(img, 0, float32(y), FrameWidth, 1, color.NRGBA{A: uint8(a * 255)}, false)
	}
	for y := 1150; y < FrameHeight; y++ {
		a := 0.9 * float64(y-1150) / float64(FrameHeight-1150)
		vector.FillRect(img, 0, float32(y), FrameWidth, 1, color.NRGBA{A: uint8(a * 255)}, false)
	}
	return img
}

// boxedZones lists the zones drawn as empty panels; header, scene and footer are drawn separately.
func boxedZones() []Rect {
	z := Frame
	return append([]Rect{z.Case, z.Parallel, z.Confidence, z.UseCases, z.Chief, z.RunLog, z.Split, z.Guardrails}, z.KPIs[:]...)
}

// drawBox paints an empty panel: dark fill, 1 px #1E2636 border, rounded corners.
func drawBox(dst *ebiten.Image, r Rect) {
	p := roundRect(r)
	vector.FillPath(dst, p, &vector.FillOptions{}, pathOptions(colPanel))
	vector.StrokePath(dst, p, &vector.StrokeOptions{Width: 1}, pathOptions(colBorder))
}

// roundRect is inset by half a pixel so the 1 px border stays crisp.
func roundRect(r Rect) *vector.Path {
	const k = boxRadius
	x0, y0 := float32(r.X)+0.5, float32(r.Y)+0.5
	x1, y1 := float32(r.X+r.W)-0.5, float32(r.Y+r.H)-0.5
	var p vector.Path
	p.MoveTo(x0+k, y0)
	p.LineTo(x1-k, y0)
	p.QuadTo(x1, y0, x1, y0+k)
	p.LineTo(x1, y1-k)
	p.QuadTo(x1, y1, x1-k, y1)
	p.LineTo(x0+k, y1)
	p.QuadTo(x0, y1, x0, y1-k)
	p.LineTo(x0, y0+k)
	p.QuadTo(x0, y0, x0+k, y0)
	p.Close()
	return &p
}

func pathOptions(clr color.Color) *vector.DrawPathOptions {
	op := &vector.DrawPathOptions{AntiAlias: true}
	op.ColorScale.ScaleWithColor(clr)
	return op
}

func (g *Game) drawHeader(accent color.Color) {
	z := Frame.Header
	cy := z.Y + z.H/2
	label := g.fonts.label
	drawText(g.canvas, "JEV / DECISION PIPELINE", g.fonts.title, 16, cy, colWhite)
	drawText(g.canvas, "SYSTEM ONE · jev-1.13.0", label, 300, cy, accent)
	drawText(g.canvas, "STATE → QUESTIONS → JEV → GATE → CODE", label, 540, cy, colDim)
	drawText(g.canvas, headerTag, label, z.X+z.W-textWidth(headerTag, label), cy, accent)
}

func (g *Game) drawFooter(accent color.Color) {
	z := Frame.Footer
	for i := 0; i <= footerTicks; i++ {
		x := z.X + z.W*float64(i)/footerTicks
		vector.FillRect(g.canvas, float32(x), float32(z.Y), 1, footerTickH, colTick, false)
	}
	mx := z.X + z.W*sim.KPIs(g.t).Marker
	vector.FillRect(g.canvas, float32(mx)-1, float32(z.Y), 3, footerMarkH, accent, false)
	cy := z.Y + footerMarkH + (z.H-footerMarkH)/2
	drawText(g.canvas, footerLeft, g.fonts.caption, z.X, cy, colDim)
	drawText(g.canvas, footerRight, g.fonts.caption, z.X+z.W-textWidth(footerRight, g.fonts.caption), cy, colDim)
}

// drawText draws s with its left edge at x and its vertical center at cy.
func drawText(dst *ebiten.Image, s string, face text.Face, x, cy float64, clr color.Color) {
	_, h := text.Measure(s, face, 0)
	var op text.DrawOptions
	op.GeoM.Translate(x, cy-h/2)
	op.ColorScale.ScaleWithColor(clr)
	text.Draw(dst, s, face, &op)
}

func textWidth(s string, face text.Face) float64 {
	w, _ := text.Measure(s, face, 0)
	return w
}

func accentColor(t float64, cases []sim.Case) color.NRGBA {
	rgb := sim.Accent(t, cases)
	return color.NRGBA{R: uint8(rgb[0]), G: uint8(rgb[1]), B: uint8(rgb[2]), A: 0xFF}
}
