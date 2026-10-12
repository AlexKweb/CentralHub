package ui

import (
	"testing"

	"jev/internal/sim"
)

func TestFlashArrivesAtBallTravelAndDecaysToStageEnd(t *testing.T) {
	if flashAmount(sim.BallTravel-0.01) != 0 {
		t.Fatal("flash before arrival")
	}
	if flashAmount(sim.BallTravel) != 1 {
		t.Fatalf("flash at arrival = %v, want 1", flashAmount(sim.BallTravel))
	}
	if flashAmount(1) != 0 {
		t.Fatalf("flash at stage end = %v, want 0", flashAmount(1))
	}
	prev := 1.0
	for p := sim.BallTravel; p <= 1; p += 0.01 {
		if f := flashAmount(p); f > prev+1e-12 {
			t.Fatalf("flash rises at stage progress %.2f", p)
		} else {
			prev = f
		}
	}
}

func TestEaseInOutCubicIsPinnedAndSymmetric(t *testing.T) {
	if easeInOutCubic(0) != 0 || easeInOutCubic(1) != 1 || easeInOutCubic(0.5) != 0.5 {
		t.Fatal("ease endpoints or midpoint wrong")
	}
	for _, x := range []float64{0.1, 0.25, 0.4} {
		if d := easeInOutCubic(x) + easeInOutCubic(1-x) - 1; d > 1e-12 || d < -1e-12 {
			t.Fatalf("ease not symmetric at %v: residual %v", x, d)
		}
	}
}
