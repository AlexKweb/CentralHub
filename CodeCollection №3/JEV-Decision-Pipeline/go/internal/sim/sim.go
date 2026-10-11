package sim

import (
	"fmt"
	"math"
	"slices"
	"strconv"
	"strings"
)

// Hash32 is FNV-1a over the 4 little-endian bytes of each value, followed by murmur3's fmix32.
func Hash32(values ...uint32) uint32 {
	h := uint32(0x811C9DC5)
	for _, v := range values {
		for shift := 0; shift < 32; shift += 8 {
			h ^= (v >> shift) & 0xFF
			h *= 0x01000193
		}
	}
	h ^= h >> 16
	h *= 0x85EBCA6B
	h ^= h >> 13
	h *= 0xC2B2AE35
	h ^= h >> 16
	return h
}

// Mulberry32 returns a generator whose calls yield floats in [0, 1).
func Mulberry32(seed uint32) func() float64 {
	a := seed
	return func() float64 {
		a += 0x6D2B79F5
		t := (a ^ (a >> 15)) * (1 | a)
		t = (t + (t^(t>>7))*(61|t)) ^ t
		return float64(t^(t>>14)) / 4294967296
	}
}

// norm maps NaN and negative times to 0.
func norm(t float64) float64 {
	if math.IsNaN(t) || t <= 0 {
		return 0
	}
	return t
}

func clamp[T int | float64](x, lo, hi T) T {
	if x < lo {
		return lo
	}
	if x > hi {
		return hi
	}
	return x
}

func mod(a, n int) int { return ((a % n) + n) % n }

// Hundredths rounds a confidence to whole hundredths, half up.
func Hundredths(conf float64) int { return int(math.Floor(conf*100 + 0.5)) }

func fmtHundredths(h int) string { return fmt.Sprintf("%d.%02d", h/100, h%100) }

func fmtThousands(n int) string {
	s := strconv.Itoa(n)
	var b strings.Builder
	for i, r := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			b.WriteByte(' ')
		}
		b.WriteRune(r)
	}
	return b.String()
}

func fmtMoney(cents int) string { return fmt.Sprintf("$%d.%02d", cents/100, cents%100) }

func hexRGB(h string) [3]int {
	var rgb [3]int
	for i := range rgb {
		v, err := strconv.ParseUint(h[1+2*i:3+2*i], 16, 8)
		if err != nil {
			panic(fmt.Sprintf("sim: bad color %q", h))
		}
		rgb[i] = int(v)
	}
	return rgb
}

// Timeline maps a show time to its cycle, case and stage. Times wrap every 96 s.
func Timeline(t float64) TimelineResult {
	t = norm(t)
	cycle := math.Floor(t / CycleSeconds)
	tt := t - cycle*CycleSeconds
	ci := int(clamp(math.Floor(tt/CaseSeconds), 0, NumCases-1))
	local := math.Max(0, tt-float64(ci)*CaseSeconds)
	si := 0
	for i, start := range stageStarts {
		if start <= local {
			si = i
		}
	}
	elapsed := local - stageStarts[si]
	return TimelineResult{
		Cycle:         int(cycle),
		CaseIndex:     ci,
		CaseNumber:    ci + 1,
		StageIndex:    si,
		Stage:         stageNames[si],
		Local:         local,
		StageElapsed:  elapsed,
		StageProgress: math.Min(1, elapsed/stageDurations[si]),
		CaseProgress:  local / CaseSeconds,
	}
}

func JumpToCase(t float64, ci int) float64 {
	return math.Floor(norm(t)/CycleSeconds)*CycleSeconds + float64(ci)*CaseSeconds
}

func JumpToStage(t float64, si int) float64 {
	return math.Floor(norm(t)/CaseSeconds)*CaseSeconds + stageStarts[si]
}

func NextCase(t float64) float64 {
	return (math.Floor(norm(t)/CaseSeconds) + 1) * CaseSeconds
}

