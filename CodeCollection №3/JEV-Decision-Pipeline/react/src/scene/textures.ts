import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import type { Column } from '../sim';
import type { CardView } from './cardView';
import { CARD_H, CARD_MARGIN, CARD_W } from './layout';

const UNIT = 100;
/** Texture density: 2× the 100 px-per-unit layout. */
const SCALE = 2;
const MONO = '"JetBrains Mono", monospace';
const INK = '#05070B';
const TITLE = '#E6EBF5';
const LABEL = '#7D8799';
const VALUE = '#C9D1E0';
const BORDER = '#2A3348';
const CARD_FILL = 'rgba(13, 19, 32, 0.9)';

/** Draws into a canvas of `planeSize` world units. `key` must cover everything `draw` reads. */
export function useCanvasTexture(
  key: string,
  planeSize: readonly [number, number],
  draw: (ctx: CanvasRenderingContext2D) => void,
): CanvasTexture {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(planeSize[0] * UNIT * SCALE);
    canvas.height = Math.round(planeSize[1] * UNIT * SCALE);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2d canvas context unavailable');
    ctx.scale(SCALE, SCALE);
    draw(ctx);
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    return tex;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the key is the dependency
  }, [key]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

export function drawCard(ctx: CanvasRenderingContext2D, v: CardView): void {
  const m = CARD_MARGIN * UNIT;
  const x = m;
  const y = m;
  const w = CARD_W * UNIT;
  const h = CARD_H * UNIT;
  const accent = v.accent ? v.accent.join(', ') : null;

  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fillStyle = CARD_FILL;
  ctx.fill();
  if (accent) {
    ctx.fillStyle = `rgba(${accent}, 0.12)`;
    ctx.fill();
    ctx.shadowColor = `rgba(${accent}, 0.9)`;
    ctx.shadowBlur = 24;
    ctx.strokeStyle = `rgb(${accent})`;
  } else {
    ctx.strokeStyle = BORDER;
  }
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = v.color;
  ctx.fillRect(x + 12, y + 12, 7, 7);
  ctx.font = `700 15px ${MONO}`;
  ctx.fillStyle = TITLE;
  ctx.fillText(v.title, x + 26, y + 24, w - 38);

  v.rows.forEach((row, i) => {
    const baseline = y + 44 + i * 17;
    ctx.font = `400 11px ${MONO}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = LABEL;
    ctx.fillText(row.k, x + 12, baseline, w * 0.45);
    ctx.textAlign = 'right';
    ctx.fillStyle = row.hl ? v.color : VALUE;
    ctx.fillText(row.v, x + w - 12, baseline, w * 0.55);
  });

  if (accent && v.plate) {
    ctx.fillStyle = `rgb(${accent})`;
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 84, w - 16, 13, 2);
    ctx.fill();
    ctx.font = `700 9px ${MONO}`;
    ctx.fillStyle = INK;
    ctx.textAlign = 'left';
    ctx.fillText(v.plate, x + 14, y + 94, w - 28);
  } else {
    ctx.fillStyle = v.color;
    ctx.fillRect(x + 12, y + 88, 18, 2);
  }
}

export function drawHeader(ctx: CanvasRenderingContext2D, column: Column): void {
  const maxW = CARD_W * UNIT;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = `400 11px ${MONO}`;
  ctx.fillStyle = LABEL;
  ctx.fillText(column.num, 0, 26, 28);
  const numW = ctx.measureText(column.num).width + 10;

  ctx.font = `700 14px ${MONO}`;
  ctx.fillStyle = TITLE;
  ctx.fillText(column.title, numW, 26, maxW - numW);
  const titleW = Math.min(ctx.measureText(column.title).width, maxW - numW);

  ctx.fillStyle = column.color;
  ctx.fillRect(0, 36, numW + titleW, 2);
}
