package ui

import (
	"image/color"
	"math"
	"testing"

	scmath "jev/internal/scene/math"
	"jev/internal/sim"
)

func TestParticleParamsFollowSpecDraws(t *testing.T) {
	const seed = 0x5EED
	for i := 0; i < linkParticleN; i++ {
		r := sim.Mulberry32(sim.Hash32(seed, 9, uint32(i)))
		p := ParticleParams(seed, i)
		if want := r(); p.P != want {
			t.Fatalf("particle %d phase %v, want %v", i, p.P, want)
		}
		if want := 0.15 + 0.35*r(); p.S != want {
			t.Fatalf("particle %d speed %v, want %v", i, p.S, want)
		}
		if want := r() < 0.15; p.Sparkle != want {
			t.Fatalf("particle %d sparkle %v, want %v", i, p.Sparkle, want)
		}
		lo, hi := 2.0, 4.0
		if p.Sparkle {
			lo, hi = 4, 6
		}
		if p.P < 0 || p.P >= 1 || p.S < 0.15 || p.S >= 0.5 || p.Size < lo || p.Size >= hi {
			t.Fatalf("particle %d %+v outside its ranges", i, p)
		}
	}
}

func TestDustParamsFollowSpecDrawsAndStayInTheBox(t *testing.T) {
	const seed = 0x5EED
	for i := 0; i < dustParticleN; i++ {
		r := sim.Mulberry32(sim.Hash32(seed, 10, uint32(i)))
		d := DustParams(seed, i)
		if want := -9 + 18*r(); d.Pos[0] != want {
			t.Fatalf("speck %d x %v, want %v", i, d.Pos[0], want)
		}
		if want := -19 + 22*r(); d.Pos[1] != want {
			t.Fatalf("speck %d y %v, want %v", i, d.Pos[1], want)
		}
		if want := -0.4 + 2*r(); d.Pos[2] != want {
			t.Fatalf("speck %d z %v, want %v", i, d.Pos[2], want)
		}
		if want := 2 * math.Pi * r(); d.Phi != want {
			t.Fatalf("speck %d phase %v, want %v", i, d.Phi, want)
		}
		if d.Size < 1.5 || d.Size >= 2.5 {
			t.Fatalf("speck %d size %v outside [1.5, 2.5)", i, d.Size)
		}
		if a := dustAlpha(d, 3.7); a < 0 || a > 0.5 {
			t.Fatalf("speck %d alpha %v outside [0, 0.5]", i, a)
		}
	}
}

func TestParticleBatchReusesBuffers(t *testing.T) {
	const seed = 0x5EED
	links := []linkPlace{
		{from: scmath.Vec3{-3, 0, 0}, to: scmath.Vec3{3, 0, 0}},
		{from: scmath.Vec3{-3, 1, 0}, to: scmath.Vec3{3, -1, 0}},
	}
	parts := newLinkParticles(seed, []sim.Link{{From: "a", To: "b", Color: "pink"}, {From: "a", To: "c", Color: "cyan"}})
	dust := newDust(seed)
	pr := scmath.NewProjector(scmath.Vec3{0, 0, 30}, scmath.Vec3{}, scmath.Vec3{0, 1, 0})
	b := &triBatch{}
	fill := func(tt float64) {
		b.reset()
		appendLinkParticles(b, pr, parts, links, tt, 30)
		appendDust(b, pr, dust, tt, 30)
	}
	fill(0)
	if want := (linkParticleN + dustParticleN) * 6; len(b.idx) != want {
		t.Fatalf("%d indices, want %d", len(b.idx), want)
	}
	if allocs := testing.AllocsPerRun(10, func() { fill(1.5) }); allocs != 0 {
		t.Fatalf("%v allocations per frame", allocs)
	}
}

func TestActivePathParticlesRunAlongTheLitChain(t *testing.T) {
	centers := map[string]scmath.Vec3{"a": {-3, 0, 0}, "b": {0, 0, 0}, "c": {3, 0, 0}}
	pr := scmath.NewProjector(scmath.Vec3{0, 0, 30}, scmath.Vec3{}, scmath.Vec3{0, 1, 0})
	accent := color.NRGBA{R: 0xC6, G: 0xF2, B: 0x3A, A: 0xFF}
	b := &triBatch{}
	appendActiveParticles(b, pr, []string{"a", "b", "c"}, centers, accent, 2.25, 30)
	if want := activeParticleN * 6; len(b.idx) != want {
		t.Fatalf("%d indices, want %d", len(b.idx), want)
	}
	b.reset()
	appendActiveParticles(b, pr, []string{"a"}, centers, accent, 2.25, 30)
	if len(b.idx) != 0 {
		t.Fatalf("a single lit card drew %d indices, want none", len(b.idx))
	}
}
