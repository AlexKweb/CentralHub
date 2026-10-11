package ui

import "testing"

func TestFrameMatchesSpec(t *testing.T) {
	f := Frame
	rows := []struct {
		name string
		r    Rect
		x, w float64
		y, h float64
	}{
		{"header", f.Header, 14, 1214, 16, 32},
		{"case", f.Case, 14, 1214, 196, 66},
		{"scene", f.Scene, 0, 1240, 262, 918},
		{"parallel", f.Parallel, 14, 298, 1186, 210},
		{"confidence", f.Confidence, 322, 290, 1186, 210},
		{"usecases", f.UseCases, 626, 294, 1186, 210},
		{"chief", f.Chief, 932, 296, 1186, 210},
		{"runlog", f.RunLog, 14, 484, 1404, 120},
		{"split", f.Split, 506, 364, 1404, 120},
		{"guardrails", f.Guardrails, 878, 350, 1404, 120},
		{"footer", f.Footer, 14, 1214, 1532, 36},
	}
	for _, row := range rows {
		r := row.r
		if r.X != row.x || r.W != row.w || r.Y != row.y || r.H != row.h {
			t.Errorf("%s = %+v, want x=%v w=%v y=%v h=%v", row.name, r, row.x, row.w, row.y, row.h)
		}
	}
	for i, k := range f.KPIs {
		if k.Y != 58 || k.H != 130 || k.W != 296 || k.X != 14+float64(i)*306 {
			t.Errorf("kpi %d = %+v, want 296×130 at y=58 with 10 px gaps", i, k)
		}
	}
}

func TestZonesStayInsideFrame(t *testing.T) {
	f := Frame
	all := []Rect{f.Header, f.Case, f.Scene, f.Parallel, f.Confidence, f.UseCases, f.Chief, f.RunLog, f.Split, f.Guardrails, f.Footer}
	all = append(all, f.KPIs[:]...)
	for _, r := range all {
		if r.X < 0 || r.Y < 0 || r.X+r.W > FrameWidth || r.Y+r.H > FrameHeight {
			t.Errorf("zone %+v leaves the %dx%d frame", r, FrameWidth, FrameHeight)
		}
	}
}
