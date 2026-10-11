package assets

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/santhosh-tekuri/jsonschema/v6"

	"jev/internal/sim"
)

func TestDataMatchesJSONSchemas(t *testing.T) {
	c := jsonschema.NewCompiler()
	pairs := []struct{ data, schema string }{
		{"cases.json", "schema/cases.schema.json"},
		{"cards.json", "schema/cards.schema.json"},
	}
	for _, p := range pairs {
		schemaDoc := decodeEmbedded(t, p.schema)
		id := schemaDoc.(map[string]any)["$id"].(string)
		if err := c.AddResource(id, schemaDoc); err != nil {
			t.Fatal(err)
		}
		sch, err := c.Compile(id)
		if err != nil {
			t.Fatal(err)
		}
		if err := sch.Validate(decodeEmbedded(t, p.data)); err != nil {
			t.Errorf("%s does not match %s: %v", p.data, p.schema, err)
		}
	}
}

func TestCrossFileInvariants(t *testing.T) {
	cases, cards := loadCasesAndCards(t)
	if errs := sim.Validate(cases, cards); len(errs) > 0 {
		t.Errorf("data invariants failed:\n  %s", strings.Join(errs, "\n  "))
	}
	if n := len(cases.Cases); n != sim.NumCases {
		t.Errorf("got %d cases, want %d", n, sim.NumCases)
	}
}

// TestValidateRejectsCardInWrongColumn guards against Validate passing vacuously.
func TestValidateRejectsCardInWrongColumn(t *testing.T) {
	cases, cards := loadCasesAndCards(t)
	cases.Cases[0].Path[1] = cases.Cases[0].Path[0]
	if len(sim.Validate(cases, cards)) == 0 {
		t.Error("Validate accepted a state card in the questions slot")
	}
}

func TestChiefTextIsASCIIAndEndsWithNewline(t *testing.T) {
	text := ChiefText()
	for i, r := range text {
		if r > 0x7f {
			t.Errorf("chief.py has non-ASCII %q at byte %d", r, i)
		}
	}
	if !strings.HasSuffix(text, "\n") {
		t.Error("chief.py must end with a newline")
	}
}

func decodeEmbedded(t *testing.T, name string) any {
	t.Helper()
	data, err := read(name)
	if err != nil {
		t.Fatal(err)
	}
	var v any
	if err := json.Unmarshal(data, &v); err != nil {
		t.Fatalf("%s: %v", name, err)
	}
	return v
}

func loadCasesAndCards(t *testing.T) (sim.CasesDoc, sim.CardsDoc) {
	t.Helper()
	cases, err := LoadCases()
	if err != nil {
		t.Fatal(err)
	}
	cards, err := LoadCards()
	if err != nil {
		t.Fatal(err)
	}
	return cases, cards
}
