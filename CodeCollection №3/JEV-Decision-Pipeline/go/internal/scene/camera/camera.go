// Package camera turns show time into a camera pose. It is pure: the same t and cases always give the same pose.
package camera

import (
	stdmath "math"

	"jev/internal/scene/math"
	"jev/internal/sim"
)

const (
	deg          = stdmath.Pi / 180
	blendSeconds = 0.9
	swayYaw      = 1.5 * deg
	swayPitch    = 0.8 * deg
)

// preset is the camera for one stage index 0..4 (state, ask, jev, gate, code). Angles are in degrees, distance in world units.
var presets = [5]struct{ yaw, pitch, roll, distance float64 }{
	{18, -8, -4, 21},
	{14, -6, -3, 19},
	{4, -3, 0, 23},
	{-6, -2, 0, 19},
	{-3, 0, 0, 25},
}

// Pose is where the camera sits, what it looks at and which way is up.
type Pose struct {
	Position, Target, Up math.Vec3
}

// frame is a camera state with angles in radians.
type frame struct {
	target                     math.Vec3
	yaw, pitch, roll, distance float64
}

// Rig holds the case list and the card centres that the camera targets.
type Rig struct {
	cases   []sim.Case
	centers map[string]math.Vec3
}

// NewRig indexes card centres by id from the card layout (column order as in cards.json).
func NewRig(cases []sim.Case, cards sim.CardsDoc) Rig {
	centers := make(map[string]math.Vec3)
	for ci, col := range cards.Columns {
		for row, card := range col.Cards {
			p := sim.CardPosition(ci, row)
			centers[card.ID] = math.Vec3{p[0], p[1], p[2]}
		}
	}
	return Rig{cases: cases, centers: centers}
}

// Pose is the camera at show time t: the blended stage frame plus a slow sway.
func (r Rig) Pose(t float64) Pose {
	f := r.frame(t)
	f.yaw += swayYaw * stdmath.Sin(0.4*t)
	f.pitch += swayPitch * stdmath.Sin(0.31*t+1)
	return f.pose()
}

// frame is the target and angles without sway: the previous stage's frame eased into the current stage's.
func (r Rig) frame(t float64) frame {
	tl := sim.Timeline(t)
	cur := r.stageFrame(tl.CaseIndex, tl.StageIndex)
	prevCase, prevStage := tl.CaseIndex, tl.StageIndex-1
	if prevStage < 0 {
		prevCase = (tl.CaseIndex + len(r.cases) - 1) % len(r.cases)
		prevStage = len(presets) - 1
	}
	prev := r.stageFrame(prevCase, prevStage)
	k := easeOutCubic(stdmath.Min(1, tl.StageElapsed/blendSeconds))
	return lerpFrame(prev, cur, k)
}

// stageFrame is the camera for the card that stage si of case ci is on. The target sits halfway between that card and the centre line.
func (r Rig) stageFrame(ci, si int) frame {
	c := r.centers[r.cases[ci].Path[si]]
	p := presets[si]
	return frame{
		target:   math.Vec3{0.5 * c[0], c[1], 0},
		yaw:      p.yaw * deg,
		pitch:    p.pitch * deg,
		roll:     p.roll * deg,
		distance: p.distance,
	}
}

func (f frame) pose() Pose {
	cp := stdmath.Cos(f.pitch)
	dir := math.Vec3{stdmath.Sin(f.yaw) * cp, -stdmath.Sin(f.pitch), stdmath.Cos(f.yaw) * cp}
	// World up made perpendicular to the view axis, then rolled about it.
	u0 := math.Vec3{0, 1, 0}.Sub(dir.Scale(dir[1])).Norm()
	s := dir.Cross(u0)
	up := u0.Scale(stdmath.Cos(f.roll)).Add(s.Scale(stdmath.Sin(f.roll)))
	return Pose{Position: f.target.Add(dir.Scale(f.distance)), Target: f.target, Up: up}
}

func easeOutCubic(x float64) float64 {
	u := 1 - x
	return 1 - u*u*u
}

func lerpFrame(a, b frame, k float64) frame {
	lerp := func(x, y float64) float64 { return x + (y-x)*k }
	return frame{
		target:   math.Vec3{lerp(a.target[0], b.target[0]), lerp(a.target[1], b.target[1]), lerp(a.target[2], b.target[2])},
		yaw:      lerp(a.yaw, b.yaw),
		pitch:    lerp(a.pitch, b.pitch),
		roll:     lerp(a.roll, b.roll),
		distance: lerp(a.distance, b.distance),
	}
}
