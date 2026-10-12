package ui

import "testing"

func TestOutOfFocusBlursOnlyCardsPastTheBand(t *testing.T) {
	const focus = 20.0
	cases := []struct {
		name   string
		depth  float64
		active bool
		want   bool
	}{
		{"at focus", 20, false, false},
		{"on the band edge stays sharp", 23, false, false},
		{"behind the band", 23.1, false, true},
		{"in front of the band", 16.9, false, true},
		{"active card behind the band stays sharp", 30, true, false},
		{"active card in front of the band stays sharp", 10, true, false},
	}
	for _, c := range cases {
		if got := outOfFocus(c.depth, focus, c.active); got != c.want {
			t.Errorf("%s: outOfFocus(%v, %v, %v) = %v, want %v", c.name, c.depth, focus, c.active, got, c.want)
		}
	}
}
