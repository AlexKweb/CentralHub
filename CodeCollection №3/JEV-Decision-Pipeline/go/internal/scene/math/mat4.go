package math

import stdmath "math"

// Mat4 is column-major: m[c][r] is row r of column c, as in OpenGL.
type Mat4 [4][4]float64

// Identity returns the 4×4 identity matrix.
func Identity() Mat4 {
	return Mat4{{1, 0, 0, 0}, {0, 1, 0, 0}, {0, 0, 1, 0}, {0, 0, 0, 1}}
}

// Mul returns m·n, so that m.Mul(n) applied to a point first applies n.
func (m Mat4) Mul(n Mat4) Mat4 {
	var r Mat4
	for c := 0; c < 4; c++ {
		for row := 0; row < 4; row++ {
			for k := 0; k < 4; k++ {
				r[c][row] += m[k][row] * n[c][k]
			}
		}
	}
	return r
}

// Transform applies m to the point p with w = 1 and returns the homogeneous result.
func (m Mat4) Transform(p Vec3) [4]float64 {
	var out [4]float64
	for row := 0; row < 4; row++ {
		out[row] = m[0][row]*p[0] + m[1][row]*p[1] + m[2][row]*p[2] + m[3][row]
	}
	return out
}

// Perspective is the OpenGL frustum for a vertical field of view fovY (radians).
func Perspective(fovY, aspect, near, far float64) Mat4 {
	f := 1 / stdmath.Tan(fovY/2)
	var m Mat4
	m[0][0] = f / aspect
	m[1][1] = f
	m[2][2] = (far + near) / (near - far)
	m[2][3] = -1
	m[3][2] = 2 * far * near / (near - far)
	return m
}

// LookAt is the view matrix of a camera at eye looking at target, with up roughly vertical on screen.
func LookAt(eye, target, up Vec3) Mat4 {
	f := target.Sub(eye).Norm()
	s := f.Cross(up).Norm()
	u := s.Cross(f)
	return Mat4{
		{s[0], u[0], -f[0], 0},
		{s[1], u[1], -f[1], 0},
		{s[2], u[2], -f[2], 0},
		{-s.Dot(eye), -u.Dot(eye), f.Dot(eye), 1},
	}
}