func PrevCase(t float64) float64 {
	return math.Max(0, (math.Floor(norm(t)/CaseSeconds)-1)*CaseSeconds)
}

func decisions(t float64) int {
	x := norm(t) / DecisionsLoopSeconds
	f := x - math.Floor(x)
	return min(DecisionsPerLoop-1, int(math.Floor(f*DecisionsPerLoop)))
}

// KPIs returns the header counters. Spend is rounded half up to whole cents.
func KPIs(t float64) KPIsResult {
	d := decisions(t)
	cents := (d*CostPerDecisionMicros + 5000) / 10000
	return KPIsResult{
		Decisions:     d,
		DecisionsText: fmtThousands(d),
		Segments:      d * DecisionSegments / DecisionsPerLoop,
		SpendCents:    cents,
		SpendText:     fmtMoney(cents),
		Marker:        float64(d) / DecisionsPerLoop,
	}
}

// Confidence is hidden before the GATE stage and counts up during it.
func Confidence(t float64, cases []Case) ConfidenceResult {
	tl := Timeline(t)
	h := Hundredths(cases[tl.CaseIndex].Confidence)
	if tl.StageIndex < 3 {
		return ConfidenceResult{Text: "-.--", Fill: 0}
	}
	shown := h
	if tl.StageIndex == 3 {
		shown = int(math.Floor(float64(h) * math.Min(1, tl.StageElapsed/ConfCountupSeconds)))
	}
	badge := "REVIEW"
	if h >= GateHundredths {
		badge = "PASS"
	}
	return ConfidenceResult{
		Text:       fmtHundredths(shown),
		Hundredths: &shown,
		Badge:      &badge,
		Fill:       float64(shown) / 100,
	}
}

func Buttons(si int) [5]string {
	var out [5]string
	for i := range out {
		switch {
		case i < si:
			out[i] = "done"
		case i == si:
			out[i] = "current"
		case i == si+1:
			out[i] = "next"
		default:
			out[i] = "future"
		}
	}
	return out
}

func Subtitle(t float64, cases []Case) string {
	tl := Timeline(t)
	c := cases[tl.CaseIndex]
	switch {
	case tl.StageIndex == 0:
		return ""
	case tl.StageIndex < 3:
		return c.Question
	}
	conf := fmtHundredths(Hundredths(c.Confidence))
	return c.Question + " → " + c.Answer + " " + conf + " → " + c.GateLabel
}

// Accent blends from the previous case's color during the first 0.4 s of a case.
func Accent(t float64, cases []Case) [3]int {
	tl := Timeline(t)
	ci := tl.CaseIndex
	cur := hexRGB(cases[ci].Accent)
	k := tl.Local / AccentBlendSeconds
	if k >= 1 {
		return cur
	}
	prev := hexRGB(cases[(ci+NumCases-1)%NumCases].Accent)
	var out [3]int
	for i := range out {
		out[i] = int(math.Floor(float64(prev[i]) + float64(cur[i]-prev[i])*k + 0.5))
	}
	return out
}

func plate(stageIndex int, c Case) string {
	h := Hundredths(c.Confidence)
	conf := fmtHundredths(h)
	passed := h >= GateHundredths
	switch stageIndex {
	case 0:
		return "state packed · evidence"
	case 1:
		return "typed question · asked"
	case 2:
		return "→ " + c.Answer + " · " + conf
	case 3:
		if passed {
			return conf + " ≥ 0.85 · pass"
		}
		return conf + " < 0.85 · human"
	}
	if passed {
		return "done · code acts"
	}
	return "→ human · review"
}

// Active lists the lit cards, the travelling ball and the plates of the current case.
func Active(t float64, cases []Case) ActiveResult {
	tl := Timeline(t)
	si := tl.StageIndex
	c := cases[tl.CaseIndex]
	path := c.Path
	arrived := tl.StageProgress >= BallTravel
	plates := []Plate{}
	for i := 0; i <= si; i++ {
		if i < si || arrived {
			plates = append(plates, Plate{Card: path[i], Text: plate(i, c)})
		}
	}
	var from *string
	if si > 0 {
		f := path[si-1]
		from = &f
	}
	return ActiveResult{
		Lit: slices.Clone(path[:si+1]),
		Ball: ActiveBall{
			From:     from,
			To:       path[si],
			Progress: math.Min(1, tl.StageProgress/BallTravel),
			Arrived:  arrived,
		},
		Plates: plates,
	}
}

