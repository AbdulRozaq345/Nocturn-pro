"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useAudioAnalyser } from "@/context/AudioAnalyserContext";

const HERO_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const HERO_FRAGMENT = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform vec2 uResolution;

  // Neon accent matching the app theme #72fe8f
  const vec3 NEON = vec3(0.447, 0.996, 0.561);

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Cyberpunk perspective grid
  float perspectiveGrid(vec2 uv, float time, float bass) {
    // Project to floor coordinates (foreshortened y)
    vec2 p = uv;
    p.y = 1.0 / (abs(p.y) + 0.01);
    p.x *= p.y;

    // Scrolling lines
    p.y += time * 1.5 + bass * 2.0;

    vec2 grid = abs(fract(p * vec2(2.5, 1.2)) - 0.5);
    float line = smoothstep(0.48, 0.5, max(grid.x, grid.y));

    // Fade the lines into the distance
    float depthFade = smoothstep(0.0, 0.4, uv.y + 0.2);
    return (1.0 - line) * depthFade;
  }

  // Radial pulsing glow
  float radialGlow(vec2 uv, float time, float bass) {
    float d = length(uv);
    float core = exp(-d * (3.5 - bass * 1.5));
    float pulse = sin(time * 2.0 - d * 6.0) * 0.5 + 0.5;
    return core * (0.4 + pulse * 0.4 + bass * 0.6);
  }

  // Scanlines
  float scanlines(vec2 uv, float time) {
    return 0.92 + 0.08 * sin(uv.y * uResolution.y * 1.5 + time * 4.0);
  }

  // Chromatic noise specks
  float noiseSparkle(vec2 uv, float time) {
    vec2 cell = floor(uv * 80.0);
    float n = hash(cell + floor(time * 4.0));
    return step(0.985, n);
  }

  void main() {
    // Aspect-correct centered UV
    vec2 uv = (vUv * 2.0 - 1.0);
    uv.x *= uResolution.x / uResolution.y;

    // Lower half = floor grid, upper half darker sky
    float floorMask = smoothstep(-0.1, 0.0, -uv.y);
    float gridStrength = perspectiveGrid(uv, uTime, uBass) * floorMask;

    // Background gradient (deep navy/black with hint of green at horizon)
    vec3 sky = mix(
      vec3(0.012, 0.014, 0.02),
      NEON * 0.18,
      smoothstep(0.0, 0.3, -uv.y + 0.15) * (0.6 + uMid * 0.4)
    );
    sky *= mix(1.0, 0.45, smoothstep(-0.05, 0.6, -uv.y));

    // Horizon sun
    float sun = smoothstep(0.5, 0.1, abs(uv.y + 0.05)) *
                smoothstep(0.6, 0.0, abs(uv.x)) *
                (0.7 + uTreble * 0.5);

    // Compose
    vec3 col = sky;
    col += NEON * gridStrength * 0.55;
    col += NEON * sun * 0.25;
    col += NEON * radialGlow(uv, uTime, uBass) * 0.18;
    col += vec3(1.0) * noiseSparkle(vUv, uTime) * 0.4 * (0.5 + uTreble);

    // Subtle scanlines + vignette
    col *= scanlines(vUv, uTime);
    float vignette = smoothstep(1.4, 0.4, length(uv));
    col *= vignette;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function HeroShader() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { getAnalyser } = useAudioAnalyser();
  const freqRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const smoothed = useRef({ bass: 0, mid: 0, treble: 0 });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBass: { value: 0 },
      uMid: { value: 0 },
      uTreble: { value: 0 },
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

      let bSum = 0;
      let mSum = 0;
      let tSum = 0;
      for (let i = 0; i < bassEnd; i++) bSum += data[i];
      for (let i = bassEnd; i < midEnd; i++) mSum += data[i];
      for (let i = midEnd; i < len; i++) tSum += data[i];

      bass = bSum / Math.max(1, bassEnd) / 255;
      mid = mSum / Math.max(1, midEnd - bassEnd) / 255;
      treble = tSum / Math.max(1, len - midEnd) / 255;
    }

    // Smooth toward target untuk gerakan halus
    smoothed.current.bass += (bass - smoothed.current.bass) * 0.18;
    smoothed.current.mid += (mid - smoothed.current.mid) * 0.12;
    smoothed.current.treble += (treble - smoothed.current.treble) * 0.2;

    matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    matRef.current.uniforms.uBass.value = smoothed.current.bass;
    matRef.current.uniforms.uMid.value = smoothed.current.mid;
    matRef.current.uniforms.uTreble.value = smoothed.current.treble;
    matRef.current.uniforms.uResolution.value.set(size.width, size.height);
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={HERO_VERTEX}
        fragmentShader={HERO_FRAGMENT}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function HeroVisualizer({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`absolute inset-0 ${className}`} aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 1] }}
      >
        <HeroShader />
      </Canvas>
    </div>
  );
}
