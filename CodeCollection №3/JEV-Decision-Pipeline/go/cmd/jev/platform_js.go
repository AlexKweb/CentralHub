//go:build js

package main

import (
	"fmt"
	"net/url"
	"strings"
	"syscall/js"

	"jev/internal/ui"
)

// platformQuery reads the page query string, keeping the first value of each key.
func platformQuery() map[string]string {
	search := js.Global().Get("location").Get("search").String()
	values, _ := url.ParseQuery(strings.TrimPrefix(search, "?")) // malformed pairs are skipped, the rest still parse
	q := make(map[string]string, len(values))
	for k, v := range values {
		if len(v) > 0 {
			q[k] = v[0]
		}
	}
	return q
}

// installHook exposes window.__jev for the Playwright suite; ready turns true after the first Draw.
func installHook(g *ui.Game) {
	object := js.Global().Get("Object")
	hook := object.New()
	ready := js.FuncOf(func(js.Value, []js.Value) any { return g.Ready() })
	object.Call("defineProperty", hook, "ready", map[string]any{"get": ready.Value})
	hook.Set("state", js.FuncOf(func(js.Value, []js.Value) any { return stateObject(g.Snapshot()) }).Value)
	hook.Set("layout", js.FuncOf(func(js.Value, []js.Value) any { return layoutObject(g) }).Value)
	js.Global().Set("__jev", hook)
}

func stateObject(s ui.Snapshot) map[string]any {
	return map[string]any{"case": s.Case, "stage": s.Stage, "t": s.T, "paused": s.Paused, "fx": s.FX}
}

func layoutObject(g *ui.Game) map[string]any {
	z := ui.Frame
	out := map[string]any{
		"header":     rectObject(z.Header),
		"case":       rectObject(z.Case),
		"scene":      rectObject(z.Scene),
		"parallel":   rectObject(z.Parallel),
		"confidence": rectObject(z.Confidence),
		"useCases":   rectObject(z.UseCases),
		"chief":      rectObject(z.Chief),
		"runLog":     rectObject(z.RunLog),
		"split":      rectObject(z.Split),
		"guardrails": rectObject(z.Guardrails),
		"footer":     rectObject(z.Footer),
	}
	for i, k := range z.KPIs {
		out[fmt.Sprintf("kpi%d", i)] = rectObject(k)
	}
	tiles, stages := g.Targets()
	for i, r := range tiles {
		out[fmt.Sprintf("tile%d", i)] = rectObject(r)
	}
	for i, r := range stages {
		out[fmt.Sprintf("stage%d", i)] = rectObject(r)
	}
	return out
}

func rectObject(r ui.Rect) map[string]any {
	return map[string]any{"x": r.X, "y": r.Y, "w": r.W, "h": r.H}
}
