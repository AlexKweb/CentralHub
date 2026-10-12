package params

import (
	"strconv"
	"testing"

	"jev/internal/sim"
)

func TestParseDefaults(t *testing.T) {
	st, err := Parse(map[string]string{"t": "", "case": " "})
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}
	if want := (State{Seed: DefaultSeed, FX: true}); st != want {
		t.Fatalf("got %+v, want %+v", st, want)
	}
}

func TestParseValues(t *testing.T) {
	st, err := Parse(map[string]string{"t": "7.6", "seed": "42", "paused": "1", "fx": "0"})
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}
	if want := (State{T: 7.6, Seed: 42, Paused: true, FX: false}); st != want {
		t.Fatalf("got %+v, want %+v", st, want)
	}
}

func TestParseJumps(t *testing.T) {
	cases := []struct {
		name      string
		q         map[string]string
		wantCase  int
		wantStage string
	}{
		{"t 7.6 is case 1 code", map[string]string{"t": "7.6"}, 1, "code"},
		{"t 13.68 is case 2 gate", map[string]string{"t": "13.68"}, 2, "gate"},
		{"t 58.48 is case 8 ask", map[string]string{"t": "58.48"}, 8, "ask"},
		{"t 28.08 is case 4 jev", map[string]string{"t": "28.08"}, 4, "jev"},
		{"case keeps stage zero", map[string]string{"t": "7.6", "case": "2"}, 2, "state"},
		{"case then stage name", map[string]string{"t": "7.6", "case": "2", "stage": "GATE"}, 2, "gate"},
		{"stage number in current case", map[string]string{"t": "28.08", "stage": "2"}, 4, "ask"},
		{"stage 5 is code", map[string]string{"t": "7.6", "stage": "5"}, 1, "code"},
		{"case applies after t", map[string]string{"t": "58.48", "case": "1"}, 1, "state"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			st, err := Parse(tc.q)
			if err != nil {
				t.Fatalf("Parse: %v", err)
			}
			tl := sim.Timeline(st.T)
			if tl.CaseNumber != tc.wantCase || tl.Stage != tc.wantStage {
				t.Fatalf("got case %d stage %s (t=%v), want case %d stage %s",
					tl.CaseNumber, tl.Stage, st.T, tc.wantCase, tc.wantStage)
			}
		})
	}
}

func TestParseEveryCaseAndStageLands(t *testing.T) {
	names := []string{"state", "ask", "jev", "gate", "code"}
	for c := 1; c <= sim.NumCases; c++ {
		for s, name := range names {
			st, err := Parse(map[string]string{"case": strconv.Itoa(c), "stage": name})
			if err != nil {
				t.Fatalf("case %d stage %s: %v", c, name, err)
			}
			if tl := sim.Timeline(st.T); tl.CaseNumber != c || tl.StageIndex != s {
				t.Errorf("case %d stage %s: got case %d stage %s", c, name, tl.CaseNumber, tl.Stage)
			}
		}
	}
}

func TestParseRejectsInvalid(t *testing.T) {
	bad := []map[string]string{
		{"t": "-1"}, {"t": "NaN"}, {"t": "Inf"}, {"t": "soon"},
		{"seed": "-1"}, {"seed": "4294967296"},
		{"paused": "maybe"}, {"fx": "x"},
		{"case": "0"}, {"case": "13"}, {"case": "two"},
		{"stage": "6"}, {"stage": "done"},
	}
	for _, q := range bad {
		st, err := Parse(q)
		if err == nil {
			t.Errorf("Parse(%v): want error, got %+v", q, st)
		}
	}
}

func TestParseKeepsValidKeysOnError(t *testing.T) {
	st, err := Parse(map[string]string{"t": "7.6", "case": "99", "seed": "5"})
	if err == nil {
		t.Fatal("want error for case 99")
	}
	if st.T != 7.6 || st.Seed != 5 {
		t.Fatalf("got %+v, want T=7.6 Seed=5", st)
	}
}
