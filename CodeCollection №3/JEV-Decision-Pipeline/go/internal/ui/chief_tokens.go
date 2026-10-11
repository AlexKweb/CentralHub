package ui

import (
	"regexp"
	"strings"
)

// chiefKind classifies a run of chief.py text for syntax colouring.
type chiefKind uint8

const (
	tokPlain chiefKind = iota
	tokKeyword
	tokClass
	tokString
	tokComment
)

type chiefToken struct {
	kind chiefKind
	text string
}

var (
	chiefKeywords = map[string]bool{"import": true, "from": true, "with": true, "as": true, "if": true}
	// Comments and strings come before identifiers so a '#' or a quote inside them is never split out.
	chiefTokenRE  = regexp.MustCompile(`#.*|[fFrRbB]?"(?:[^"\\]|\\.)*"?|[fFrRbB]?'(?:[^'\\]|\\.)*'?|[A-Za-z_]\w*|\s+|[\s\S]`)
	chiefStringRE = regexp.MustCompile(`^[fFrRbB]?["']`)
	chiefClassRE  = regexp.MustCompile(`^[A-Z]`)
)

// tokenizeChief splits one line of chief.py into highlighted runs; neighbours of the same kind are merged.
func tokenizeChief(line string) []chiefToken {
	var out []chiefToken
	for _, s := range chiefTokenRE.FindAllString(line, -1) {
		k := classifyChief(s)
		if n := len(out); n > 0 && out[n-1].kind == k {
			out[n-1].text += s
			continue
		}
		out = append(out, chiefToken{kind: k, text: s})
	}
	return out
}

func classifyChief(s string) chiefKind {
	switch {
	case strings.HasPrefix(s, "#"):
		return tokComment
	case chiefStringRE.MatchString(s):
		return tokString
	case chiefKeywords[s]:
		return tokKeyword
	case chiefClassRE.MatchString(s):
		return tokClass
	}
	return tokPlain
}
