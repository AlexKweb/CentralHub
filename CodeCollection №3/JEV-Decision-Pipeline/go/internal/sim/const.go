// Package sim is the pure simulation contract shared with react/ (see shared/SIM.md). It has no rendering dependencies.
package sim

// Constants from shared/SIM.md; values and names follow shared/tools/simref.py.
const (
	NumCases              = 12
	CaseSeconds           = 8.0
	CycleSeconds          = 96.0
	DecisionsLoopSeconds  = 150.0
	DecisionsPerLoop      = 10000
	DecisionSegments      = 30
	CostPerDecisionMicros = 42 // $0.000042 per decision, in micro-dollars
	GateHundredths        = 85
	ConfCountupSeconds    = 0.3
	BallTravel            = 0.7
	AccentBlendSeconds    = 0.4
	BarGrowSeconds        = 0.6
	BarStaggerSeconds     = 0.06
	LogSlotsPerSecond     = 2
	LogSlotsPerCase       = 16
	LogVisible            = 5
	ChiefCharsPerSecond   = 24
	ChiefVisibleLines     = 11
	ActionsStepSeconds    = 2.0
	ActionsStart          = 5
	ActionsMin            = 3
	ActionsMax            = 8
	SplitStepsPerSecond   = 2
	SplitSegments         = 20
	SparkStepsPerSecond   = 4
	SparkPoints           = 24
	StreamHistorySeconds  = 6.5
	ColumnSpacing         = 3.0
	CardStep              = 1.25
)

// Sub-seed channels for Hash32(seed, channel, ...). Channels 9 and 10 are reserved for rendering and are outside parity.
const (
	ChLinks uint32 = 1 + iota
	ChBars
	ChLog
	ChQueue
	ChActions
	ChSplit
	ChSpark
	ChStream
	ChParticles
	ChDust
)

var (
	stageNames     = [5]string{"state", "ask", "jev", "gate", "code"}
	stageStarts    = [5]float64{0, 1.2, 2.8, 4.4, 6.0}
	stageDurations = [5]float64{1.2, 1.6, 1.6, 1.6, 2.0}
	logCaseSlots   = [4]int{3, 6, 9, 12} // ask, jev, gate, code
	splitBase      = [3]int{4, 18, 15}   // LLM writes, Jev decides, code acts
	columnY        = [5]float64{0, -0.35, 0.2, -0.15, 0.1}
	barRows        = [6]string{"Choice A", "Choice B", "Score A", "Score B", "Noul A", "Noul B"}
	typeNames      = [3]string{"choice", "score", "noul"}
	answerSets     = map[string][]string{
		"choice": {"research", "write", "review", "billing", "phishing", "sponsor"},
		"score":  {"low", "medium", "high", "critical"},
		"noul":   {"yes", "no"},
	}
	linkColors = [5]struct {
		limit float64
		name  string
	}{{0.55, "white"}, {0.70, "pink"}, {0.82, "cyan"}, {0.92, "lime"}, {1.0, "lavender"}}
)
