package sim

// Data model, decoded from shared/cases.json and shared/cards.json (JSON keys match the files).

type CasesDoc struct {
	Version int     `json:"version"`
	Gate    float64 `json:"gate"`
	Cases   []Case  `json:"cases"`
}

type Case struct {
	ID         string   `json:"id"`
	Title      string   `json:"title"`
	Tile       string   `json:"tile"`
	Accent     string   `json:"accent"`
	Type       string   `json:"type"`
	Question   string   `json:"question"`
	Answer     string   `json:"answer"`
	Confidence float64  `json:"confidence"`
	GateLabel  string   `json:"gateLabel"`
	JevMs      int      `json:"jevMs"`
	LogCode    string   `json:"logCode"`
	Path       []string `json:"path"`
}

type CardsDoc struct {
	Version int      `json:"version"`
	Columns []Column `json:"columns"`
}

type Column struct {
	ID    string `json:"id"`
	Num   string `json:"num"`
	Title string `json:"title"`
	Color string `json:"color"`
	Cards []Card `json:"cards"`
}

type Card struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Rows  []Row  `json:"rows"`
}

type Row struct {
	K  string `json:"k"`
	V  string `json:"v"`
	Hl bool   `json:"hl,omitempty"`
}

// Result types. Tags are the keys of shared/test-vectors.json; nil pointers marshal to null.

type TimelineResult struct {
	Cycle         int     `json:"cycle"`
	CaseIndex     int     `json:"caseIndex"`
	CaseNumber    int     `json:"caseNumber"`
	StageIndex    int     `json:"stageIndex"`
	Stage         string  `json:"stage"`
	Local         float64 `json:"local"`
	StageElapsed  float64 `json:"stageElapsed"`
	StageProgress float64 `json:"stageProgress"`
	CaseProgress  float64 `json:"caseProgress"`
}

type KPIsResult struct {
	Decisions     int     `json:"decisions"`
	DecisionsText string  `json:"decisionsText"`
	Segments      int     `json:"segments"`
	SpendCents    int     `json:"spendCents"`
	SpendText     string  `json:"spendText"`
	Marker        float64 `json:"marker"`
}

type ConfidenceResult struct {
	Text       string  `json:"text"`
	Hundredths *int    `json:"hundredths"`
	Badge      *string `json:"badge"`
	Fill       float64 `json:"fill"`
}

type ActiveResult struct {
	Lit    []string   `json:"lit"`
	Ball   ActiveBall `json:"ball"`
	Plates []Plate    `json:"plates"`
}

type ActiveBall struct {
	From     *string `json:"from"`
	To       string  `json:"to"`
	Progress float64 `json:"progress"`
	Arrived  bool    `json:"arrived"`
}

type Plate struct {
	Card string `json:"card"`
	Text string `json:"text"`
}

type Link struct {
	From  string `json:"from"`
	To    string `json:"to"`
	Color string `json:"color"`
}

type Bar struct {
	Label  string  `json:"label"`
	Type   string  `json:"type"`
	Value  float64 `json:"value"`
	Answer string  `json:"answer"`
	Bright bool    `json:"bright"`
}

type LogResult struct {
	Lines  []LogLine `json:"lines"`
	Scroll float64   `json:"scroll"`
}

type LogLine struct {
	Tag  string `json:"tag"`
	Text string `json:"text"`
}

type ChiefResult struct {
	Pos     int      `json:"pos"`
	Line    int      `json:"line"`
	Col     int      `json:"col"`
	Visible []string `json:"visible"`
}

type SparkResult struct {
	Values []float64 `json:"values"`
	Offset float64   `json:"offset"`
}
