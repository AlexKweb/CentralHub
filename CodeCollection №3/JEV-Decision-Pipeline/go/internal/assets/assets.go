// Package assets embeds the copies of the shared/ contract that go generate makes.
package assets

import "embed"

//go:generate go run ./gen

// files holds the copies of ../../../shared (see gen/main.go). assets_test.go checks them against the originals.
//
//go:embed shared/cases.json shared/cards.json shared/chief.py shared/schema/*.json shared/fonts/*.ttf shared/fonts/OFL.txt
var files embed.FS
