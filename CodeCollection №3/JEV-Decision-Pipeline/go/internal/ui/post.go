package ui

import (
	"math"

	"github.com/hajimehoshi/ebiten/v2"

	"jev/internal/fx"
)

// Bloom runs at quarter size: a soft-knee luminance cut, two Gaussian iterations, then an additive upsample.
const (
	bloomDiv       = 4
	bloomThreshold = 0.25
	bloomKnee      = 0.15
	bloomGain      = 1.4
	bloomStep      = 1.0 // tap spacing in quarter-size pixels
)

// Depth of field: a card more than dofBand units from the focus depth is drawn into a blurred layer; the active card always stays sharp.
const (
	dofDiv  = 2
	dofBand = 3.0
	dofStep = 1.5 // tap spacing in half-size pixels
)

// postBuffers are the offscreen frames the effects run through. The logical frame never changes size, so they are allocated once.
type postBuffers struct {
	world     *ebiten.Image // backdrop and scene, the input of every effect
	far       *ebiten.Image // out-of-focus cards, full size
	farHalf   *ebiten.Image // far at half size, blurred
	farTmp    *ebiten.Image // blur ping-pong target, half size
	bright    *ebiten.Image // thresholded bloom source, quarter size
	brightTmp *ebiten.Image // blur ping-pong target, quarter size
}

func newPostBuffers() *postBuffers {
	return &postBuffers{
		world:     ebiten.NewImage(FrameWidth, FrameHeight),
		far:       ebiten.NewImage(FrameWidth, FrameHeight),
		farHalf:   ebiten.NewImage(FrameWidth/dofDiv, FrameHeight/dofDiv),
		farTmp:    ebiten.NewImage(FrameWidth/dofDiv, FrameHeight/dofDiv),
		bright:    ebiten.NewImage(FrameWidth/bloomDiv, FrameHeight/bloomDiv),
		brightTmp: ebiten.NewImage(FrameWidth/bloomDiv, FrameHeight/bloomDiv),
	}
}

// into runs draw with dst as the frame being painted, so helpers that paint g.canvas land there.
func (g *Game) into(dst *ebiten.Image, draw func()) {
	frame := g.canvas
	g.canvas = dst
	draw()
	g.canvas = frame
}

// outOfFocus reports whether a card at depth belongs in the blurred layer; the active card always stays sharp.
func outOfFocus(depth, focus float64, active bool) bool {
	return !active && math.Abs(depth-focus) > dofBand
}

// blurFar shrinks the out-of-focus layer to half size and blurs it; addFar composites the result.
func (p *postBuffers) blurFar() {
	var op ebiten.DrawImageOptions
	op.GeoM.Scale(1.0/dofDiv, 1.0/dofDiv)
	op.Filter = ebiten.FilterLinear
	p.farHalf.Clear()
	p.farHalf.DrawImage(p.far, &op)
	gaussian(p.farHalf, p.farTmp, dofStep)
}

// addFar composites the blurred out-of-focus layer over dst, which is the scene zone while clipped.
func (p *postBuffers) addFar(dst *ebiten.Image) {
	var op ebiten.DrawImageOptions
	op.GeoM.Scale(dofDiv, dofDiv)
	op.Filter = ebiten.FilterLinear
	dst.DrawImage(p.farHalf, &op)
}

// bloom adds the glow of the bright parts of world onto world.
func (p *postBuffers) bloom() {
	b := p.bright.Bounds()
	p.bright.DrawRectShader(b.Dx(), b.Dy(), fx.Threshold, &ebiten.DrawRectShaderOptions{
		Blend:    ebiten.BlendCopy,
		Uniforms: map[string]any{"Threshold": float32(bloomThreshold), "Knee": float32(bloomKnee)},
		Images:   [4]*ebiten.Image{p.world},
	})
	gaussian(p.bright, p.brightTmp, bloomStep)
	var op ebiten.DrawImageOptions
	op.GeoM.Scale(bloomDiv, bloomDiv)
	op.Filter = ebiten.FilterLinear
	op.Blend = ebiten.BlendLighter
	op.ColorScale.Scale(bloomGain, bloomGain, bloomGain, 1)
	p.world.DrawImage(p.bright, &op)
}

// gaussian runs two iterations of the separable blur over buf, ping-ponging through tmp of the same size; step is the tap spacing in pixels.
func gaussian(buf, tmp *ebiten.Image, step float32) {
	for i := 0; i < 2; i++ {
		blurPass(tmp, buf, step, 0)
		blurPass(buf, tmp, 0, step)
	}
}

func blurPass(dst, src *ebiten.Image, dx, dy float32) {
	b := dst.Bounds()
	dst.DrawRectShader(b.Dx(), b.Dy(), fx.Blur, &ebiten.DrawRectShaderOptions{
		Blend:    ebiten.BlendCopy,
		Uniforms: map[string]any{"Step": []float32{dx, dy}},
		Images:   [4]*ebiten.Image{src},
	})
}
