package sim

import (
	"fmt"
	"math"
	"strings"
)

var columnIDs = [5]string{"state", "questions", "jev", "gate", "code"}

// Validate checks the cross-file invariants that JSON Schema cannot express (port of simref.validate).
// An empty result means the data is consistent.
func Validate(cases CasesDoc, cards CardsDoc) []string {
	var errs []string
	ids := map[string]int{}
	titles := map[string]string{}
	for ci, col := range cards.Columns {
		if ci >= len(columnIDs) || col.ID != columnIDs[ci] {
			errs = append(errs, fmt.Sprintf("column %d has id %s", ci, col.ID))
		}
		for _, card := range col.Cards {
			if _, dup := ids[card.ID]; dup {
				errs = append(errs, "duplicate card id "+card.ID)
			}
			ids[card.ID] = ci
			titles[card.ID] = card.Title
		}
	}
	if len(cases.Cases) != NumCases {
		errs = append(errs, fmt.Sprintf("expected %d cases, got %d", NumCases, len(cases.Cases)))
	}
	seen := map[string]bool{}
	for _, c := range cases.Cases {
		if seen[c.ID] {
			errs = append(errs, "duplicate case id "+c.ID)
		}
		seen[c.ID] = true
		if len(c.Path) != len(columnIDs) {
			errs = append(errs, fmt.Sprintf("case %s: path must have %d cards", c.ID, len(columnIDs)))
			continue
		}
		for stage, cid := range c.Path {
			col, ok := ids[cid]
			switch {
			case !ok:
				errs = append(errs, fmt.Sprintf("case %s: unknown card %s", c.ID, cid))
			case col != stage:
				errs = append(errs, fmt.Sprintf("case %s: card %s is not in column %d", c.ID, cid, stage))
			}
		}
		if title, ok := titles[c.Path[1]]; !ok || title != c.Question {
			errs = append(errs, fmt.Sprintf("case %s: question does not match card %s", c.ID, c.Path[1]))
		}
		if strings.ToLower(strings.Split(c.Question, " · ")[0]) != c.Type {
			errs = append(errs, fmt.Sprintf("case %s: type does not match question", c.ID))
		}
		if c.Path[2] != "j."+c.Type+"_head" {
			errs = append(errs, fmt.Sprintf("case %s: jev card must be j.%s_head", c.ID, c.Type))
		}
		if math.Abs(float64(Hundredths(c.Confidence))/100-c.Confidence) > 1e-9 {
			errs = append(errs, fmt.Sprintf("case %s: confidence must have 2 decimals", c.ID))
		}
	}
	return errs
}
