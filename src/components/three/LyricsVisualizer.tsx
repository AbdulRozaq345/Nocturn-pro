"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useAudioAnalyser } from "@/context/AudioAnalyserContext";

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uIntensity; // 0..1 — boosted when a lyric line is active
  uniform vec2 uResolution;

  const vec3 NEON = vec3(0.447, 0.996, 0.561);

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // 2D value noise
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  // Flowing waveform "ribbons" that sweep across the panel
  float ribbon(vec2 uv, float yOffset, float freq, float speed, float thickness) {
    float wave = sin(uv.x * freq + uTime * speed) * 0.18
               + sin(uv.x * freq * 2.3 - uTime * speed * 0.7) * 0.09
               + noise(vec2(uv.x * 1.5, uTime * 0.4)) * 0.12;
    wave += uBass * 0.25;
    float d = abs(uv.y - yOffset - wave);
    return smoothstep(thickness, 0.0, d);
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= uResolution.x / uResolution.y;

    // Base: deep navy gradient with a subtle vertical wash
    float vGrad = smoothstep(-1.2, 1.2, uv.y);
    vec3 col = mix(
      vec3(0.010, 0.012, 0.018),
      vec3(0.020, 0.030, 0.026),
      vGrad
    );

    // A few flowing ribbons at different depths
    float r1 = ribbon(uv, -0.55, 2.0, 0.55, 0.06) * 0.45;
    float r2 = ribbon(uv,  0.10, 2.8, 0.85, 0.045) * 0.55;
    float r3 = ribbon(uv,  0.50, 1.5, 0.40, 0.07) * 0.30;
    float ribbons = r1 + r2 + r3;

    // Audio-reactive shimmer: brighten mids/trebles
    ribbons *= 0.6 + uMid * 0.6 + uTreble * 0.4;
    col += NEON * ribbons * (0.55 + uIntensity * 0.6);

    // Central beam highlighting the active-line band (middle of the panel)
    float beam = exp(-pow(uv.y, 2.0) * 4.0)
               * (0.20 + uBass * 0.35 + uIntensity * 0.30);
    col += NEON * beam * 0.35;

    // Sparkle pass (very subtle dust)
    vec2 cell = floor(vUv * 220.0);
    float n = hash(cell + floor(uTime * 6.0));
    float sparkle = step(0.992, n) * (0.4 + uTreble * 0.8);
    col += vec3(1.0) * sparkle * 0.25;

    // Vignette so text edges remain readable
    float vign = smoothstep(1.6, 0.4, length(uv * vec2(0.9, 1.1)));
    col *= mix(0.55, 1.0, vign);

    gl_FragColor = vec4(col, 1.0);
  }
`;

function LyricsShader({ intensity }: { intensity: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { getAnalyser } = useAudioAnalyser();
  const freqRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const smoothed = useRef({ bass: 0, mid: 0, treble: 0, intensity: 0 });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBass: { value: 0 },
      uMid: { value: 0 },
      uTreble: { value: 0 },
      uIntensity: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    }),
    [],
  );

  useFrame(({ clock, size }) => {
    if (!matRef.current) return;
    const analyser = getAnalyser();

    let bass = 0;
    let mid = 0;
    let treble = 0;

    if (analyser) {
      if (
        !freqRef.current ||
        freqRef.current.length !== analyser.frequencyBinCount
      ) {
        freqRef.current = new Uint8Array(
          new ArrayBuffer(analyser.frequencyBinCount),
        );
      }
      analyser.getByteFrequencyData(freqRef.current);
      const data = freqRef.current;
      const len = data.length;
      const bassEnd = Math.floor(len * 0.08);
      const midEnd = Math.floor(len * 0.35);

      let bSum = 0,
        mSum = 0,
        tSum = 0;
      for (let i = 0; i < bassEnd; i++) bSum += data[i];
      for (let i = bassEnd; i < midEnd; i++) mSum += data[i];
      for (let i = midEnd; i < len; i++) tSum += data[i];

      bass = bSum / Math.max(1, bassEnd) / 255;
      mid = mSum / Math.max(1, midEnd - bassEnd) / 255;
      treble = tSum / Math.max(1, len - midEnd) / 255;
    }

    smoothed.current.bass += (bass - smoothed.current.bass) * 0.16;
    smoothed.current.mid += (mid - smoothed.current.mid) * 0.12;
    smoothed.current.treble += (treble - smoothed.current.treble) * 0.20;
    smoothed.current.intensity +=
      (intensity - smoothed.current.intensity) * 0.18;

    const u = matRef.current.uniforms;
    u.uTime.value = clock.getElapsedTime();
    u.uBass.value = smoothed.current.bass;
    u.uMid.value = smoothed.current.mid;
    u.uTreble.value = smoothed.current.treble;
    u.uIntensity.value = smoothed.current.intensity;
    u.uResolution.value.set(size.width, size.height);
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function LyricsVisualizer({
  intensity = 0,
  className = "",
}: {
  /** 0..1 — boosted when a lyric line just became active. */
  intensity?: number;
  className?: string;
}) {
  return (
    <div className={`absolute inset-0 ${className}`} aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 1] }}
      >
        <LyricsShader intensity={intensity} />
      </Canvas>
    </div>
  );
}
