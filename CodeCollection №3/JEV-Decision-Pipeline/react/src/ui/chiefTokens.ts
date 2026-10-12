export type ChiefTokenKind = 'kw' | 'cls' | 'str' | 'com' | 'txt';

export interface ChiefToken {
  kind: ChiefTokenKind;
  text: string;
}

const KEYWORDS = new Set(['import', 'from', 'with', 'as', 'if']);

// Comments and strings come before identifiers so a '#' or a quote inside them is never split out.
const TOKEN_RE = /#.*|[fFrRbB]?"(?:[^"\\]|\\.)*"?|[fFrRbB]?'(?:[^'\\]|\\.)*'?|[A-Za-z_]\w*|\s+|[\s\S]/g;

function classify(text: string): ChiefTokenKind {
  if (text.startsWith('#')) return 'com';
  if (/^[fFrRbB]?["']/.test(text)) return 'str';
  if (KEYWORDS.has(text)) return 'kw';
  if (/^[A-Z]/.test(text)) return 'cls';
  return 'txt';
}

/** Splits one line of chief.py into highlighted runs; adjacent runs of the same kind are merged. */
export function tokenizeChief(line: string): ChiefToken[] {
  const out: ChiefToken[] = [];
  for (const match of line.matchAll(TOKEN_RE)) {
    const text = match[0];
    const kind = classify(text);
    const last = out[out.length - 1];
    if (last && last.kind === kind) last.text += text;
    else out.push({ kind, text });
  }
  return out;
}
