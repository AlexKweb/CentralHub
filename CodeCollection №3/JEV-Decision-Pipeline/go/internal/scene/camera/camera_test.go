package camera

import (
	stdmath "math"
	"testing"

	"jev/internal/assets"
	"jev/internal/scene/math"
	"jev/internal/sim"
)

func rig(t *testing.T) Rig {
	t.Helper()
	cases, err := assets.LoadCases()
	if err != nil {
		t.Fatal(err)
	}
	cards, err := assets.LoadCards()
	if err != nil {
		t.Fatal(err)
	}
	return NewRig(cases.Cases, cards)
}

// Times within a 96 s cycle, each stage lasting at least 1.2 s, so the blend always completes inside its stage.
func TestPoseIsContinuousAcrossStageAndCaseBoundaries(t *testing.T) {
	r := rig(t)
	const dt = 1.0 / 600
	prev := r.Pose(0)
	worst := 0.0
	for i := 1; i < 200*600; i++ {
		cur := r.Pose(float64(i) * dt)
		d := cur.Position.Sub(prev.Position).Len()
		if d > worst {
			worst = d
		}
		prev = cur
	}
	// The ease starts at 3.3/s, so the fastest blend step is about 0.066 units; a real jump at a boundary would be over a unit.
	if worst > 0.1 {
		t.Fatalf("camera moved %.4f units in one step, want ≤ 0.1", worst)
	}
}

func TestBlendStartsFromPreviousStageAndConvergesToCurrent(t *testing.T) {
	r := rig(t)
	start := sim.JumpToStage(0, 1) // ASK of case 1; its previous stage is STATE of the same case
	prev, cur := r.stageFrame(0, 0), r.stageFrame(0, 1)
	atStart, converged := 0, 0
	for tt := start; sim.Timeline(tt).StageIndex == 1; tt += 0.01 {
		tl := sim.Timeline(tt)
		switch {
		case tl.StageElapsed < 1e-3:
			atStart++
			if !sameFrame(r.frame(tt), prev) {
				t.Fatalf("elapsed %.4f: %+v, want previous stage %+v", tl.StageElapsed, r.frame(tt), prev)
			}
		case tl.StageElapsed >= blendSeconds:
			converged++
			if !sameFrame(r.frame(tt), cur) {
				t.Fatalf("elapsed %.2f: %+v, want stage frame %+v", tl.StageElapsed, r.frame(tt), cur)
			}
		}
	}
	if atStart == 0 || converged == 0 {
		t.Fatalf("sweep missed a branch: start=%d converged=%d", atStart, converged)
	}
}

func sameFrame(a, b frame) bool {
	return a.target.Sub(b.target).Len() < 1e-9 && stdmath.Abs(a.yaw-b.yaw) < 1e-9 &&
		stdmath.Abs(a.pitch-b.pitch) < 1e-9 && stdmath.Abs(a.roll-b.roll) < 1e-9 &&
		stdmath.Abs(a.distance-b.distance) < 1e-9
}

func TestStagePresetsUseSpecAngles(t *testing.T) {
	r := rig(t)
	f := r.stageFrame(0, 0)
	if !near(f.yaw, 18*deg) || !near(f.pitch, -8*deg) || !near(f.roll, -4*deg) || f.distance != 21 {
		t.Fatalf("state preset = %+v", f)
	}
	c := r.centers[r.cases[0].Path[0]]
	if f.target != (math.Vec3{0.5 * c[0], c[1] - 1.5, 0}) {
		t.Fatalf("target %v, want (0.5·cx, cy−1.5, 0) of %v", f.target, c)
	}
}

func TestPoseIsDeterministicAndUpIsPerpendicularUnit(t *testing.T) {
	r := rig(t)
	for _, tt := range []float64{0, 7.6, 13.68, 58.48, 95.9} {
		p := r.Pose(tt)
		if p != r.Pose(tt) {
			t.Fatalf("pose at %v not deterministic", tt)
		}
		view := p.Position.Sub(p.Target)
		if !near(p.Up.Len(), 1) || !near(p.Up.Dot(view.Norm()), 0) {
			t.Fatalf("t=%v up %v not a perpendicular unit vector", tt, p.Up)
		}
	}
}

func near(a, b float64) bool { return stdmath.Abs(a-b) < 1e-9 }
