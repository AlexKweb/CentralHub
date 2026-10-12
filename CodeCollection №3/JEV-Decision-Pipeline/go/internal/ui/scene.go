package ui

import (
	"fmt"
	"image/color"
	"math"
	"sort"
	"strings"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/vector"

	"jev/internal/scene/camera"
	scmath "jev/internal/scene/math"
	"jev/internal/sim"
)

// World layout of the 3D scene (SPEC §6.1, §6.2). Cards are 2.3×1.0 units, centred on CardPosition.
const (
	cardHalfW   = 1.15
	cardHalfH   = 0.5
	headerHalfH = 0.25
	headerLift  = 0.95 // header centre above its column's first card
	haloMargin  = 0.3
	haloLift    = -0.02 // halo sits just behind its card
	wallZ       = -0.6
	floorY      = -17.6
	meshCols    = 8
	meshRows    = 4
)

// sceneLayer is the 3D scene: the card layout, grid lines and the textures that persist between frames.
type sceneLayer struct {
	rig       camera.Rig
	cards     []cardPlace
	headers   []headerPlace
	centers   map[string]scmath.Vec3
	links     []linkPlace
	grid      []segment
	sprites   map[string]*sprite
	halo      *ebiten.Image
	white     *ebiten.Image
	verts     []ebiten.Vertex
	linkBatch triBatch
	curvePts  []screenPt
	ballTex   *ebiten.Image
	ballBatch triBatch
	parts     []linkParticle
	partTex   *ebiten.Image
	partBatch triBatch
}

type cardPlace struct {
	id     string
	card   sim.Card
	color  color.NRGBA
	center scmath.Vec3
}

type headerPlace struct {
	col    sim.Column
	color  color.NRGBA
	center scmath.Vec3
}

// sprite is a cached texture and the key it was last painted with.
type sprite struct {
	key string
	img *ebiten.Image
}

// segment is a world-space grid line with its opacity fade already applied.
type segment struct {
	a, b  scmath.Vec3
	alpha float64
}

func newSceneLayer(doc sim.CardsDoc, rig camera.Rig, seed uint32) *sceneLayer {
	s := &sceneLayer{
		rig: rig, sprites: make(map[string]*sprite), centers: make(map[string]scmath.Vec3),
		grid: gridSegments(), halo: haloTexture(), white: whiteTexture(), ballTex: ballTexture(), partTex: softDisc(particleTexN),
	}
	for ci, col := range doc.Columns {
		clr := hexColor(col.Color)
		head := sim.CardPosition(ci, 0)
		s.headers = append(s.headers, headerPlace{
			col:    col,
			color:  clr,
			center: scmath.Vec3{head[0], head[1] + headerLift, 0},
		})
		for row, card := range col.Cards {
			p := sim.CardPosition(ci, row)
			c := scmath.Vec3{p[0], p[1], p[2]}
			s.centers[card.ID] = c
			s.cards = append(s.cards, cardPlace{id: card.ID, card: card, color: clr, center: c})
		}
	}
	links := sim.Links(seed, doc.Columns)
	for i, l := range links {
		s.links = append(s.links, linkPlace{from: s.centers[l.From], to: s.centers[l.To], clr: linkStroke(l.Color, linkAlpha(seed, i))})
	}
	s.parts = newLinkParticles(seed, links)
	return s
}

// drawScene paints the 3D layer into the scene zone: grid, links and the active path, then headers and cards back to front, and the ball on top.
func (g *Game) drawScene(accent color.NRGBA) {
	s := g.scene
	pose := s.rig.Pose(g.t)
	pr := scmath.NewProjector(pose.Position, pose.Target, pose.Up)
	_, _, ref, _ := pr.Project(pose.Target)
	act := sim.Active(g.t, g.cases)
	lit := make(map[string]bool, len(act.Lit))
	for _, id := range act.Lit {
		lit[id] = true
	}
	plates := make(map[string]string, len(act.Plates))
	for _, p := range act.Plates {
		plates[p.Card] = p.Text
	}
	live := g.liveConfidence()
	var flashID string
	var flash float64
	if act.Ball.Arrived {
		flashID, flash = act.Ball.To, flashAmount(sim.Timeline(g.t).StageProgress)
	}

	g.clipped(Frame.Scene, func() {
		drawGrid(g.canvas, pr, s.grid)
		g.drawLinks(pr, act.Lit, accent)
		g.drawParticles(pr, ref)
		type entry struct {
			depth  float64
			card   int // index into s.cards, or -1
			header int // index into s.headers, or -1
		}
		var order []entry
		for i, c := range s.cards {
			if _, _, d, ok := pr.Project(c.center); ok {
				order = append(order, entry{depth: d, card: i, header: -1})
			}
		}
		for i, h := range s.headers {
			if _, _, d, ok := pr.Project(h.center); ok {
				order = append(order, entry{depth: d, card: -1, header: i})
			}
		}
		sort.Slice(order, func(a, b int) bool { return order[a].depth > order[b].depth })
		for _, e := range order {
			if e.card >= 0 {
				c := s.cards[e.card]
				f := 0.0
				if c.id == flashID {
					f = flash
				}
				g.drawCardPlace(pr, c, lit[c.id], accent, plates[c.id], live, f)
			} else {
				g.drawHeaderPlace(pr, s.headers[e.header])
			}
		}
		g.drawBall(pr, act.Ball, accent)
	})
}

