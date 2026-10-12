package ui

import (
	"testing"

	"jev/internal/assets"
	"jev/internal/scene/camera"
	scmath "jev/internal/scene/math"
	"jev/internal/sim"
)

// Every stage's active card must project inside the scene zone, with every card in front of the camera.
func TestActiveCardProjectsIntoSceneZone(t *testing.T) {
	doc, err := assets.LoadCases()
	if err != nil {
		t.Fatal(err)
	}
	cards, err := assets.LoadCards()
	if err != nil {
		t.Fatal(err)
	}
	rig := camera.NewRig(doc.Cases, cards)
	positions := make(map[string]scmath.Vec3)
	for ci, col := range cards.Columns {
		for row, card := range col.Cards {
			p := sim.CardPosition(ci, row)
			positions[card.ID] = scmath.Vec3{p[0], p[1], p[2]}
		}
	}
	for ci := range doc.Cases {
		for si, id := range doc.Cases[ci].Path {
			tt := sim.JumpToStage(sim.JumpToCase(0, ci), si) + 0.95
			tl := sim.Timeline(tt)
			if tl.CaseIndex != ci || tl.StageIndex != si || tl.StageElapsed < 0.9 {
				t.Fatalf("case %d stage %d: timeline %+v", ci, si, tl)
			}
			pose := rig.Pose(tt)
			pr := scmath.NewProjector(pose.Position, pose.Target, pose.Up)
			x, y, _, ok := pr.Project(positions[id])
			if !ok || x < 0 || x > Frame.Scene.W || y < Frame.Scene.Y || y > Frame.Scene.Y+Frame.Scene.H {
				t.Errorf("case %d stage %d: active card %s at (%.0f, %.0f) visible=%v, outside the scene zone", ci, si, id, x, y, ok)
			}
			for cid, p := range positions {
				if _, _, _, ok := pr.Project(p); !ok {
					t.Errorf("case %d stage %d: card %s behind the near plane", ci, si, cid)
				}
			}
		}
	}
}

func TestGridIndicesCoverEveryCorner(t *testing.T) {
	idx := gridIndices(meshCols, meshRows)
	if len(idx) != meshCols*meshRows*6 {
		t.Fatalf("got %d indices, want %d", len(idx), meshCols*meshRows*6)
	}
	maxIdx := uint16((meshCols+1)*(meshRows+1) - 1)
	seen := make(map[uint16]bool)
	for _, i := range idx {
		if i > maxIdx {
			t.Fatalf("index %d beyond %d vertices", i, maxIdx+1)
		}
		seen[i] = true
	}
	if len(seen) != int(maxIdx)+1 {
		t.Fatalf("triangles use %d of %d vertices", len(seen), maxIdx+1)
	}
}

func TestHexColorAndHeadIDs(t *testing.T) {
	if c := hexColor("#4FD1E8"); c.R != 0x4F || c.G != 0xD1 || c.B != 0xE8 || c.A != 0xFF {
		t.Fatalf("hexColor = %v", c)
	}
	if !isHead("j.choice_head") || isHead("j.cost") || isHead("choice_head") {
		t.Fatal("isHead misclassifies card ids")
	}
}
