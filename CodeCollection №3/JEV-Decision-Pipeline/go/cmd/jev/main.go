// Command jev runs the JEV decision pipeline on the desktop, or in the browser when built for js/wasm.
package main

import (
	"log"

	"github.com/hajimehoshi/ebiten/v2"

	"jev/internal/assets"
	"jev/internal/params"
	"jev/internal/ui"
)

func main() {
	st, err := params.Parse(platformQuery())
	if err != nil {
		log.Printf("ignoring invalid parameters: %v", err)
	}
	doc, err := assets.LoadCases()
	if err != nil {
		log.Fatal(err)
	}
	game, err := ui.New(st, doc.Cases)
	if err != nil {
		log.Fatal(err)
	}
	installHook(game)
	ebiten.SetWindowTitle("JEV / Decision Pipeline")
	ebiten.SetWindowResizingMode(ebiten.WindowResizingModeEnabled)
	if err := ebiten.RunGame(game); err != nil {
		log.Fatal(err)
	}
}
