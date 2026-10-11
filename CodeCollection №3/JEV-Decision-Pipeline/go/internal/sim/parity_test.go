package sim_test

import (
	"encoding/json"
	"fmt"
	"math"
	"os"
	"testing"

	"jev/internal/assets"
	"jev/internal/sim"
)

const vectorsPath = "../../../shared/test-vectors.json"

// sectionCounts pins how many entries each array section holds, so a section that silently shrinks fails.
var sectionCounts = map[string]int{
	"timeline": 28, "kpis": 32, "confidence": 33, "buttons": 5, "subtitle": 30, "accent": 10,
	"active": 30, "cardPosition": 6, "bars": 24, "barGrow": 48, "actions": 34, "log": 32,
	"queued": 48, "chief": 10, "split": 28, "spark": 5, "stream": 36, "jumps": 6,
	"hash32": 8, "mulberry32": 4,
}

// metadataKeys are vector fields that are not checked as sections. links is an object and has its own check.
var metadataKeys = map[string]bool{"version": true, "seed": true, "tolerance": true, "frames": true, "links": true}

type entry = map[string]any

func TestParityWithSharedVectors(t *testing.T) {
	raw, err := os.ReadFile(vectorsPath)
	if err != nil {
		t.Fatal(err)
	}
	var doc map[string]any
	if err := json.Unmarshal(raw, &doc); err != nil {
		t.Fatal(err)
	}
	tol := num(doc["tolerance"])
	seed := uint32(num(doc["seed"]))
	cardsDoc, err := assets.LoadCards()
	if err != nil {
		t.Fatal(err)
	}
	casesDoc, err := assets.LoadCases()
	if err != nil {
		t.Fatal(err)
	}
	cases := casesDoc.Cases
	chief := assets.ChiefText()

	for key := range doc {
		_, counted := sectionCounts[key]
		if !counted && !metadataKeys[key] {
			t.Errorf("vector section %q has no parity check; add it to parity_test.go", key)
		}
	}

	checks := map[string]func(e entry) (got, want any){
		"hash32": func(e entry) (any, any) {
			var in []uint32
			for _, v := range e["in"].([]any) {
				in = append(in, uint32(num(v)))
			}
			return sim.Hash32(in...), e["out"]
		},
		"mulberry32": func(e entry) (any, any) {
			next := sim.Mulberry32(uint32(num(e["seed"])))
			got := make([]any, 5)
			for i := range got {
				got[i] = next()
			}
			return got, e["out"]
		},
		"timeline": func(e entry) (any, any) { return sim.Timeline(num(e["t"])), e["out"] },
		"kpis":     func(e entry) (any, any) { return sim.KPIs(num(e["t"])), e["out"] },
		"confidence": func(e entry) (any, any) {
			return sim.Confidence(num(e["t"]), cases), e["out"]
		},
		"buttons": func(e entry) (any, any) { return sim.Buttons(int(num(e["stage"]))), e["out"] },
		"subtitle": func(e entry) (any, any) {
			return sim.Subtitle(num(e["t"]), cases), e["out"]
		},
		"accent": func(e entry) (any, any) { return sim.Accent(num(e["t"]), cases), e["out"] },
		"active": func(e entry) (any, any) { return sim.Active(num(e["t"]), cases), e["out"] },
		"cardPosition": func(e entry) (any, any) {
			return sim.CardPosition(int(num(e["column"])), int(num(e["row"]))), e["out"]
		},
		"bars": func(e entry) (any, any) {
			return sim.Bars(uint32(num(e["seed"])), int(num(e["case"])), cases), e["out"]
		},
		"barGrow": func(e entry) (any, any) { return sim.BarGrow(num(e["t"]), int(num(e["row"]))), e["out"] },
		"actions": func(e entry) (any, any) { return sim.Actions(num(e["t"]), seed), e["out"] },
		"log": func(e entry) (any, any) {
			return sim.Log(num(e["t"]), seed, cases), e["out"]
		},
		"queued": func(e entry) (any, any) {
			return sim.Queued(num(e["t"]), seed, int(num(e["case"]))), e["out"]
		},
		"chief": func(e entry) (any, any) { return sim.Chief(num(e["t"]), chief), e["out"] },
		"split": func(e entry) (any, any) { return sim.Split(num(e["t"]), seed), e["out"] },
		"spark": func(e entry) (any, any) { return sim.Spark(num(e["t"]), seed), e["out"] },
		"stream": func(e entry) (any, any) {
			return sim.Stream(num(e["t"]), seed, int(num(e["type"])), num(e["x"])), e["out"]
		},
		"jumps": func(e entry) (any, any) {
			tv := num(e["t"])
			got := entry{
				"toCase":  []float64{sim.JumpToCase(tv, 0), sim.JumpToCase(tv, 4), sim.JumpToCase(tv, 11)},
				"toStage": []float64{sim.JumpToStage(tv, 0), sim.JumpToStage(tv, 1), sim.JumpToStage(tv, 2), sim.JumpToStage(tv, 3), sim.JumpToStage(tv, 4)},
				"next":    sim.NextCase(tv),
				"prev":    sim.PrevCase(tv),
			}
			want := entry{"toCase": e["toCase"], "toStage": e["toStage"], "next": e["next"], "prev": e["prev"]}
			return got, want
		},
	}

	for name, count := range sectionCounts {
		t.Run(name, func(t *testing.T) {
			entries, ok := doc[name].([]any)
			if !ok {
				t.Fatalf("vector section %q is missing or not an array", name)
			}
			if len(entries) != count {
				t.Fatalf("section %q has %d entries, parity test expects %d", name, len(entries), count)
			}
			for i, raw := range entries {
				e := raw.(entry)
				got, want := checks[name](e)
				if err := equalsVector(got, want, tol); err != nil {
					t.Errorf("entry %d (t=%v): %v", i, e["t"], err)
				}
			}
		})
	}

	t.Run("links", func(t *testing.T) {
		links := doc["links"].(entry)
		got := sim.Links(uint32(num(links["seed"])), cardsDoc.Columns)
		if err := equalsVector(got, links["out"], tol); err != nil {
			t.Error(err)
		}
		if n := int(num(links["count"])); n != len(got) {
			t.Errorf("vector declares %d links, produced %d", n, len(got))
		}
	})
}

