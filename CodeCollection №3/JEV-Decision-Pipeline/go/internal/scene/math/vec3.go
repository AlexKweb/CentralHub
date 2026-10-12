// Package math is the small 3D toolkit behind the scene: vectors, 4×4 matrices and a projector onto the logical frame.
package math

import stdmath "math"

// Vec3 is a point or direction in world units.
type Vec3 [3]float64

func (a Vec3) Add(b Vec3) Vec3 { return Vec3{a[0] + b[0], a[1] + b[1], a[2] + b[2]} }

func (a Vec3) Sub(b Vec3) Vec3 { return Vec3{a[0] - b[0], a[1] - b[1], a[2] - b[2]} }

func (a Vec3) Scale(k float64) Vec3 { return Vec3{a[0] * k, a[1] * k, a[2] * k} }

func (a Vec3) Dot(b Vec3) float64 { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2] }

func (a Vec3) Cross(b Vec3) Vec3 {
	return Vec3{a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]}
}

func (a Vec3) Len() float64 { return stdmath.Sqrt(a.Dot(a)) }

func (a Vec3) Norm() Vec3 { return a.Scale(1 / a.Len()) }
