import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import cardsJson from '@shared/cards.json';
import casesJson from '@shared/cases.json';
import cardsSchema from '@shared/schema/cards.schema.json';
import casesSchema from '@shared/schema/cases.schema.json';
import chiefText from '@shared/chief.py?raw';
import { GATE_HUNDREDTHS } from './constants';
import type { CardsDoc, CasesDoc } from './types';
import { hundredths } from './util';

const cases = casesJson as CasesDoc;
const cards = cardsJson as CardsDoc;
const COLUMN_IDS = ['state', 'questions', 'jev', 'gate', 'code'];

const ajv = new Ajv2020({ allErrors: true });
const validateCases = ajv.compile(casesSchema);
const validateCards = ajv.compile(cardsSchema);

const cardIds = cards.columns.flatMap((column) => column.cards.map((card) => card.id));
const cardColumn = new Map<string, number>();
const cardTitle = new Map<string, string>();
cards.columns.forEach((column, index) => {
  for (const card of column.cards) {
    cardColumn.set(card.id, index);
    cardTitle.set(card.id, card.title);
  }
});

describe('shared JSON schemas', () => {
  it('cases.json matches cases.schema.json', () => {
    expect(validateCases(casesJson), ajv.errorsText(validateCases.errors)).toBe(true);
  });

  it('cards.json matches cards.schema.json', () => {
    expect(validateCards(cardsJson), ajv.errorsText(validateCards.errors)).toBe(true);
  });
});

describe('cross-file invariants (port of simref.validate)', () => {
  it('columns come in order state, questions, jev, gate, code', () => {
    expect(cards.columns.map((column) => column.id)).toEqual(COLUMN_IDS);
  });

  it('card ids are unique across columns', () => {
    expect(new Set(cardIds).size).toBe(cardIds.length);
  });

  it('there are 12 cases with unique ids', () => {
    expect(cases.cases).toHaveLength(12);
    expect(new Set(cases.cases.map((c) => c.id)).size).toBe(12);
  });

  it('every path card exists and sits in its column', () => {
    const errors: string[] = [];
    for (const c of cases.cases) {
      c.path.forEach((cardId, stage) => {
        if (!cardColumn.has(cardId)) errors.push(`${c.id}: unknown card ${cardId}`);
        else if (cardColumn.get(cardId) !== stage) errors.push(`${c.id}: ${cardId} is not in column ${stage}`);
      });
    }
    expect(errors).toEqual([]);
  });

  it('each case has exactly five path cards, one per column', () => {
    expect(cases.cases.map((c) => c.path.length)).toEqual(cases.cases.map(() => 5));
  });

  it('the question equals the title of the questions card', () => {
    const errors = cases.cases
      .filter((c) => cardTitle.get(c.path[1]) !== c.question)
      .map((c) => `${c.id}: question ${c.question} != card title ${cardTitle.get(c.path[1])}`);
    expect(errors).toEqual([]);
  });

  it('the type matches the question prefix', () => {
    const errors = cases.cases
      .filter((c) => c.question.split(' · ')[0].toLowerCase() !== c.type)
      .map((c) => `${c.id}: type ${c.type} does not match ${c.question}`);
    expect(errors).toEqual([]);
  });

  it('the JEV card is j.<type>_head', () => {
    const errors = cases.cases
      .filter((c) => c.path[2] !== `j.${c.type}_head`)
      .map((c) => `${c.id}: JEV card ${c.path[2]} is not j.${c.type}_head`);
    expect(errors).toEqual([]);
  });

  it('confidence has at most two decimals', () => {
    const errors = cases.cases
      .filter((c) => Math.abs(hundredths(c.confidence) / 100 - c.confidence) > 1e-9)
      .map((c) => `${c.id}: confidence ${c.confidence} has more than 2 decimals`);
    expect(errors).toEqual([]);
  });

  it('the gate in cases.json matches the sim gate constant', () => {
    expect(Math.round(cases.gate * 100)).toBe(GATE_HUNDREDTHS);
  });
});

describe('chief.py', () => {
  it('is ASCII and ends with a newline', () => {
    expect(/^[\x00-\x7f]*$/.test(chiefText)).toBe(true);
    expect(chiefText.endsWith('\n')).toBe(true);
  });
});