func CardPosition(column, row int) [3]float64 {
	return [3]float64{float64(column-2) * ColumnSpacing, -float64(row)*CardStep + columnY[column], 0}
}

func linkColor(r float64) string {
	for _, lc := range linkColors {
		if r < lc.limit {
			return lc.name
		}
	}
	return linkColors[len(linkColors)-1].name
}

// Links connects each card of columns 0..3 to 3..6 cards of the next column.
func Links(seed uint32, columns []Column) []Link {
	r := Mulberry32(Hash32(seed, ChLinks))
	out := []Link{}
	for i := 0; i < len(columns)-1; i++ {
		dst := columns[i+1].Cards
		for _, card := range columns[i].Cards {
			n := 3 + int(math.Floor(r()*4))
			used := map[int]bool{}
			for j := 0; j < n; j++ {
				ti := int(math.Floor(r() * float64(len(dst))))
				c := r()
				if used[ti] {
					continue
				}
				used[ti] = true
				out = append(out, Link{From: card.ID, To: dst[ti].ID, Color: linkColor(c)})
			}
		}
	}
	return out
}

func typeIndex(name string) int { return slices.Index(typeNames[:], name) }

// Bars returns the six parallel-question rows; the case's own type gets the winning answer.
func Bars(seed uint32, ci int, cases []Case) []Bar {
	c := cases[ci]
	r := Mulberry32(Hash32(seed, ChBars, uint32(ci)))
	rows := make([]Bar, len(barRows))
	for i, label := range barRows {
		typ := typeNames[i/2]
		v := 0.05 + 0.9*r()
		answers := answerSets[typ]
		a := answers[int(math.Floor(r()*float64(len(answers))))]
		rows[i] = Bar{Label: label, Type: typ, Value: v, Answer: a}
	}
	win := 2 * typeIndex(c.Type)
	rows[win].Value = 0.9 + 0.1*r()
	rows[win].Answer = c.Answer
	for i := range rows {
		rows[i].Bright = rows[i].Value >= 0.85
	}
	return rows
}

func BarGrow(t float64, i int) float64 {
	local := Timeline(t).Local
	return clamp((local-stageStarts[1]-float64(i)*BarStaggerSeconds)/BarGrowSeconds, 0, 1)
}

// Actions is a seeded random walk in 3..8 that takes one step every 2 s within each cycle.
func Actions(t float64, seed uint32) int {
	t = norm(t)
	cycle := math.Floor(t / CycleSeconds)
	steps := int(math.Min(48, math.Floor((t-cycle*CycleSeconds)/ActionsStepSeconds)))
	a := ActionsStart
	for j := 1; j <= steps; j++ {
		a = clamp(a+int(Hash32(seed, ChActions, uint32(cycle), uint32(j))%3)-1, ActionsMin, ActionsMax)
	}
	return a
}

// caseLine renders the log line for a case event: k is 0 ask, 1 jev, 2 gate, 3 code.
func caseLine(c Case, k int) LogLine {
	h := Hundredths(c.Confidence)
	conf := fmtHundredths(h)
	switch k {
	case 0:
		return LogLine{Tag: "ask", Text: strings.ReplaceAll(c.Question, " · ", " ")}
	case 1:
		return LogLine{Tag: "jev", Text: fmt.Sprintf("→ %s  %s  %dms", c.Answer, conf, c.JevMs)}
	case 2:
		if h >= GateHundredths {
			return LogLine{Tag: "gate", Text: conf + " ≥ 0.85  pass"}
		}
		return LogLine{Tag: "gate", Text: conf + " < 0.85  human"}
	}
	return LogLine{Tag: "code", Text: c.LogCode}
}

