package ui

import "testing"

func TestCaseTileAtFindsTileUnderFramePoint(t *testing.T) {
	body := Rect{X: 100, Y: 200, W: 200, H: 120} // tiles are 64×27 with 4 px gaps
	for _, c := range []struct {
		x, y float64
		want int
	}{
		{200, 244.5, 4},
		{268, 306.5, 11},
		{100, 200, 0},
		{166, 220, -1}, // in the gap between tiles 0 and 1
		{99, 244.5, -1},
	} {
		got, ok := caseTileAt(body, c.x, c.y)
		if c.want < 0 {
			if ok {
				t.Errorf("caseTileAt(%v, %v) = %d, want no tile", c.x, c.y, got)
			}
			continue
		}
		if !ok || got != c.want {
			t.Errorf("caseTileAt(%v, %v) = %d, %v, want %d", c.x, c.y, got, ok, c.want)
		}
	}
}

func TestFitToUndoesLetterboxing(t *testing.T) {
	tall := fitTo(FrameWidth*2, FrameHeight*2+200) // scale 2, 100 px bars above and below
	if x, y := tall.toLogical(FrameWidth, 100+FrameHeight); !near(x, FrameWidth/2) || !near(y, FrameHeight/2) {
		t.Errorf("tall window maps to (%v, %v), want (620, 784)", x, y)
	}
	wide := fitTo(3000, FrameHeight*2) // scale 2, 260 px bars left and right
	if x, y := wide.toLogical(260+200, 2*50); !near(x, 100) || !near(y, 50) {
		t.Errorf("wide window maps to (%v, %v), want (100, 50)", x, y)
	}
}
