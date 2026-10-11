package ui

import (
	"math"
	"testing"
)

func near(got, want float64) bool { return math.Abs(got-want) < 1e-9 }

func TestSegmentWidthSharesTotalBetweenGaps(t *testing.T) {
	if got := segmentWidth(268, 30, 2); !near(got, 7) {
		t.Fatalf("segment width = %v, want 7", got)
	}
}

func TestLatencyRunSweepsEveryTwelveSeconds(t *testing.T) {
	for _, c := range []struct{ t, want float64 }{{0, 0}, {3, 0.25}, {12, 0}, {13.5, 0.125}} {
		if got := latencyRun(c.t); !near(got, c.want) {
			t.Errorf("latencyRun(%v) = %v, want %v", c.t, got, c.want)
		}
	}
}

func TestMovingSegmentClipsToTrack(t *testing.T) {
	if x, w := movingSegment(100, 200, 0.25); !near(x, 150) || !near(w, 36) {
		t.Errorf("mid track = (%v, %v), want (150, 36)", x, w)
	}
	if x, w := movingSegment(100, 200, 0.95); !near(x, 290) || !near(w, 10) {
		t.Errorf("near end = (%v, %v), want (290, 10)", x, w)
	}
}

func TestSparkPointsCutAtLeftEdge(t *testing.T) {
	values := make([]float64, 24)
	for i := range values {
		values[i] = 240
	}
	values[0] = 180
	pts := sparkPoints(values, 0.5, sparkW, sparkH)
	if !near(pts[0].X, 0) || !near(pts[0].Y, 30) {
		t.Errorf("entry point = %+v, want {0 30}", pts[0])
	}
	if want := (23 - 0.5) * sparkW / 23; !near(pts[23].X, want) {
		t.Errorf("last x = %v, want %v", pts[23].X, want)
	}
}

func TestPulseAlphaEasesBetweenStates(t *testing.T) {
	for _, c := range []struct{ t, want float64 }{{0, 0.18}, {0.6, 0.34}, {1.2, 0.18}} {
		if got := pulseAlpha(c.t); !near(got, c.want) {
			t.Errorf("pulseAlpha(%v) = %v, want %v", c.t, got, c.want)
		}
	}
}

func TestStageButtonsFlushRightAndHitTest(t *testing.T) {
	z := Frame.Case
	btns := stageButtons(z)
	if last := btns[4]; !near(last.X+last.W, z.X+z.W) {
		t.Fatalf("last button ends at %v, want zone edge %v", last.X+last.W, z.X+z.W)
	}
	for i, b := range btns {
		if !near(b.W, 62) || !near(b.H, 28) {
			t.Fatalf("button %d is %vx%v, want 62x28", i, b.W, b.H)
		}
		if si, ok := stageAt(z, b.X+b.W/2, b.Y+b.H/2); !ok || si != i {
			t.Errorf("centre of button %d hit (%d, %v)", i, si, ok)
		}
	}
	if _, ok := stageAt(z, btns[0].X+btns[0].W+3, btns[0].Y+1); ok {
		t.Error("gap between buttons should not hit")
	}
	if _, ok := stageAt(z, z.X+200, z.Y+10); ok {
		t.Error("case title area should not hit")
	}
}
