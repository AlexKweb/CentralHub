package ui

import (
	"math"
	"testing"

	scmath "jev/internal/scene/math"
)

func TestLinkCurveEndsOnCardEdgesWithHorizontalTangents(t *testing.T) {
	from := scmath.Vec3{-3, 1.25, 0}
	to := scmath.Vec3{0, -0.35, 0}
	c := linkCurve(from, to)
	if c[0] != (scmath.Vec3{from[0] + cardHalfW, from[1], 0}) || c[3] != (scmath.Vec3{to[0] - cardHalfW, to[1], 0}) {
		t.Fatalf("endpoints %v %v, want right edge of source and left edge of target", c[0], c[3])
	}
	if math.Abs(c[1][0]-c[0][0]-linkHandle) > 1e-9 || math.Abs(c[3][0]-c[2][0]-linkHandle) > 1e-9 || c[1][1] != c[0][1] || c[2][1] != c[3][1] {
		t.Fatalf("control points %v %v are not horizontal handles of %v", c[1], c[2], linkHandle)
	}
	const eps = 1e-6
	start := scmath.Cubic(c, eps).Sub(c[0])
	end := c[3].Sub(scmath.Cubic(c, 1-eps))
	for _, d := range []scmath.Vec3{start, end} {
		if math.Abs(d[1]) > 1e-9 || d[0] <= 0 {
			t.Fatalf("tangent %v is not horizontal and rightward", d)
		}
	}
}

func TestLinkAlphaStaysInRange(t *testing.T) {
	for i := 0; i < 2000; i++ {
		if a := linkAlpha(0x5EED, i); a < 0.25 || a >= 0.5 {
			t.Fatalf("link %d alpha %v outside [0.25, 0.5)", i, a)
		}
	}
}

func TestLinkStrokeUsesPaletteAndFallsBackToWhite(t *testing.T) {
	if c := linkStroke("pink", 0.3); c != [4]float32{1, 0x5C / 255.0, 0x8A / 255.0, 0.3} {
		t.Fatalf("pink = %v", c)
	}
	if c := linkStroke("unknown", 0.5); c != [4]float32{1, 1, 1, 0.5} {
		t.Fatalf("unknown colour = %v", c)
	}
}

func TestLineBatchIndicesStayInRange(t *testing.T) {
	var b triBatch
	pts := []screenPt{{0, 0, true}, {10, 2, true}, {20, 5, true}, {30, 9, false}, {40, 9, true}}
	b.line(pts, 0.6, 0.6, [4]float32{1, 1, 1, 1})
	if len(b.idx) != 18*2 || len(b.verts) != 8*2 {
		t.Fatalf("got %d indices and %d vertices, want 36 and 16 for two drawable segments", len(b.idx), len(b.verts))
	}
	for _, i := range b.idx {
		if int(i) >= len(b.verts) {
			t.Fatalf("index %d beyond %d vertices", i, len(b.verts))
		}
	}
}
