package ui

import (
	"math"

	"github.com/hajimehoshi/ebiten/v2"
	"github.com/hajimehoshi/ebiten/v2/inpututil"

	"jev/internal/params"
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
	t        float64
	seed     uint32
	paused   bool
	fx       bool
	cases    []sim.Case
	fonts    fonts
	canvas   *ebiten.Image
	backdrop *ebiten.Image
	ready    bool
}

// New builds the game from the initial state and the case list; fonts are parsed here.
func New(st params.State, cases []sim.Case) (*Game, error) {
	f, err := newFonts()
	if err != nil {
		return nil, err
	}
	return &Game{
		t:      st.T,
		seed:   st.Seed,
		paused: st.Paused,
		fx:     st.FX,
		cases:  cases,
		fonts:  f,
	}, nil
}

// Update advances the clock at 60 Hz unless paused; Space toggles pause and ←/→ step cases.
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
	if !g.paused {
		g.t += 1.0 / 60
	}
	return nil
}

// Draw paints the frame onto the logical canvas; DrawFinalScreen fits it into the window.
func (g *Game) Draw(*ebiten.Image) {
	if g.canvas == nil {
		g.canvas = ebiten.NewImage(FrameWidth, FrameHeight)
		g.backdrop = newBackdrop()
	}
	g.canvas.DrawImage(g.backdrop, nil)
	accent := accentColor(g.t, g.cases)
	for _, r := range boxedZones() {
		drawBox(g.canvas, r)
	}
	g.drawHeader(accent)
	g.drawFooter(accent)
	g.ready = true
}

// DrawFinalScreen fits the frame into the window without distorting it and fills the margins with #05070B.
func (g *Game) DrawFinalScreen(screen ebiten.FinalScreen, _ *ebiten.Image, _ ebiten.GeoM) {
	b := screen.Bounds()
	sw, sh := float64(b.Dx()), float64(b.Dy())
	s := math.Min(sw/FrameWidth, sh/FrameHeight)
	var op ebiten.DrawImageOptions
	op.GeoM.Scale(s, s)
	op.GeoM.Translate((sw-FrameWidth*s)/2, (sh-FrameHeight*s)/2)
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
