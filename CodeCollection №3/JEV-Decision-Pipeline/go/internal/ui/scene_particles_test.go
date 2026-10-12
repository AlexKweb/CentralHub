package ui

import (
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

func TestLinkParticleBatchReusesBuffers(t *testing.T) {
	const seed = 0x5EED
	links := []linkPlace{
		{from: scmath.Vec3{-3, 0, 0}, to: scmath.Vec3{3, 0, 0}},
		{from: scmath.Vec3{-3, 1, 0}, to: scmath.Vec3{3, -1, 0}},
	}
	parts := newLinkParticles(seed, []sim.Link{{From: "a", To: "b", Color: "pink"}, {From: "a", To: "c", Color: "cyan"}})
	pr := scmath.NewProjector(scmath.Vec3{0, 0, 30}, scmath.Vec3{}, scmath.Vec3{0, 1, 0})
	b := &triBatch{}
	fill := func(tt float64) {
		b.reset()
		appendLinkParticles(b, pr, parts, links, tt, 30)
	}
	fill(0)
	if len(b.idx) != linkParticleN*6 {
		t.Fatalf("%d indices, want %d", len(b.idx), linkParticleN*6)
	}
	if allocs := testing.AllocsPerRun(10, func() { fill(1.5) }); allocs != 0 {
		t.Fatalf("%v allocations per frame", allocs)
	}
}
