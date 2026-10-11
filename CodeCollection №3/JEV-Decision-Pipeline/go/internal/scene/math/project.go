package math

import stdmath "math"

// Logical frame and camera constants (SPEC §3, §6.4).
const (
	FOVY        = 35 * stdmath.Pi / 180
	FrameWidth  = 1240.0
	FrameHeight = 1568.0
	// PrincipalX and PrincipalY are where the camera target lands on the frame: the centre of the scene zone.
	PrincipalX = 620.0
	PrincipalY = 721.0
	Near       = 0.5
	Far        = 200.0
)

// Projector maps world points to frame pixels for one camera pose.
type Projector struct {
	view, vp Mat4
	shiftY   float64
}

// NewProjector builds the projection for a camera at eye looking at target with the given up vector.
func NewProjector(eye, target, up Vec3) Projector {
	view := LookAt(eye, target, up)
	proj := Perspective(FOVY, FrameWidth/FrameHeight, Near, Far)
	// Shifting NDC y after the divide moves the principal point without tilting the view.
	return Projector{view: view, vp: proj.Mul(view), shiftY: 1 - 2*PrincipalY/FrameHeight}
}

// Project returns the frame position of p and its depth in front of the camera.
// visible is false outside the near..far range, where the projection is meaningless and callers must skip the point.
func (pr Projector) Project(p Vec3) (x, y, depth float64, visible bool) {
	depth = -pr.view.Transform(p)[2]
	if depth < Near || depth > Far {
		return 0, 0, depth, false
	}
	c := pr.vp.Transform(p)
	ndcX := c[0] / c[3]
	ndcY := c[1]/c[3] + pr.shiftY
	return (ndcX + 1) / 2 * FrameWidth, (1 - ndcY) / 2 * FrameHeight, depth, true
}
