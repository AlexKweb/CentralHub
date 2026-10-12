import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { useClock } from '../state/store';

/** Post-processing stack, mounted only while the fx flag is on: `?fx=0` and key F draw the plain scene. */
export function PostFx() {
  const fx = useClock((s) => s.fx);
  if (!fx) return null;
  return (
    <EffectComposer>
      <Bloom mipmapBlur luminanceThreshold={0.25} luminanceSmoothing={0.2} intensity={1.4} radius={0.7} />
      <Vignette offset={0.3} darkness={0.6} />
      <Noise opacity={0.04} premultiply />
    </EffectComposer>
  );
}
