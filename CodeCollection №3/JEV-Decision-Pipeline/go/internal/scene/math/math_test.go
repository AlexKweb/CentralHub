package math

import (
	stdmath "math"
	"testing"
)

func near(a, b, eps float64) bool { return stdmath.Abs(a-b) <= eps }

func TestVec3Basics(t *testing.T) {
	x, y := Vec3{1, 0, 0}, Vec3{0, 1, 0}
	if got := x.Cross(y); got != (Vec3{0, 0, 1}) {
		t.Fatalf("x×y = %v, want +Z", got)
	}
	if got := (Vec3{3, 4, 0}).Norm(); !near(got.Len(), 1, 1e-12) {
		t.Fatalf("|norm| = %v", got.Len())
	}
	if got := (Vec3{1, 2, 3}).Dot(Vec3{4, -5, 6}); got != 12 {
		t.Fatalf("dot = %v, want 12", got)
	}
}

func TestMulIdentityAndOrder(t *testing.T) {
	m := Perspective(FOVY, FrameWidth/FrameHeight, Near, Far)
	if got := Identity().Mul(m); got != m {
		t.Fatal("I·M != M")
	}
	tr := Mat4{{1, 0, 0, 0}, {0, 1, 0, 0}, {0, 0, 1, 0}, {5, 0, 0, 1}} // translate x by 5
	sc := Mat4{{2, 0, 0, 0}, {0, 2, 0, 0}, {0, 0, 2, 0}, {0, 0, 0, 1}}
	got := tr.Mul(sc).Transform(Vec3{1, 0, 0}) // scale first, then translate
	if !near(got[0], 7, 1e-12) {
		t.Fatalf("T·S applied to x=1 gives %v, want 7", got[0])
	}
}

func TestLookAtPutsEyeAtOriginAndTargetOnAxis(t *testing.T) {
	eye, target := Vec3{3, 4, 10}, Vec3{-1, 2, 0}
	v := LookAt(eye, target, Vec3{0, 1, 0})
	o := v.Transform(eye)
	if !near(o[0], 0, 1e-12) || !near(o[1], 0, 1e-12) || !near(o[2], 0, 1e-12) {
		t.Fatalf("eye maps to %v, want origin", o)
	}
	d := v.Transform(target)
	if !near(d[0], 0, 1e-9) || !near(d[1], 0, 1e-9) || d[2] >= 0 {
		t.Fatalf("target maps to %v, want −Z axis", d)
	}
}

func TestPerspectiveTopOfFrustumMapsToNDCOne(t *testing.T) {
	p := Perspective(FOVY, 1, Near, Far)
	depth := 20.0
	c := p.Transform(Vec3{0, depth * stdmath.Tan(FOVY/2), -depth})
	if !near(c[1]/c[3], 1, 1e-12) {
		t.Fatalf("top edge ndc y = %v, want 1", c[1]/c[3])
	}
}

func TestProjectTargetLandsOnPrincipalPoint(t *testing.T) {
	eye := Vec3{6.5, 1.2, 20}
	target := Vec3{0, -4, 0}
	pr := NewProjector(eye, target, Vec3{0, 1, 0})
	x, y, depth, ok := pr.Project(target)
	if !ok || !near(x, PrincipalX, 1e-9) || !near(y, PrincipalY, 1e-9) {
		t.Fatalf("target projects to (%v, %v) visible=%v, want (620, 721)", x, y, ok)
	}
	if !near(depth, eye.Sub(target).Len(), 1e-9) {
		t.Fatalf("depth %v, want distance %v", depth, eye.Sub(target).Len())
	}
}

func TestProjectDirections(t *testing.T) {
	pr := NewProjector(Vec3{0, 0, 10}, Vec3{0, 0, 0}, Vec3{0, 1, 0})
	x0, y0, _, _ := pr.Project(Vec3{0, 0, 0})
	xr, _, _, _ := pr.Project(Vec3{1, 0, 0})
	_, yu, _, _ := pr.Project(Vec3{0, 1, 0})
	if !(xr > x0) || !(yu < y0) {
		t.Fatalf("+X should move right and +Y up on screen: x %v→%v, y %v→%v", x0, xr, y0, yu)
	}
}

func TestProjectRejectsPointsBehindNearPlane(t *testing.T) {
	pr := NewProjector(Vec3{0, 0, 10}, Vec3{0, 0, 0}, Vec3{0, 1, 0})
	if _, _, _, ok := pr.Project(Vec3{0, 0, 10 - Near/2}); ok {
		t.Fatal("point inside the near plane reported visible")
	}
	if _, _, _, ok := pr.Project(Vec3{0, 0, 20}); ok {
		t.Fatal("point behind the camera reported visible")
	}
	if _, _, _, ok := pr.Project(Vec3{0, 0, 10 - Far - 1}); ok {
		t.Fatal("point beyond the far plane reported visible")
	}
}

func TestFocalLengthMatchesFOVOnFrameHeight(t *testing.T) {
	// 35° is the vertical field of view of the 1568 px frame, so the focal length is (H/2)/tan(FOV/2) pixels.
	focal := (FrameHeight / 2) / stdmath.Tan(FOVY/2)
	pr := NewProjector(Vec3{0, 0, 0}, Vec3{0, 0, -1}, Vec3{0, 1, 0})
	x, y, _, ok := pr.Project(Vec3{1, 1, -10})
	if !ok || !near(x-PrincipalX, focal/10, 1e-6) || !near(PrincipalY-y, focal/10, 1e-6) {
		t.Fatalf("offset (%v, %v) from principal, want ±%v", x-PrincipalX, PrincipalY-y, focal/10)
	}
}