// equalsVector round-trips got through JSON, so it compares what the vector file would contain.
func equalsVector(got, want any, tol float64) error {
	b, err := json.Marshal(got)
	if err != nil {
		return err
	}
	var g any
	if err := json.Unmarshal(b, &g); err != nil {
		return err
	}
	return compareJSON(g, want, tol, "out")
}

// compareJSON treats numbers as equal within tol (absolute for |want| <= 1, relative beyond that).
func compareJSON(got, want any, tol float64, path string) error {
	switch w := want.(type) {
	case nil:
		if got != nil {
			return fmt.Errorf("%s: got %v, want null", path, got)
		}
	case float64:
		g, ok := got.(float64)
		if !ok {
			return fmt.Errorf("%s: got %v (%T), want number %v", path, got, got, w)
		}
		if math.Abs(g-w) > tol*math.Max(1, math.Abs(w)) {
			return fmt.Errorf("%s: got %v, want %v", path, g, w)
		}
	case string:
		if g, ok := got.(string); !ok || g != w {
			return fmt.Errorf("%s: got %v, want %q", path, got, w)
		}
	case bool:
		if g, ok := got.(bool); !ok || g != w {
			return fmt.Errorf("%s: got %v, want %v", path, got, w)
		}
	case []any:
		g, ok := got.([]any)
		if !ok || len(g) != len(w) {
			return fmt.Errorf("%s: got %v, want array of %d", path, got, len(w))
		}
		for i := range w {
			if err := compareJSON(g[i], w[i], tol, fmt.Sprintf("%s[%d]", path, i)); err != nil {
				return err
			}
		}
	case map[string]any:
		g, ok := got.(map[string]any)
		if !ok || len(g) != len(w) {
			return fmt.Errorf("%s: got %v, want object with %d keys", path, got, len(w))
		}
		for k, wv := range w {
			gv, present := g[k]
			if !present {
				return fmt.Errorf("%s: missing key %q", path, k)
			}
			if err := compareJSON(gv, wv, tol, path+"."+k); err != nil {
				return err
			}
		}
	default:
		return fmt.Errorf("%s: unsupported vector type %T", path, want)
	}
	return nil
}

func num(v any) float64 {
	f, ok := v.(float64)
	if !ok {
		panic(fmt.Sprintf("vector value %v (%T) is not a number", v, v))
	}
	return f
}
