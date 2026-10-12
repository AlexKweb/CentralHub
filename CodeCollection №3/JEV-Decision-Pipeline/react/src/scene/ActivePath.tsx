import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, Color } from 'three';
import type { Group, Sprite, SpriteMaterial } from 'three';
import { accent } from '../sim';
import type { Case, Vec3 } from '../sim';
import { useClock } from '../state/store';
import { linkCurve, sampleBezier } from './curves';
import { cardCenters, cardsDoc } from './layout';
import { routeView } from './route';
import { useCanvasTexture } from './textures';

const CENTERS = cardCenters(cardsDoc.columns);
const RIBBON_SEGMENTS = 24;
const TRAVEL_Z = 0.4;
const WHITE = new Color('#ffffff');
const tint = new Color();

/** Accent ribbons between lit cards, with the ball and the arrival flash. */
export function ActivePath({ t, cases }: { t: number; cases: readonly Case[] }) {
  const { pairs } = routeView(t, cases, CENTERS);
  const [r, g, b] = accent(t, cases);
  const color = `rgb(${r}, ${g}, ${b})`;
  return (
    <>
      {pairs.map(([from, to]) => (
        <Ribbon key={`${from}>${to}`} from={CENTERS.get(from) as Vec3} to={CENTERS.get(to) as Vec3} color={color} />
      ))}
      <Travel cases={cases} />
    </>
  );
}

function Ribbon({ from, to, color }: { from: Vec3; to: Vec3; color: string }) {
  const points = useMemo(() => sampleBezier(linkCurve(from, to), RIBBON_SEGMENTS), [from, to]);
  return (
    <group renderOrder={2}>
      <Line points={points} color={color} lineWidth={12} transparent opacity={0.18} depthWrite={false} />
      <Line points={points} color={color} lineWidth={4} transparent depthWrite={false} />
    </group>
  );
}

/** Ball and flash follow the clock every frame rather than the throttled UI time, so motion stays smooth. */
function Travel({ cases }: { cases: readonly Case[] }) {
  const glow = useCanvasTexture('glow', [1, 1], drawGlow);
  const ball = useRef<Group>(null);
  const coreMat = useRef<SpriteMaterial>(null);
  const haloMat = useRef<SpriteMaterial>(null);
  const flash = useRef<Sprite>(null);
  const flashMat = useRef<SpriteMaterial>(null);

  useFrame(() => {
    const t = useClock.getState().t;
    const view = routeView(t, cases, CENTERS);
    const [r, g, b] = accent(t, cases);
    tint.setStyle(`rgb(${r}, ${g}, ${b})`);

    if (ball.current) ball.current.position.set(view.ball.at[0], view.ball.at[1], TRAVEL_Z);
    if (coreMat.current) {
      coreMat.current.color.copy(tint).lerp(WHITE, 0.7);
      coreMat.current.opacity = view.ball.alpha;
    }
    if (haloMat.current) {
      haloMat.current.color.copy(tint);
      haloMat.current.opacity = 0.6 * view.ball.alpha;
    }

    const strength = view.flash?.strength ?? 0;
    if (flash.current && view.flash) {
      const [x, y] = view.flash.at;
      flash.current.position.set(x, y, TRAVEL_Z);
      const s = 1 + 0.25 * strength;
      flash.current.scale.set(2.8 * s, 1.8 * s, 1);
    }
    if (flashMat.current) {
      flashMat.current.color.copy(tint);
      flashMat.current.opacity = 0.7 * strength;
    }
  });

  return (
    <>
      <group ref={ball} renderOrder={3}>
        <sprite scale={[1.1, 1.1, 1]}>
          <spriteMaterial ref={haloMat} map={glow} transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
        </sprite>
        <sprite scale={[0.35, 0.35, 1]}>
          <spriteMaterial ref={coreMat} map={glow} transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
        </sprite>
      </group>
      <sprite ref={flash} renderOrder={3} scale={[2.8, 1.8, 1]}>
        <spriteMaterial ref={flashMat} map={glow} transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
      </sprite>
    </>
  );
}

function drawGlow(ctx: CanvasRenderingContext2D): void {
  const g = ctx.createRadialGradient(50, 50, 0, 50, 50, 50);
  g.addColorStop(0, 'rgba(255, 255, 255, 1)');
  g.addColorStop(0.2, 'rgba(255, 255, 255, 0.7)');
  g.addColorStop(0.5, 'rgba(255, 255, 255, 0.18)');
  g.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 100, 100);
}