func (g *Game) drawCardPlace(pr scmath.Projector, c cardPlace, isLit bool, accent color.NRGBA, plate, live string, flash float64) {
	st := cardState{Title: c.card.Title, Color: c.color, Rows: append([]sim.Row(nil), c.card.Rows...)}
	if isLit {
		st.Lit, st.Accent, st.Plate = true, accent, plate
		if isHead(c.id) {
			for i := range st.Rows {
				if st.Rows[i].K == "confidence" {
					st.Rows[i].V = live
				}
			}
		}
	}
	img := g.scene.sprite("card/"+c.id, cardTexW, cardTexH, fmt.Sprintf("%v", st), func(dst *ebiten.Image) {
		g.paintCard(dst, st)
	})
	if isLit {
		g.scene.quad(g.canvas, pr, scmath.Vec3{c.center[0], c.center[1], c.center[2] + haloLift},
			cardHalfW+haloMargin, cardHalfH+haloMargin, g.scene.halo, 1, 1, glowColor(accent))
	}
	if flash > 0 {
		g.drawFlash(pr, c.center, accent, flash)
	}
	g.scene.quad(g.canvas, pr, c.center, cardHalfW, cardHalfH, img, meshCols, meshRows, [4]float32{1, 1, 1, 1})
}

func (g *Game) drawHeaderPlace(pr scmath.Projector, h headerPlace) {
	key := h.col.Num + "|" + h.col.Title + "|" + h.col.Color
	img := g.scene.sprite("head/"+h.col.ID, cardTexW, headTexH, key, func(dst *ebiten.Image) {
		g.paintHeader(dst, h.col, h.color)
	})
	g.scene.quad(g.canvas, pr, h.center, cardHalfW, headerHalfH, img, 1, 1, [4]float32{1, 1, 1, 1})
}

// sprite returns the texture cached under id, repainting it only when key differs from the last paint.
func (s *sceneLayer) sprite(id string, w, h int, key string, paint func(*ebiten.Image)) *ebiten.Image {
	sp := s.sprites[id]
	if sp == nil {
		sp = &sprite{img: ebiten.NewImage(w, h)}
		s.sprites[id] = sp
	}
	if sp.key != key {
		sp.img.Clear()
		paint(sp.img)
		sp.key = key
	}
	return sp.img
}

// quad draws img onto a cols×rows subdivided rectangle centred at c, so the texture follows perspective.
// The quad is skipped when a corner falls outside the near..far range; cards are never that close to the camera.
func (s *sceneLayer) quad(dst *ebiten.Image, pr scmath.Projector, c scmath.Vec3, hw, hh float64, img *ebiten.Image, cols, rows int, clr [4]float32) {
	w, h := float64(img.Bounds().Dx()), float64(img.Bounds().Dy())
	s.verts = s.verts[:0]
	for j := 0; j <= rows; j++ {
		v := float64(j) / float64(rows)
		for i := 0; i <= cols; i++ {
			u := float64(i) / float64(cols)
			x, y, _, ok := pr.Project(scmath.Vec3{c[0] - hw + 2*hw*u, c[1] + hh - 2*hh*v, c[2]})
			if !ok {
				return
			}
			// Half-texel inset keeps linear filtering inside the image.
			s.verts = append(s.verts, ebiten.Vertex{
				DstX: float32(x), DstY: float32(y),
				SrcX: float32(0.5 + u*(w-1)), SrcY: float32(0.5 + v*(h-1)),
				ColorR: clr[0], ColorG: clr[1], ColorB: clr[2], ColorA: clr[3],
			})
		}
	}
	dst.DrawTriangles(s.verts, gridIndices(cols, rows), img, &ebiten.DrawTrianglesOptions{Filter: ebiten.FilterLinear})
}

