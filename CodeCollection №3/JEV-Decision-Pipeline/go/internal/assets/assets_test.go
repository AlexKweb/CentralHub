package assets

import (
	"crypto/sha256"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

const sharedDir = "../../../shared"

// copyPatterns must stay in sync with gen/main.go. A file added to shared/ but not copied fails below.
var copyPatterns = []string{"cases.json", "cards.json", "chief.py", "schema/*.json", "fonts/*.ttf", "fonts/OFL.txt"}

func TestEmbeddedCopiesMatchSharedOriginals(t *testing.T) {
	want := map[string]bool{}
	for _, pat := range copyPatterns {
		matches, err := filepath.Glob(filepath.Join(sharedDir, filepath.FromSlash(pat)))
		if err != nil {
			t.Fatal(err)
		}
		if len(matches) == 0 {
			t.Fatalf("no originals match %q in %s", pat, sharedDir)
		}
		for _, m := range matches {
			rel, err := filepath.Rel(sharedDir, m)
			if err != nil {
				t.Fatal(err)
			}
			want[filepath.ToSlash(rel)] = true
		}
	}

	have := map[string]bool{}
	err := fs.WalkDir(files, "shared", func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if !d.IsDir() {
			have[strings.TrimPrefix(p, "shared/")] = true
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}

	for rel := range want {
		if !have[rel] {
			t.Errorf("embedded copy of %s is missing; run make generate", rel)
			continue
		}
		original, err := os.ReadFile(filepath.Join(sharedDir, filepath.FromSlash(rel)))
		if err != nil {
			t.Fatal(err)
		}
		copied, err := read(rel)
		if err != nil {
			t.Fatal(err)
		}
		if got, orig := sha256Hex(copied), sha256Hex(original); got != orig {
			t.Errorf("%s: copy sha256 %s differs from shared/%s sha256 %s; run make generate", rel, got, rel, orig)
		}
	}
	for rel := range have {
		if !want[rel] {
			t.Errorf("embedded copy %s has no original in shared/; run make generate", rel)
		}
	}
}

func TestFontsAreEmbedded(t *testing.T) {
	for name, data := range map[string][]byte{
		"regular":    FontRegular(),
		"bold":       FontBold(),
		"extra-bold": FontExtraBold(),
	} {
		if len(data) == 0 {
			t.Errorf("font %s is empty", name)
		}
	}
}

func sha256Hex(b []byte) string {
	sum := sha256.Sum256(b)
	return fmt.Sprintf("%x", sum)
}
