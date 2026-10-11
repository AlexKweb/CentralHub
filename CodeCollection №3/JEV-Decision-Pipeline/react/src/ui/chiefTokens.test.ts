import { describe, expect, it } from 'vitest';
import { tokenizeChief } from './chiefTokens';

describe('tokenizeChief', () => {
  it('highlights keywords and capitalised names, leaving other text plain', () => {
    expect(tokenizeChief('from typesafe_sdk import Choice, TypeSafeClient')).toEqual([
      { kind: 'kw', text: 'from' },
      { kind: 'txt', text: ' typesafe_sdk ' },
      { kind: 'kw', text: 'import' },
      { kind: 'txt', text: ' ' },
      { kind: 'cls', text: 'Choice' },
      { kind: 'txt', text: ', ' },
      { kind: 'cls', text: 'TypeSafeClient' },
    ]);
  });

  it('keeps a comment as one run', () => {
    expect(tokenizeChief('# jev decides. code acts.')).toEqual([
      { kind: 'com', text: '# jev decides. code acts.' },
    ]);
  });

  it('does not split a string that contains a hash', () => {
    expect(tokenizeChief('s = "a # b"')).toEqual([
      { kind: 'txt', text: 's = ' },
      { kind: 'str', text: '"a # b"' },
    ]);
  });

  it('treats f-strings and unterminated strings as strings', () => {
    expect(tokenizeChief('job = folder / f"{uuid4().hex}.json"')).toEqual([
      { kind: 'txt', text: 'job = folder / ' },
      { kind: 'str', text: 'f"{uuid4().hex}.json"' },
    ]);
    expect(tokenizeChief('x = "abc')).toEqual([
      { kind: 'txt', text: 'x = ' },
      { kind: 'str', text: '"abc' },
    ]);
  });

  it('does not highlight keywords inside longer identifiers', () => {
    expect(tokenizeChief('iffy')).toEqual([{ kind: 'txt', text: 'iffy' }]);
    expect(tokenizeChief('import_json')).toEqual([{ kind: 'txt', text: 'import_json' }]);
  });

  it('returns no runs for an empty line and keeps every character otherwise', () => {
    expect(tokenizeChief('')).toEqual([]);
    for (const line of [
      '    "research": "Collect evidence first.",',
      'answer = result.choices["next_worker"]',
      'with TypeSafeClient(model="jev-1.13.0") as client:',
    ]) {
      expect(tokenizeChief(line).map((tok) => tok.text).join('')).toBe(line);
    }
  });
});
