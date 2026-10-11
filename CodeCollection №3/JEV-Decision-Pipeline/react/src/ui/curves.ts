/** Y of `value` on a chart `height` px tall, where yMin sits at the bottom edge and yMax at the top. */
export function valueY(value: number, height: number, yMin: number, yMax: number): number {
  return height * (1 - (value - yMin) / (yMax - yMin));
}

/** SVG `points` for samples spread evenly from the left edge to the right edge. */
export function curvePoints(
  values: readonly number[],
  width: number,
  height: number,
  yMin: number,
  yMax: number,
): string {
  const steps = Math.max(1, values.length - 1);
  return values
    .map((v, i) => `${((i * width) / steps).toFixed(2)},${valueY(v, height, yMin, yMax).toFixed(2)}`)
    .join(' ');
}
