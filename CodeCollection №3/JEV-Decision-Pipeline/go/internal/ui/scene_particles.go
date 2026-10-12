package ui

import (
	"image/color"
	"math"

	scmath "jev/internal/scene/math"
	"jev/internal/sim"
)

// Particles (SPEC §6.3). Every position is a pure function of the clock and the seed, so the React variant can follow the same rule.
const (
	linkParticleN   = 1500
	dustParticleN   = 300
	chParticle      = 9 // sim.Hash32 channel of link particles, as the spec's rule names it; linkAlpha shares it
	chDust          = 10
	sparkleChance   = 0.15
	particleTexN    = 16
	particleWhite   = 0.4 // link particles lean this far towards white
	particleAlpha   = 0.7
	sparkleAlpha    = 1
	activeParticleN = 24
	activeWhite     = 0.3
	activeSpeed     = 0.6 // path fractions per second
)

// Particle is the seeded state of one link particle; its position follows from the clock.
type Particle struct {
	P, S    float64 // phase at t=0 in [0,1) and speed in link lengths per second
	Sparkle bool
	Size    float64 // diameter in px at the target depth
}

// ParticleParams derives particle i's state from its hash stream. The first three draws are the spec's; the fourth sets the size.
func ParticleParams(seed uint32, i int) Particle {
	r := sim.Mulberry32(sim.Hash32(seed, chParticle, uint32(i)))
	p := r()
	s := 0.15 + 0.35*r()
	sparkle := r() < sparkleChance
	size := 2 + 2*r()
	if sparkle {
		size += 2
	}
	return Particle{P: p, S: s, Sparkle: sparkle, Size: size}
}

// linkParticle is a Particle bound to the link it rides, with its tint precomputed.
type linkParticle struct {
	Particle
	link int // index into sceneLayer.links, which follows sim.Links order
	clr  color.NRGBA
}

// newLinkParticles assigns particle i to link i mod len(links) and tints it towards white.
func newLinkParticles(seed uint32, links []sim.Link) []linkParticle {
	if len(links) == 0 {
		return nil
	}
	out := make([]linkParticle, linkParticleN)
	for i := range out {
		li := i % len(links)
		out[i] = linkParticle{Particle: ParticleParams(seed, i), link: li, clr: mixWhite(linkColor(links[li].Color), particleWhite)}
	}
	return out
}

// Dust is a speck in the void: a fixed world position, a twinkle phase and a diameter in px.
type Dust struct {
	Pos  scmath.Vec3
	Phi  float64
	Size float64
}

// DustParams derives speck i of the seed's dust field from its hash stream.
func DustParams(seed uint32, i int) Dust {
	r := sim.Mulberry32(sim.Hash32(seed, chDust, uint32(i)))
	x := -9 + 18*r()
	y := -19 + 22*r()
	z := -0.4 + 2*r()
	phi := 2 * math.Pi * r()
	return Dust{Pos: scmath.Vec3{x, y, z}, Phi: phi, Size: 1.5 + r()}
}

func newDust(seed uint32) []Dust {
	out := make([]Dust, dustParticleN)
	for i := range out {
		out[i] = DustParams(seed, i)
	}
	return out
}

// dustAlpha twinkles a speck between 0 and 0.5.
func dustAlpha(d Dust, t float64) float64 { return 0.25 + 0.25*math.Sin(1.7*t+d.Phi) }

// particleSize is a particle's diameter at depth, scaled by ref/depth so that specks nearer or farther than the target stay legible.
func particleSize(size, ref, depth float64) float64 {
	return size * math.Min(math.Max(ref/depth, 0.4), 2.5)
}

// mixWhite moves c the fraction f of the way towards white.
func mixWhite(c color.NRGBA, f float64) color.NRGBA {
	mix := func(v uint8) uint8 { return uint8(float64(v) + (255-float64(v))*f + 0.5) }
	return color.NRGBA{R: mix(c.R), G: mix(c.G), B: mix(c.B), A: 0xFF}
}

// appendLinkParticles adds the visible link particles to b as soft sprites at u = frac(P + S·t) along their link's Bézier.
func appendLinkParticles(b *triBatch, pr scmath.Projector, parts []linkParticle, links []linkPlace, t, ref float64) {
	for _, p := range parts {
		l := links[p.link]
		x, y, depth, ok := pr.Project(scmath.Cubic(linkCurve(l.from, l.to), frac(p.P+p.S*t)))
		if !ok {
			continue
		}
		alpha := particleAlpha
		if p.Sparkle {
			alpha = sparkleAlpha
		}
		b.sprite(x, y, particleSize(p.Size, ref, depth)/2, particleTexN, particleTexN, strokeColor(p.clr, alpha))
	}
}

// appendDust adds the visible specks to b as white soft sprites.
func appendDust(b *triBatch, pr scmath.Projector, dust []Dust, t, ref float64) {
	for _, d := range dust {
		x, y, depth, ok := pr.Project(d.Pos)
		if !ok {
			continue
		}
		b.sprite(x, y, particleSize(d.Size, ref, depth)/2, particleTexN, particleTexN, strokeColor(dustColor, dustAlpha(d, t)))
	}
}

var dustColor = color.NRGBA{R: 0xFF, G: 0xFF, B: 0xFF, A: 0xFF}

// drawParticles paints the link particles and dust in one additive batch; it runs after the links and before the cards, so cards hide them.
func (g *Game) drawParticles(pr scmath.Projector, ref float64) {
	s := g.scene
	s.partBatch.reset()
	appendLinkParticles(&s.partBatch, pr, s.parts, s.links, g.t, ref)
	appendDust(&s.partBatch, pr, s.dust, g.t, ref)
	s.partBatch.draw(g.canvas, s.partTex)
}

// appendActiveParticles runs 24 accent particles along the lit path, treating its ribbons as one chain of u in [0,1).
func appendActiveParticles(b *triBatch, pr scmath.Projector, lit []string, centers map[string]scmath.Vec3, accent color.NRGBA, t, ref float64) {
	n := len(lit) - 1
	if n < 1 {
		return
	}
	clr := mixWhite(accent, activeWhite)
	for k := 0; k < activeParticleN; k++ {
		x := frac(float64(k)/activeParticleN+activeSpeed*t) * float64(n)
		seg := min(int(x), n-1)
		pos := scmath.Cubic(linkCurve(centers[lit[seg]], centers[lit[seg+1]]), x-float64(seg))
		px, py, depth, ok := pr.Project(pos)
		if !ok {
			continue
		}
		b.sprite(px, py, particleSize(float64(3+k%3), ref, depth)/2, particleTexN, particleTexN, strokeColor(clr, 1))
	}
}

// drawActiveParticles paints the active-path particles above the cards, so they run over the lit cards too.
func (g *Game) drawActiveParticles(pr scmath.Projector, lit []string, accent color.NRGBA, ref float64) {
	s := g.scene
	s.partBatch.reset()
	appendActiveParticles(&s.partBatch, pr, lit, s.centers, accent, g.t, ref)
	s.partBatch.draw(g.canvas, s.partTex)
}

// frac is x minus its integer part, so the result is in [0,1) for negative x too.
func frac(x float64) float64 { return x - math.Floor(x) }
