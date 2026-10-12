package fx

import (
	"io/fs"
	"testing"
)

// Every embedded source must compile, including ones not yet wired into a pass.
func TestEveryShaderSourceCompiles(t *testing.T) {
	entries, err := fs.ReadDir(sources, "shaders")
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) == 0 {
		t.Fatal("no shader sources embedded")
	}
	for _, e := range entries {
		if _, err := Compile(e.Name()); err != nil {
			t.Errorf("%s: %v", e.Name(), err)
		}
	}
}
