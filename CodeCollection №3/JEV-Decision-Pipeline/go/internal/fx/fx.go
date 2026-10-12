// Package fx holds the Kage post-processing programs. They compile once at init from shaders/, so a broken source panics at start-up; the package test compiles every file first.
package fx

import (
	"embed"
	"fmt"

	"github.com/hajimehoshi/ebiten/v2"
)

//go:embed shaders/*.kage
var sources embed.FS

var (
	Threshold = mustCompile("threshold.kage")
	Blur      = mustCompile("blur.kage")
)

func mustCompile(name string) *ebiten.Shader {
	s, err := Compile(name)
	if err != nil {
		panic(err)
	}
	return s
}

// Compile parses the named file under shaders/ into a shader program.
func Compile(name string) (*ebiten.Shader, error) {
	src, err := sources.ReadFile("shaders/" + name)
	if err != nil {
		return nil, err
	}
	s, err := ebiten.NewShader(src)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", name, err)
	}
	return s, nil
}
