package math

// Cubic evaluates the cubic Bézier with control points p at t in [0, 1].
func Cubic(p [4]Vec3, t float64) Vec3 {
	u := 1 - t
	return p[0].Scale(u * u * u).Add(p[1].Scale(3 * u * u * t)).Add(p[2].Scale(3 * u * t * t)).Add(p[3].Scale(t * t * t))
}
