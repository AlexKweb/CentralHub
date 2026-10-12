//go:build !js

package main

import (
	"flag"

	"jev/internal/ui"
)

// platformQuery parses the desktop flags; only flags given on the command line count as set.
func platformQuery() map[string]string {
	flag.String("t", "", "show time in seconds (default 0)")
	flag.String("seed", "", "seed (default 1)")
	flag.Bool("paused", false, "start paused")
	flag.String("case", "", "case number 1..12")
	flag.String("stage", "", "stage name (state, ask, jev, gate, code) or 1..5")
	flag.Bool("fx", true, "post-effects on")
	flag.Parse()
	q := map[string]string{}
	flag.Visit(func(f *flag.Flag) { q[f.Name] = f.Value.String() })
	return q
}

// installHook is a no-op outside the browser.
func installHook(*ui.Game) {}
