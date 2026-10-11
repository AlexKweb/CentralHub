import type { Rgb } from './types';

/** NaN and negative times clamp to 0, as in simref.norm. */
export function norm(t: number): number {
  return t === t && t > 0 ? t : 0;
}

export function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

/** Positive modulo, so negative line indices wrap the way Python's % does. */
export function mod(x: number, n: number): number {
  return ((x % n) + n) % n;
}

export function hundredths(conf: number): number {
  return Math.floor(conf * 100 + 0.5);
}

export function fmtHundredths(h: number): string {
  return `${Math.floor(h / 100)}.${String(h % 100).padStart(2, '0')}`;
}

export function fmtThousands(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function fmtMoney(cents: number): string {
  return `$${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

export function hexRgb(hex: string): Rgb {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}
