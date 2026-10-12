package ui

import (
	"math"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/inpututil"

	"jev/internal/assets"
	"jev/internal/params"
	"jev/internal/scene/camera"
	"jev/internal/sim"
)

// Snapshot is the show state reported through the browser hook.
type Snapshot struct {
	Case   int
	Stage  string
	T      float64
	Paused bool
}

// Game advances the show clock and paints the logical 1240×1568 frame.
type Game struct {
	t         float64
	seed      uint32
	paused    bool
	fx        bool
	cases     []sim.Case
	chiefText string
	cards     sim.CardsDoc
	rig       camera.Rig
	scene     *sceneLayer // built on the first Draw, with the images it needs
	fonts     fonts
	canvas    *ebiten.Image
	backdrop  *ebiten.Image
	chrome    *ebiten.Image // static panel boxes and titles, painted once
	logBuf    *ebiten.Image // clips the scrolling run log
	layer     *ebiten.Image // scratch frame behind clipped regions, see clipped
	post      *postBuffers  // offscreen frames of the post-effects, see post.go
	fit       fit           // window mapping from the last DrawFinalScreen
	ready     bool
}

// fit maps frame coordinates to the window: a uniform scale and the offset of the frame's origin.
type fit struct{ s, ox, oy float64 }

// fitTo letterboxes the logical frame into a sw×sh screen, as DrawFinalScreen does.
func fitTo(sw, sh float64) fit {
	s := math.Min(sw/FrameWidth, sh/FrameHeight)
	return fit{s: s, ox: (sw - FrameWidth*s) / 2, oy: (sh - FrameHeight*s) / 2}
}

// toLogical maps a window point to frame coordinates.
func (f fit) toLogical(x, y float64) (float64, float64) {
	return (x - f.ox) / f.s, (y - f.oy) / f.s
}

// New builds the game from the initial state and the case list; fonts are parsed here.
func New(st params.State, cases []sim.Case) (*Game, error) {
	f, err := newFonts()
	if err != nil {
		return nil, err
	}
	cards, err := assets.LoadCards()
	if err != nil {
		return nil, err
	}
	return &Game{
		t:         st.T,
		seed:      st.Seed,
		paused:    st.Paused,
		fx:        st.FX,
		cases:     cases,
		chiefText: assets.ChiefText(),
		cards:     cards,
		rig:       camera.NewRig(cases, cards),
		fonts:     f,
	}, nil
}

// Update advances the clock at 60 Hz unless paused; Space toggles pause, ←/→ step cases, and a click on a stage button or use-case tile jumps to it.
func (g *Game) Update() error {
	if inpututil.IsKeyJustPressed(ebiten.KeySpace) {
		g.paused = !g.paused
	}
	if inpututil.IsKeyJustPressed(ebiten.KeyArrowLeft) {
		g.t = sim.PrevCase(g.t)
	}
	if inpututil.IsKeyJustPressed(ebiten.KeyArrowRight) {
		g.t = sim.NextCase(g.t)
	}
	if inpututil.IsMouseButtonJustPressed(ebiten.MouseButtonLeft) {
		if x, y, ok := g.cursorLogical(); ok {
			if si, ok := stageAt(Frame.Case, x, y); ok {
				g.t = sim.JumpToStage(g.t, si)
			} else if ci, ok := caseTileAt(g.panelBody(Frame.UseCases), x, y); ok {
				g.t = sim.JumpToCase(g.t, ci)
			}
		}
	}
	if !g.paused {
		g.t += 1.0 / 60
	}
	return nil
}

// cursorLogical maps the cursor into frame coordinates, so clicks match what is drawn inside the letterbox.
func (g *Game) cursorLogical() (float64, float64, bool) {
	if g.fit.s == 0 {
		return 0, 0, false
	}
	x, y := ebiten.CursorPosition()
	lx, ly := g.fit.toLogical(float64(x), float64(y))
	return lx, ly, true
}

// Draw paints the frame onto the logical canvas; DrawFinalScreen fits it into the window.
func (g *Game) Draw(*ebiten.Image) {
	if g.canvas == nil {
		g.canvas = ebiten.NewImage(FrameWidth, FrameHeight)
		g.layer = ebiten.NewImage(FrameWidth, FrameHeight)
		g.post = newPostBuffers()
		g.scene = newSceneLayer(g.cards, g.rig, g.seed)
		g.backdrop = newBackdrop()
		g.chrome = g.buildChrome()
		g.logBuf = ebiten.NewImage(int(g.panelBody(Frame.RunLog).W), logWindowH)
	}
	accent := accentColor(g.t, g.cases)
	if g.fx {
		g.into(g.post.world, func() {
			g.canvas.DrawImage(g.backdrop, nil)
			g.drawScene(accent)
		})
		g.post.bloom()
		g.canvas.DrawImage(g.post.world, nil)
	} else {
		g.canvas.DrawImage(g.backdrop, nil)
		g.drawScene(accent)
	}
	g.canvas.DrawImage(g.chrome, nil)
	g.drawHeader(accent)
	g.drawKPIs(accent)
	g.drawCaseHeader(accent)
	g.drawBottomPanels(accent)
	g.drawFooter(accent)
	g.ready = true
}

// DrawFinalScreen fits the frame into the window without distorting it and fills the margins with #05070B.
func (g *Game) DrawFinalScreen(screen ebiten.FinalScreen, _ *ebiten.Image, _ ebiten.GeoM) {
	b := screen.Bounds()
	g.fit = fitTo(float64(b.Dx()), float64(b.Dy()))
	var op ebiten.DrawImageOptions
	op.GeoM.Scale(g.fit.s, g.fit.s)
	op.GeoM.Translate(g.fit.ox, g.fit.oy)
	op.Filter = ebiten.FilterLinear
	screen.Fill(colBG)
	screen.DrawImage(g.canvas, &op)
}

// Layout and LayoutF report the fixed logical frame; the window is fitted in DrawFinalScreen.
func (g *Game) Layout(int, int) (int, int) { return FrameWidth, FrameHeight }

func (g *Game) LayoutF(float64, float64) (float64, float64) { return FrameWidth, FrameHeight }

// Snapshot reports the case number, stage and clock for the browser hook.
func (g *Game) Snapshot() Snapshot {
	tl := sim.Timeline(g.t)
	return Snapshot{Case: tl.CaseNumber, Stage: tl.Stage, T: g.t, Paused: g.paused}
}

// Ready reports whether a frame has been drawn.
func (g *Game) Ready() bool { return g.ready }
