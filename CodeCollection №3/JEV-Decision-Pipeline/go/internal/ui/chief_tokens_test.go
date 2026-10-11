package ui

import (
	"reflect"
	"testing"
)

func TestTokenizeChiefHighlightsSyntax(t *testing.T) {
	cases := []struct {
		name string
		line string
		want []chiefToken
	}{
		{
			name: "import line",
			line: "from typesafe_sdk import Choice, TypeSafeClient",
			want: []chiefToken{
				{tokKeyword, "from"},
				{tokPlain, " typesafe_sdk "},
				{tokKeyword, "import"},
				{tokPlain, " "},
				{tokClass, "Choice"},
				{tokPlain, ", "},
				{tokClass, "TypeSafeClient"},
			},
		},
		{
			name: "string keeps its hash and prefix",
			line: `s = f"a#b"  # note`,
			want: []chiefToken{
				{tokPlain, "s = "},
				{tokString, `f"a#b"`},
				{tokPlain, "  "},
				{tokComment, "# note"},
			},
		},
		{
			name: "keyword inside an identifier is plain",
			line: "importer",
			want: []chiefToken{{tokPlain, "importer"}},
		},
		{
			name: "call with keyword arguments",
			line: `with TypeSafeClient(model="jev") as client:`,
			want: []chiefToken{
				{tokKeyword, "with"},
				{tokPlain, " "},
				{tokClass, "TypeSafeClient"},
				{tokPlain, "(model="},
				{tokString, `"jev"`},
				{tokPlain, ") "},
				{tokKeyword, "as"},
				{tokPlain, " client:"},
			},
		},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := tokenizeChief(c.line); !reflect.DeepEqual(got, c.want) {
				t.Errorf("tokenizeChief(%q)\n got %+v\nwant %+v", c.line, got, c.want)
			}
		})
	}
}

func TestTokenizeChiefKeepsLineText(t *testing.T) {
	line := `    job = folder / f"{uuid4().hex}.json"  # jev decides`
	var joined string
	for _, tok := range tokenizeChief(line) {
		joined += tok.text
	}
	if joined != line {
		t.Errorf("tokens join to %q, want %q", joined, line)
	}
}
