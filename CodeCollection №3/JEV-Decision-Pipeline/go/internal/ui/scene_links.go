package ui

import (
	"image/color"
	"math"

	"github.com/hajimehoshi/ebiten/v2"

	scmath "jev/internal/scene/math"
	"jev/internal/sim"
)

// Links are cubic Béziers from a card's right edge to the next column's left edge (SPEC §6.3).
const (
	linkSegments = 24
	linkHandle   = 0.9 // control point offset along x from each endpoint
	linkHalfW    = 0.6 // core half-width in px, a 1.2 px line
	linkFeather  = 0.6 // anti-aliasing rim in px
	chLinkAlpha  = 9   // render channel of sim.Hash32, outside parity
)

var linkHex = map[string]string{
	"white":    "#FFFFFF",
	"pink":     "#FF5C8A",
	"cyan":     "#4FD1E8",
	"lime":     "#C6F23A",
	"lavender": "#A99BFF",
}

// linkPlace is one link in world space with its straight-alpha vertex colour.
type linkPlace struct {
	from, to scmath.Vec3
	clr      [4]float32
}

// screenPt is a sampled curve point in frame pixels; ok is false when the point is outside the projector's depth range.
type screenPt struct {
	x, y float64
	ok   bool
}

// triBatch collects screen-space triangles so a frame needs one DrawTriangles32 call per source texture.
type triBatch struct {
	verts []ebiten.Vertex
	idx   []uint32
}

func (b *triBatch) reset() {
	b.verts = b.verts[:0]
	b.idx = b.idx[:0]
}

// line appends a polyline as a strip of quads: a full-opacity core of half-width halfW and a feather-wide rim that fades to zero.
// Each segment is its own quad, so joints show a faint overlap that additive blending hides.
func (b *triBatch) line(pts []screenPt, halfW, feather float64, clr [4]float32) {
	offs := [4]float64{-(halfW + feather), -halfW, halfW, halfW + feather}
	cov := [4]float32{0, 1, 1, 0}
	for i := 0; i+1 < len(pts); i++ {
		p, q := pts[i], pts[i+1]
		if !p.ok || !q.ok {
			continue
		}
		dx, dy := q.x-p.x, q.y-p.y
		l := math.Hypot(dx, dy)
		if l < 1e-9 {
			continue
		}
		nx, ny := -dy/l, dx/l
		base := uint32(len(b.verts))
		for _, e := range [2]screenPt{p, q} {
			for k, o := range offs {
				b.verts = append(b.verts, ebiten.Vertex{
					DstX: float32(e.x + nx*o), DstY: float32(e.y + ny*o),
					SrcX: 0.5, SrcY: 0.5,
					ColorR: clr[0], ColorG: clr[1], ColorB: clr[2], ColorA: clr[3] * cov[k],
				})
			}
		}
		for k := uint32(0); k < 3; k++ {
			a, bb, c, d := base+k, base+k+1, base+4+k, base+5+k
			b.idx = append(b.idx, a, bb, c, bb, d, c)
		}
	}
}

// sprite appends a square of half-size r centred at (cx, cy) that samples the whole w×h texture.
func (b *triBatch) sprite(cx, cy, r float64, w, h int, clr [4]float32) {
	base := uint32(len(b.verts))
	for _, c := range [4][2]float64{{-1, -1}, {1, -1}, {-1, 1}, {1, 1}} {
		u, v := (c[0]+1)/2, (c[1]+1)/2
		b.verts = append(b.verts, ebiten.Vertex{
			DstX: float32(cx + c[0]*r), DstY: float32(cy + c[1]*r),
			SrcX: float32(0.5 + u*float64(w-1)), SrcY: float32(0.5 + v*float64(h-1)),
			ColorR: clr[0], ColorG: clr[1], ColorB: clr[2], ColorA: clr[3],
		})
	}
	b.idx = append(b.idx, base, base+1, base+2, base+1, base+3, base+2)
}

// draw paints the batch additively onto dst.
func (b *triBatch) draw(dst, src *ebiten.Image) {
	if len(b.idx) == 0 {
		return
	}
	dst.DrawTriangles32(b.verts, b.idx, src, &ebiten.DrawTrianglesOptions{Blend: ebiten.BlendLighter, Filter: ebiten.FilterLinear})
}

// linkCurve runs from a card's right edge to the next card's left edge, with horizontal tangents at both ends.
func linkCurve(from, to scmath.Vec3) [4]scmath.Vec3 {
	p0 := scmath.Vec3{from[0] + cardHalfW, from[1], from[2]}
	p3 := scmath.Vec3{to[0] - cardHalfW, to[1], to[2]}
	h := scmath.Vec3{linkHandle, 0, 0}
	return [4]scmath.Vec3{p0, p0.Add(h), p3.Sub(h), p3}
}

// projectCurve samples c at linkSegments+1 evenly spaced parameters and projects each point into pts.
func projectCurve(pr scmath.Projector, c [4]scmath.Vec3, pts []screenPt) []screenPt {
	for i := 0; i <= linkSegments; i++ {
		x, y, _, ok := pr.Project(scmath.Cubic(c, float64(i)/linkSegments))
		pts = append(pts, screenPt{x: x, y: y, ok: ok})
	}
	return pts
}

// linkAlpha is the seeded opacity of link i, in [0.25, 0.5).
func linkAlpha(seed uint32, i int) float64 {
	return 0.25 + 0.25*float64(sim.Hash32(seed, chLinkAlpha, uint32(i)))/(1<<32)
}

// linkColor is the palette colour of a link; unknown names fall back to white.
func linkColor(name string) color.NRGBA {
	hex, ok := linkHex[name]
	if !ok {
		hex = linkHex["white"]
	}
	return hexColor(hex)
}

// linkStroke is the straight-alpha vertex colour of a link: its palette colour at opacity alpha.
func linkStroke(name string, alpha float64) [4]float32 {
	return strokeColor(linkColor(name), alpha)
}

// strokeColor is the straight-alpha vertex colour of c at opacity alpha.
func strokeColor(c color.NRGBA, alpha float64) [4]float32 {
	return [4]float32{float32(c.R) / 255, float32(c.G) / 255, float32(c.B) / 255, float32(alpha)}
}

// whiteTexture is a 1×1 white texel: the vertex colour alone sets a stroke's colour.
func whiteTexture() *ebiten.Image {
	img := ebiten.NewImage(1, 1)
	img.Fill(color.White)
	return img
}

// drawLinks paints every link and the active path into one additive batch; it runs after the grid and before the cards, so cards hide them.
func (g *Game) drawLinks(pr scmath.Projector, lit []string, accent color.NRGBA) {
	s := g.scene
	s.linkBatch.reset()
	for _, l := range s.links {
		s.curvePts = projectCurve(pr, linkCurve(l.from, l.to), s.curvePts[:0])
		s.linkBatch.line(s.curvePts, linkHalfW, linkFeather, l.clr)
	}
	g.addActivePath(pr, lit, accent)
	s.linkBatch.draw(g.canvas, s.white)
}
