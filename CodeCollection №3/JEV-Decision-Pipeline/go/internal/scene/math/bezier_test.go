package math

import "testing"

func TestCubicHitsEndpointsAndMidpoint(t *testing.T) {
	p := [4]Vec3{{0, 0, 0}, {1, 2, 0}, {3, -1, 1}, {4, 0, 2}}
	if Cubic(p, 0) != p[0] || Cubic(p, 1) != p[3] {
		t.Fatalf("endpoints %v %v, want %v %v", Cubic(p, 0), Cubic(p, 1), p[0], p[3])
	}
	want := p[0].Add(p[1].Scale(3)).Add(p[2].Scale(3)).Add(p[3]).Scale(0.125)
	if got := Cubic(p, 0.5); got.Sub(want).Len() > 1e-12 {
		t.Fatalf("midpoint %v, want %v", got, want)
	}
}
