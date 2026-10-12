package ui

import (
	"image/color"
	"math"

	"github.com/hajimehoshi/ebiten/v2"

	scmath "jev/internal/scene/math"
	"jev/internal/sim"
)

// The active path and the ball (SPEC §6.3). The ribbon follows the link curve; the ball rides it by easeInOutCubic of Ball.Progress.
const (
	ribbonCoreHalfW   = 2.0 // a 4 px core
	ribbonCoreFeather = 0.75
	ribbonGlowHalfW   = 5.0 // a wider, dimmer stroke under the core
	ribbonGlowFeather = 3.0
	ribbonGlowAlpha   = 0.22
	ballHaloR         = 26.0 // px
	ballCoreR         = 7.0
	ballHaloAlpha     = 0.85
	flashGrow         = 0.35 // the arrival halo swells by this fraction as it fades
	ballTexN          = 64
)

// addActivePath appends an accent ribbon for each pair of consecutive lit cards to the link batch.
func (g *Game) addActivePath(pr scmath.Projector, lit []string, accent color.NRGBA) {
	s := g.scene
	for i := 0; i+1 < len(lit); i++ {
		s.curvePts = projectCurve(pr, linkCurve(s.centers[lit[i]], s.centers[lit[i+1]]), s.curvePts[:0])
		s.linkBatch.line(s.curvePts, ribbonGlowHalfW, ribbonGlowFeather, strokeColor(accent, ribbonGlowAlpha))
		s.linkBatch.line(s.curvePts, ribbonCoreHalfW, ribbonCoreFeather, strokeColor(accent, 1))
	}
}

// drawBall paints the ball above the cards. From stage 1 it rides the link curve from the previous card; at stage 0 it fades in on the state card.
func (g *Game) drawBall(pr scmath.Projector, b sim.ActiveBall, accent color.NRGBA) {
	s := g.scene
	e := easeInOutCubic(b.Progress)
	to := s.centers[b.To]
	pos, alpha := to, e
	if b.From != nil {
		pos, alpha = scmath.Cubic(linkCurve(s.centers[*b.From], to), e), 1
	}
	x, y, _, ok := pr.Project(pos)
	if !ok {
		return
	}
	s.ballBatch.reset()
	s.ballBatch.sprite(x, y, ballHaloR, ballTexN, ballTexN, strokeColor(accent, ballHaloAlpha*alpha))
	s.ballBatch.sprite(x, y, ballCoreR, ballTexN, ballTexN, strokeColor(lighten(accent), alpha))
	s.ballBatch.draw(g.canvas, s.ballTex)
}

// drawFlash swells the target card's halo at arrival; k runs from 1 at arrival to 0 at the stage end.
func (g *Game) drawFlash(pr scmath.Projector, centre scmath.Vec3, accent color.NRGBA, k float64) {
	grow := 1 + flashGrow*k
	glow := glowColor(accent)
	for i := range glow {
		glow[i] *= float32(k)
	}
	halo := scmath.Vec3{centre[0], centre[1], centre[2] + haloLift}
	g.scene.quad(g.canvas, pr, halo, (cardHalfW+haloMargin)*grow, (cardHalfH+haloMargin)*grow, g.scene.halo, 1, 1, glow)
}

// flashAmount is 1 when the ball arrives and decays to 0 at the stage end; it is 0 before arrival.
func flashAmount(stageProgress float64) float64 {
	if stageProgress < sim.BallTravel {
		return 0
	}
	u := math.Min(1, (stageProgress-sim.BallTravel)/(1-sim.BallTravel))
	return (1 - u) * (1 - u)
}

// easeInOutCubic shapes the ball's travel along the curve.
func easeInOutCubic(x float64) float64 {
	if x < 0.5 {
		return 4 * x * x * x
	}
	u := 2 - 2*x
	return 1 - u*u*u/2
}

// lighten mixes c halfway towards white for the ball's bright core.
func lighten(c color.NRGBA) color.NRGBA {
	mix := func(v uint8) uint8 { return uint8((int(v) + 255) / 2) }
	return color.NRGBA{R: mix(c.R), G: mix(c.G), B: mix(c.B), A: 0xFF}
}

// ballTexture is a premultiplied white disc with a soft radial falloff, shared by the ball's halo and core.
func ballTexture() *ebiten.Image { return softDisc(ballTexN) }

// softDisc is a premultiplied white n×n disc with a soft radial falloff, shared by the ball and the particles.
func softDisc(n int) *ebiten.Image {
	pix := make([]byte, n*n*4)
	for j := 0; j < n; j++ {
		for i := 0; i < n; i++ {
			x := (float64(i)+0.5)/float64(n)*2 - 1
			y := (float64(j)+0.5)/float64(n)*2 - 1
			r := math.Min(1, math.Hypot(x, y))
			v := uint8((1-r)*(1-r)*255 + 0.5)
			o := (j*n + i) * 4
			pix[o], pix[o+1], pix[o+2], pix[o+3] = v, v, v, v
		}
	}
	img := ebiten.NewImage(n, n)
	img.WritePixels(pix)
	return img
}
