// Package ui draws the JEV decision pipeline frame onto an ebitengine screen.
package ui

// Logical frame size (SPEC §3). Ebitengine letterboxes it into the window.
const (
	FrameWidth  = 1240
	FrameHeight = 1568
)

// Rect is a zone in logical pixels.
type Rect struct{ X, Y, W, H float64 }

// Zones is the SPEC §3 grid.
type Zones struct {
	Header     Rect
	KPIs       [4]Rect
	Case       Rect
	Scene      Rect
	Parallel   Rect
	Confidence Rect
	UseCases   Rect
	Chief      Rect
	RunLog     Rect
	Split      Rect
	Guardrails Rect
	Footer     Rect
}

// Frame holds the zone rectangles for the 1240×1568 frame.
var Frame = Zones{
	Header: Rect{14, 16, 1214, 32},
	KPIs: [4]Rect{
		{14, 58, 296, 130},
		{320, 58, 296, 130},
		{626, 58, 296, 130},
		{932, 58, 296, 130},
	},
	Case:       Rect{14, 196, 1214, 66},
	Scene:      Rect{0, 262, FrameWidth, 918},
	Parallel:   Rect{14, 1186, 298, 210},
	Confidence: Rect{322, 1186, 290, 210},
	UseCases:   Rect{626, 1186, 294, 210},
	Chief:      Rect{932, 1186, 296, 210},
	RunLog:     Rect{14, 1404, 484, 120},
	Split:      Rect{506, 1404, 364, 120},
	Guardrails: Rect{878, 1404, 350, 120},
	Footer:     Rect{14, 1532, 1214, 36},
}
