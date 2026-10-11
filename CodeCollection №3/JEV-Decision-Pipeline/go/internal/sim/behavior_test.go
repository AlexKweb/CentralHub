package sim_test

import (
	"math"
	"testing"

	"jev/internal/sim"
)

func TestTimelineBoundaries(t *testing.T) {
	tests := []struct {
		name       string
		t          float64
		cycle      int
		caseNumber int
		stage      string
	}{
		{"start", 0, 0, 1, "state"},
		{"ask starts", 1.2, 0, 1, "ask"},
		{"just before case end", 7.999, 0, 1, "code"},
		{"next case", 8.0, 0, 2, "state"},
		{"last moment of cycle", 95.999, 0, 12, "code"},
		{"cycle wraps", 96, 1, 1, "state"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := sim.Timeline(tc.t)
			if got.Cycle != tc.cycle || got.CaseNumber != tc.caseNumber || got.Stage != tc.stage {
				t.Errorf("Timeline(%v) = cycle %d case %d stage %q; want cycle %d case %d stage %q",
					tc.t, got.Cycle, got.CaseNumber, got.Stage, tc.cycle, tc.caseNumber, tc.stage)
			}
		})
	}
}

func TestKPIsDecisionsAndSpend(t *testing.T) {
	tests := []struct {
		t         float64
		decisions int
		text      string
		spend     string
	}{
		{7.666, 511, "511", "$0.02"},
		{102.841, 6856, "6 856", "$0.29"},
	}
	for _, tc := range tests {
		k := sim.KPIs(tc.t)
		if k.Decisions != tc.decisions || k.DecisionsText != tc.text || k.SpendText != tc.spend {
			t.Errorf("KPIs(%v) = %d %q %q; want %d %q %q",
				tc.t, k.Decisions, k.DecisionsText, k.SpendText, tc.decisions, tc.text, tc.spend)
		}
	}
}

func TestJumpHelpers(t *testing.T) {
	approx := func(a, b float64) bool { return math.Abs(a-b) < 1e-9 }
	if got := sim.JumpToCase(13.68, 4); got != 32 {
		t.Errorf("JumpToCase(13.68, 4) = %v, want 32", got)
	}
	if got := sim.JumpToCase(100, 0); got != 96 {
		t.Errorf("JumpToCase(100, 0) = %v, want 96 (next cycle)", got)
	}
	if got := sim.JumpToStage(13.68, 2); !approx(got, 10.8) {
		t.Errorf("JumpToStage(13.68, 2) = %v, want 10.8", got)
	}
	if got := sim.NextCase(95.5); got != 96 {
		t.Errorf("NextCase(95.5) = %v, want 96", got)
	}
	if got := sim.PrevCase(95.5); got != 80 {
		t.Errorf("PrevCase(95.5) = %v, want 80", got)
	}
	if got := sim.PrevCase(3); got != 0 {
		t.Errorf("PrevCase(3) = %v, want 0 (clamped)", got)
	}
}
