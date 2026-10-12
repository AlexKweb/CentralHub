import { addAfterEffect, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { AdditiveBlending } from 'three';
import type { PerspectiveCamera } from 'three';
import { accent, active, cardPosition, links, timeline } from '../sim';
import type { Case, Column, Vec3 } from '../sim';
import { fmtHundredths, hundredths } from '../sim/util';
import { useClock } from '../state/store';
import { markSceneRendered, takeComposedFrame } from '../state/jevHook';
import { cameraPose, viewOffset } from './camera';
import { cardView, cardKey } from './cardView';
import type { CardView } from './cardView';
import { CARD_PLANE, HEADER_PLANE, cardCenters, cardsDoc, headerPosition } from './layout';
import { floorField, wallField } from './grid';
import type { LineField } from './grid';
import { linkField } from './links';
import { ActivePath } from './ActivePath';
import { ActiveParticles, DustParticles, LinkParticles } from './Particles';
import { PostFx } from './PostFx';
import { drawCard, drawHeader, useCanvasTexture } from './textures';

const CENTERS = cardCenters(cardsDoc.columns);
const WALL = wallField();
const FLOOR = floorField();

export function Scene({ t, cases }: { t: number; cases: readonly Case[] }) {
  const view = active(t, cases);
  const lit = new Set(view.lit);
  const plates = new Map(view.plates.map((p) => [p.card, p.text] as const));
  const rgb = accent(t, cases);
  const liveConfidence = fmtHundredths(hundredths(cases[timeline(t).caseIndex].confidence));

  return (
    <>
      <CameraRig cases={cases} />
      <RenderProbe t={t} />
      <Lines field={WALL} />
      <Lines field={FLOOR} />
      <Links />
      <LinkParticles />
      <DustParticles />
      {cardsDoc.columns.map((column, ci) => (
        <group key={column.id}>
          <ColumnHeader column={column} position={headerPosition(ci)} />
          {column.cards.map((card, row) => (
            <CardMesh
              key={card.id}
              position={cardPosition(ci, row)}
              view={cardView(
                card,
                column.color,
                lit.has(card.id),
                rgb,
                plates.get(card.id) ?? null,
                liveConfidence,
              )}
            />
          ))}
        </group>
      ))}
      <ActivePath t={t} cases={cases} />
      <ActiveParticles cases={cases} />
      <PostFx cases={cases} />
    </>
  );
}

function CameraRig({ cases }: { cases: readonly Case[] }) {
  const camera = useThree((s) => s.camera as PerspectiveCamera);
  const size = useThree((s) => s.size);
  useFrame(() => {
    const pose = cameraPose(useClock.getState().t, cases, CENTERS);
    camera.position.set(...pose.position);
    camera.up.set(...pose.up);
    camera.lookAt(...pose.target);
    camera.setViewOffset(...viewOffset(size.width, size.height));
  });
  return null;
}

/** Marks the scene ready once a frame has rendered at the clock time the scene was given, through the composer when fx is on. */
function RenderProbe({ t }: { t: number }) {
  const latest = useRef(t);
  useEffect(() => {
    latest.current = t;
  }, [t]);
  useEffect(
    () =>
      addAfterEffect(() => {
        const { t: now, fx } = useClock.getState();
        const composed = takeComposedFrame();
        if (latest.current === now && (!fx || composed)) markSceneRendered();
      }),
    [],
  );
  return null;
}

function Lines({ field }: { field: LineField }) {
  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[field.positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[field.colors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial vertexColors />
    </lineSegments>
  );
}

/** Additive and drawn before the cards, so the cards cover the links they sit on. */
function Links() {
  const seed = useClock((s) => s.seed);
  const field = useMemo(() => linkField(seed, links(seed, cardsDoc.columns), CENTERS), [seed]);
  return (
    <lineSegments renderOrder={-1}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[field.positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[field.colors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial vertexColors transparent blending={AdditiveBlending} depthWrite={false} />
    </lineSegments>
  );
}

function ColumnHeader({ column, position }: { column: Column; position: Vec3 }) {
  const texture = useCanvasTexture(column.id, HEADER_PLANE, (ctx) => drawHeader(ctx, column));
  return (
    <mesh position={position}>
      <planeGeometry args={HEADER_PLANE} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
}

function CardMesh({ view, position }: { view: CardView; position: Vec3 }) {
  const texture = useCanvasTexture(cardKey(view), CARD_PLANE, (ctx) => drawCard(ctx, view));
  return (
    <mesh position={position}>
      <planeGeometry args={CARD_PLANE} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
}
