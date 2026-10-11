// Command gen copies the shared JEV contract into internal/assets/shared so that go:embed can read it.
//
// go generate runs it from internal/assets. With -check it only verifies the existing copy (make check-assets).
package main

import (
	"bytes"
	"flag"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// patterns select the files to copy, relative to shared/. Keep in sync with the go:embed list in assets.go.
var patterns = []string{"cases.json", "cards.json", "chief.py", "schema/*.json", "fonts/*.ttf", "fonts/OFL.txt"}

func main() {
	src := flag.String("src", "../../../shared", "path to the project's shared/ directory")
	dst := flag.String("dst", "shared", "destination copy directory")
	check := flag.Bool("check", false, "verify the existing copy instead of writing it")
	flag.Parse()
	if err := run(*src, *dst, *check); err != nil {
		fmt.Fprintln(os.Stderr, "gen:", err)
		os.Exit(1)
	}
}

func run(src, dst string, check bool) error {
	want, err := collect(src)
	if err != nil {
		return err
	}
	if check {
		return verify(want, dst)
	}
	if err := os.RemoveAll(dst); err != nil {
		return err
	}
	for rel, data := range want {
		p := filepath.Join(dst, filepath.FromSlash(rel))
		if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
			return err
		}
		if err := os.WriteFile(p, data, 0o644); err != nil {
			return err
		}
	}
	fmt.Printf("gen: copied %d files from %s to %s\n", len(want), src, dst)
	return nil
}

// collect reads every pattern under src. A pattern without matches is an error, so a missing font or schema fails loudly.
func collect(src string) (map[string][]byte, error) {
	files := make(map[string][]byte)
	for _, pat := range patterns {
		matches, err := filepath.Glob(filepath.Join(src, filepath.FromSlash(pat)))
		if err != nil {
			return nil, err
		}
		if len(matches) == 0 {
			return nil, fmt.Errorf("no files match %q under %s", pat, src)
		}
		for _, m := range matches {
			data, err := os.ReadFile(m)
			if err != nil {
				return nil, err
			}
			rel, err := filepath.Rel(src, m)
			if err != nil {
				return nil, err
			}
			files[filepath.ToSlash(rel)] = data
		}
	}
	return files, nil
}

func verify(want map[string][]byte, dst string) error {
	have := make(map[string][]byte)
	err := filepath.WalkDir(dst, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		rel, err := filepath.Rel(dst, p)
		if err != nil {
			return err
		}
		data, err := os.ReadFile(p)
		if err != nil {
			return err
		}
		have[filepath.ToSlash(rel)] = data
		return nil
	})
	if err != nil {
		return fmt.Errorf("copy %s is not readable (run make generate): %w", dst, err)
	}
	var diffs []string
	for rel, data := range want {
		got, ok := have[rel]
		switch {
		case !ok:
			diffs = append(diffs, "missing "+rel)
		case !bytes.Equal(got, data):
			diffs = append(diffs, "stale "+rel)
		}
	}
	for rel := range have {
		if _, ok := want[rel]; !ok {
			diffs = append(diffs, "extra "+rel)
		}
	}
	if len(diffs) > 0 {
		sort.Strings(diffs)
		return fmt.Errorf("copy %s is out of date (run make generate):\n  %s", dst, strings.Join(diffs, "\n  "))
	}
	fmt.Printf("gen: %d files in %s match the shared/ originals\n", len(want), dst)
	return nil
}
