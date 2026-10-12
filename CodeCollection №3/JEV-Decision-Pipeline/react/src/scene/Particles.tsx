import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import { AdditiveBlending } from 'three';
import { links } from '../sim';
import type { Link, Vec3 } from '../sim';
import { useClock } from '../state/store';
import { linkCurve } from './curves';
import { RGB } from './links';
import { cardCenters, cardsDoc } from './layout';
import { DUST_PARTICLES, LINK_PARTICLES, dustParams, particleParams, towardWhite } from './particles';

const CENTERS = cardCenters(cardsDoc.columns);
const WHITE_LINK = 0.4;
const INTENSITY = 0.6;
const SPARKLE_INTENSITY = 1;

/** Soft round sprite: radial falloff squared, drawn additively. */
const FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  float d = 2.0 * length(gl_PointCoord - 0.5);
  float falloff = 1.0 - smoothstep(0.0, 1.0, d);
  gl_FragColor = vec4(vColor, falloff * falloff * vAlpha);
}
`;

/** Each link particle evaluates its own cubic Bézier at u = fract(p + s t). */
const LINK_VERTEX = /* glsl */ `
attribute vec3 aC1;
attribute vec3 aC2;
attribute vec3 aC3;
attribute vec3 aParams;
attribute vec4 aColor;
uniform float uTime;
uniform float uPixelRatio;
varying vec3 vColor;
varying float vAlpha;

void main() {
  float u = fract(aParams.x + aParams.y * uTime);
  float v = 1.0 - u;
  vec3 p = v * v * v * position + 3.0 * v * v * u * aC1 + 3.0 * v * u * u * aC2 + u * u * u * aC3;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = aParams.z * uPixelRatio;
  vColor = aColor.rgb;
  vAlpha = aColor.a;
}
`;

/** Plain points with a pulsing alpha: aPulse holds base, amplitude and phase. */
const POINT_VERTEX = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;
attribute vec3 aPulse;
uniform float uTime;
uniform float uPixelRatio;
varying vec3 vColor;
varying float vAlpha;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uPixelRatio;
  vColor = aColor;
  vAlpha = aPulse.x + aPulse.y * sin(1.7 * uTime + aPulse.z);
}
`;

type Uniforms = Record<'uTime' | 'uPixelRatio', { value: number }>;

/** Clock time and device pixel ratio for the particle shaders, refreshed every frame. */
function useParticleUniforms(): Uniforms {
  const uniforms = useMemo<Uniforms>(() => ({ uTime: { value: 0 }, uPixelRatio: { value: 1 } }), []);
  useFrame((state) => {
    uniforms.uTime.value = useClock.getState().t;
    uniforms.uPixelRatio.value = state.viewport.dpr;
  });
  return uniforms;
}

interface LinkBuffers {
  /** Bézier control points; P0 is also the `position` attribute. */
  curve: [Float32Array, Float32Array, Float32Array, Float32Array];
  params: Float32Array;
  color: Float32Array;
}

function linkBuffers(seed: number, list: readonly Link[]): LinkBuffers {
  const curve = [0, 1, 2, 3].map(() => new Float32Array(LINK_PARTICLES * 3)) as LinkBuffers['curve'];
  const params = new Float32Array(LINK_PARTICLES * 3);
  const color = new Float32Array(LINK_PARTICLES * 4);
  for (let i = 0; i < LINK_PARTICLES; i++) {
    const link = list[i % list.length];
    const from = CENTERS.get(link.from) as Vec3;
    const to = CENTERS.get(link.to) as Vec3;
    const points = linkCurve(from, to);
    points.forEach((pt, k) => curve[k].set(pt, i * 3));
    const { p, s, sparkle, size } = particleParams(seed, i);
    params.set([p, s, size], i * 3);
    const rgb = towardWhite(RGB[link.color], WHITE_LINK);
    color.set([...rgb, sparkle ? SPARKLE_INTENSITY : INTENSITY], i * 4);
  }
  return { curve, params, color };
}

interface DustBuffers {
  position: Float32Array;
  size: Float32Array;
  color: Float32Array;
  pulse: Float32Array;
}

function dustBuffers(seed: number): DustBuffers {
  const position = new Float32Array(DUST_PARTICLES * 3);
  const size = new Float32Array(DUST_PARTICLES);
  const color = new Float32Array(DUST_PARTICLES * 3).fill(1);
  const pulse = new Float32Array(DUST_PARTICLES * 3);
  for (let i = 0; i < DUST_PARTICLES; i++) {
    const d = dustParams(seed, i);
    position.set(d.position, i * 3);
    size[i] = d.size;
    pulse.set([0.25, 0.25, d.phase], i * 3);
  }
  return { position, size, color, pulse };
}

/** 300 static motes in the void; depth-tested so the cards occlude the ones behind them. */
export function DustParticles() {
  const seed = useClock((s) => s.seed);
  const uniforms = useParticleUniforms();
  const buffers = useMemo(() => dustBuffers(seed), [seed]);
  return (
    <points frustumCulled={false} renderOrder={1}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[buffers.position, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[buffers.size, 1]} />
        <bufferAttribute attach="attributes-aColor" args={[buffers.color, 3]} />
        <bufferAttribute attach="attributes-aPulse" args={[buffers.pulse, 3]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={POINT_VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

/** 1500 particles riding the links; the cards drawn after them cover the ones underneath. */
export function LinkParticles() {
  const seed = useClock((s) => s.seed);
  const uniforms = useParticleUniforms();
  const buffers = useMemo(() => linkBuffers(seed, links(seed, cardsDoc.columns)), [seed]);
  const [c0, c1, c2, c3] = buffers.curve;
  return (
    <points frustumCulled={false} renderOrder={-1}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[c0, 3]} />
        <bufferAttribute attach="attributes-aC1" args={[c1, 3]} />
        <bufferAttribute attach="attributes-aC2" args={[c2, 3]} />
        <bufferAttribute attach="attributes-aC3" args={[c3, 3]} />
        <bufferAttribute attach="attributes-aParams" args={[buffers.params, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[buffers.color, 4]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={LINK_VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
