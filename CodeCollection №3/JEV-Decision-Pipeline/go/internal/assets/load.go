package assets

import (
	"encoding/json"
	"fmt"

	"jev/internal/sim"
)

// LoadCases decodes the embedded cases.json.
func LoadCases() (sim.CasesDoc, error) {
	var doc sim.CasesDoc
	err := readJSON("cases.json", &doc)
	return doc, err
}

// LoadCards decodes the embedded cards.json.
func LoadCards() (sim.CardsDoc, error) {
	var doc sim.CardsDoc
	err := readJSON("cards.json", &doc)
	return doc, err
}

// ChiefText returns the chief.py panel text (ASCII, ends with a newline).
func ChiefText() string { return string(mustRead("chief.py")) }

func FontRegular() []byte   { return mustRead("fonts/JetBrainsMono-Regular.ttf") }
func FontBold() []byte      { return mustRead("fonts/JetBrainsMono-Bold.ttf") }
func FontExtraBold() []byte { return mustRead("fonts/JetBrainsMono-ExtraBold.ttf") }

func read(name string) ([]byte, error) {
	return files.ReadFile("shared/" + name)
}

func readJSON(name string, v any) error {
	data, err := read(name)
	if err != nil {
		return err
	}
	if err := json.Unmarshal(data, v); err != nil {
		return fmt.Errorf("decode %s: %w", name, err)
	}
	return nil
}

func mustRead(name string) []byte {
	data, err := read(name)
	if err != nil {
		// The go:embed list fixes these files at build time, so a miss is a build defect.
		panic(err)
	}
	return data
}