func logLine(m int, seed uint32, cases []Case) LogLine {
	if idx := slices.Index(logCaseSlots[:], m%LogSlotsPerCase); idx >= 0 {
		return caseLine(cases[(m/LogSlotsPerCase)%NumCases], idx)
	}
	h := Hash32(seed, ChLog, uint32(m))
	if h%8 == 0 {
		return LogLine{Tag: "limit", Text: fmt.Sprintf("actions %d/10  spend ok", Actions(float64(m)*0.5, seed))}
	}
	return caseLine(cases[int((h>>3)%NumCases)], int((h>>8)%4))
}

// Log shows the last LogVisible lines; scroll is the fractional part of the slot position.
func Log(t float64, seed uint32, cases []Case) LogResult {
	x := norm(t) * LogSlotsPerSecond
	n := math.Floor(x)
	lines := []LogLine{}
	for m := max(0, int(n)-LogVisible+1); m <= int(n); m++ {
		lines = append(lines, logLine(m, seed, cases))
	}
	return LogResult{Lines: lines, Scroll: x - n}
}

// Queued returns the sorted tile indexes that show a "queued" dot for case ci in the current cycle.
func Queued(t float64, seed uint32, ci int) []int {
	cycle := math.Floor(norm(t) / CycleSeconds)
	h := Hash32(seed, ChQueue, uint32(cycle), uint32(ci))
	count := int(h % 3)
	r := Mulberry32(h)
	picked := []int{}
	for range count {
		idx := int(math.Floor(r() * NumCases))
		if idx != ci && !slices.Contains(picked, idx) {
			picked = append(picked, idx)
		}
	}
	slices.Sort(picked)
	return picked
}

// Chief types text over an endless tape: text must be ASCII and end with a newline.
func Chief(t float64, text string) ChiefResult {
	parts := strings.Split(text, "\n")
	lines := parts[:len(parts)-1]
	pos := int(math.Floor(norm(t)*ChiefCharsPerSecond)) % len(text)
	prefix := text[:pos]
	li := strings.Count(prefix, "\n")
	col := pos - (strings.LastIndex(prefix, "\n") + 1)
	visible := make([]string, 0, ChiefVisibleLines)
	for k := li - ChiefVisibleLines + 1; k <= li; k++ {
		line := lines[mod(k, len(lines))]
		if k == li {
			line = line[:col]
		}
		visible = append(visible, line)
	}
	return ChiefResult{Pos: pos, Line: li, Col: col, Visible: visible}
}

func Split(t float64, seed uint32) [3]int {
	k := uint32(math.Floor(norm(t) * SplitStepsPerSecond))
	var out [3]int
	for r := range out {
		out[r] = clamp(splitBase[r]+int(Hash32(seed, ChSplit, k, uint32(r))%3)-1, 0, SplitSegments)
	}
	return out
}

func Spark(t float64, seed uint32) SparkResult {
	x := norm(t) * SparkStepsPerSecond
	k := math.Floor(x)
	values := make([]float64, SparkPoints)
	for i := range values {
		values[i] = 180 + float64(Hash32(seed, ChSpark, uint32(k)+uint32(i))%1000)*0.12
	}
	return SparkResult{Values: values, Offset: x - k}
}

// Stream is one of the three confidence curves; x runs from 0 (left edge) to 1 (now).
func Stream(t float64, seed uint32, typeIndex int, x float64) float64 {
	r := Mulberry32(Hash32(seed, ChStream, uint32(typeIndex)))
	p0 := 2 * math.Pi * r()
	p1 := 2 * math.Pi * r()
	p2 := 2 * math.Pi * r()
	s := norm(t) - (1-x)*StreamHistorySeconds
	return 0.80 + 0.10*math.Sin(1.3*s+p0) + 0.06*math.Sin(2.9*s+p1) + 0.03*math.Sin(6.1*s+p2)
}
