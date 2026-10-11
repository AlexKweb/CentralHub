// Package params turns the desktop flags and browser query string into the initial show state.
package params

import (
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"

	"jev/internal/sim"
)

// DefaultSeed is used when no seed is given.
const DefaultSeed uint32 = 1

// State is the show state before the first frame.
type State struct {
	T      float64
	Seed   uint32
	Paused bool
	FX     bool
}

var stageNames = [...]string{"state", "ask", "jev", "gate", "code"}

// stageNudge keeps a stage jump on its own stage: an exact boundary can resolve to the previous stage after float rounding.
const stageNudge = 1e-6

// Parse reads t, seed, paused, case, stage and fx. Empty values count as absent.
// Keys apply in the order t, case, stage: case jumps to the start of that case and
// stage jumps within the resulting case. Invalid values keep their default; the
// returned error joins every problem found.
func Parse(q map[string]string) (State, error) {
	st := State{Seed: DefaultSeed, FX: true}
	var errs []error
	fail := func(key string, err error) { errs = append(errs, fmt.Errorf("%s: %w", key, err)) }

	if v, ok := value(q, "t"); ok {
		t, err := strconv.ParseFloat(v, 64)
		switch {
		case err != nil:
			fail("t", err)
		case math.IsNaN(t) || math.IsInf(t, 0) || t < 0:
			fail("t", errors.New("want a finite time >= 0"))
		default:
			st.T = t
		}
	}
	if v, ok := value(q, "seed"); ok {
		seed, err := strconv.ParseUint(v, 10, 32)
		if err != nil {
			fail("seed", err)
		} else {
			st.Seed = uint32(seed)
		}
	}
	if v, ok := value(q, "paused"); ok {
		paused, err := strconv.ParseBool(v)
		if err != nil {
			fail("paused", err)
		} else {
			st.Paused = paused
		}
	}
	if v, ok := value(q, "fx"); ok {
		fx, err := strconv.ParseBool(v)
		if err != nil {
			fail("fx", err)
		} else {
			st.FX = fx
		}
	}
	if v, ok := value(q, "case"); ok {
		ci, err := caseIndex(v)
		if err != nil {
			fail("case", err)
		} else {
			st.T = sim.JumpToCase(st.T, ci)
		}
	}
	if v, ok := value(q, "stage"); ok {
		si, err := stageIndex(v)
		if err != nil {
			fail("stage", err)
		} else {
			st.T = sim.JumpToStage(st.T, si) + stageNudge
		}
	}
	return st, errors.Join(errs...)
}

func value(q map[string]string, key string) (string, bool) {
	v := strings.TrimSpace(q[key])
	return v, v != ""
}

func caseIndex(v string) (int, error) {
	n, err := strconv.Atoi(v)
	if err != nil || n < 1 || n > sim.NumCases {
		return 0, fmt.Errorf("want 1..%d", sim.NumCases)
	}
	return n - 1, nil
}

func stageIndex(v string) (int, error) {
	for i, name := range stageNames {
		if strings.EqualFold(v, name) {
			return i, nil
		}
	}
	n, err := strconv.Atoi(v)
	if err != nil || n < 1 || n > len(stageNames) {
		return 0, fmt.Errorf("want a stage name or 1..%d", len(stageNames))
	}
	return n - 1, nil
}