// gridIndices is the triangle list of a cols×rows quad mesh whose vertices are laid out row by row.
func gridIndices(cols, rows int) []uint16 {
	idx := make([]uint16, 0, cols*rows*6)
	for j := 0; j < rows; j++ {
		for i := 0; i < cols; i++ {
			a := uint16(j*(cols+1) + i)
			b := a + 1
			c := a + uint16(cols+1)
			d := c + 1
			idx = append(idx, a, b, c, b, d, c)
		}
	}
	return idx
}

// glowColor is the premultiplied vertex colour of the halo at 0.8 opacity.
func glowColor(accent color.NRGBA) [4]float32 {
	const o = 0.8
	return [4]float32{
		float32(accent.R) / 255 * o,
		float32(accent.G) / 255 * o,
		float32(accent.B) / 255 * o,
		o,
	}
}

// haloTexture is a premultiplied white glow: transparent under the card, fading out past its edge.
func haloTexture() *ebiten.Image {
	const w, h = 116, 64 // 40 px per unit over the halo quad
	halfW, halfH := cardHalfW+haloMargin, cardHalfH+haloMargin
	pix := make([]byte, w*h*4)
	for j := 0; j < h; j++ {
		for i := 0; i < w; i++ {
			x := (float64(i)+0.5)/w*2*halfW - halfW
			y := (float64(j)+0.5)/h*2*halfH - halfH
			dx := math.Max(math.Abs(x)-cardHalfW, 0)
			dy := math.Max(math.Abs(y)-cardHalfH, 0)
			var a float64
			if dx > 0 || dy > 0 {
				a = 0.85 * math.Exp(-math.Hypot(dx, dy)/0.09)
			}
			v := uint8(a*255 + 0.5)
			o := (j*w + i) * 4
			pix[o], pix[o+1], pix[o+2], pix[o+3] = v, v, v, v
		}
	}
	img := ebiten.NewImage(w, h)
	img.WritePixels(pix)
	return img
}

// liveConfidence is the current case's confidence as shown on a lit head card, e.g. "0.97".
func (g *Game) liveConfidence() string {
	h := sim.Hundredths(g.cases[sim.Timeline(g.t).CaseIndex].Confidence)
	return fmt.Sprintf("%d.%02d", h/100, h%100)
}

func isHead(id string) bool {
	return strings.HasPrefix(id, "j.") && strings.HasSuffix(id, "_head")
}

// hexColor parses a #RRGGBB column colour from cards.json.
func hexColor(s string) color.NRGBA {
	var r, g, b uint8
	fmt.Sscanf(strings.TrimPrefix(s, "#"), "%02x%02x%02x", &r, &g, &b)
	return color.NRGBA{R: r, G: g, B: b, A: 0xFF}
}

// gridSegments lays out the wall at z = -0.6 and the floor dashes; each line fades with distance from its centre.
func gridSegments() []segment {
	var out []segment
	add := func(a, b, centre scmath.Vec3, radius, strength float64) {
		m := a.Add(b).Scale(0.5)
		if k := strength * math.Max(0, 1-m.Sub(centre).Len()/radius); k > 0 {
			out = append(out, segment{a: a, b: b, alpha: k})
		}
	}
	wall := scmath.Vec3{0, -7.5, wallZ}
	for x := -8.0; x <= 8; x++ {
		add(scmath.Vec3{x, -18, wallZ}, scmath.Vec3{x, 3, wallZ}, wall, 22, 1)
	}
	for y := -18.0; y <= 3; y++ {
		add(scmath.Vec3{-8, y, wallZ}, scmath.Vec3{8, y, wallZ}, wall, 22, 1)
	}
	floor := scmath.Vec3{0, floorY, -6}
	for x := -8.0; x <= 8; x++ {
		for z := -12.0; z < 0; z++ {
			add(scmath.Vec3{x, floorY, z}, scmath.Vec3{x, floorY, z + 0.4}, floor, 16, 0.5)
		}
	}
	return out
}

func drawGrid(dst *ebiten.Image, pr scmath.Projector, lines []segment) {
	for _, l := range lines {
		x1, y1, _, ok1 := pr.Project(l.a)
		x2, y2, _, ok2 := pr.Project(l.b)
		if !ok1 || !ok2 {
			continue
		}
		clr := color.NRGBA{R: 0x1A, G: 0x21, B: 0x30, A: uint8(l.alpha*255 + 0.5)}
		vector.StrokeLine(dst, float32(x1), float32(y1), float32(x2), float32(y2), 1, clr, false)
	}
}
