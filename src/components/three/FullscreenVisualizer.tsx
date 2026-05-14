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
  uniform vec2 uResolution;

  const vec3 NEON = vec3(0.447, 0.996, 0.561);

  void main() {
    vec2 uv = (vUv * 2.0 - 1.0);
    uv.x *= uResolution.x / uResolution.y;

    float d = length(uv);

    // Radial bass-reactive glow (centered)
    float glow = exp(-d * (2.2 - uBass * 1.2)) * (0.45 + uBass * 0.85);

    // Slow ambient pulse so it breathes even without audio
    float ambient = 0.5 + 0.5 * sin(uTime * 0.7);
    glow += exp(-d * 4.0) * 0.15 * ambient;

    // Subtle vertical gradient (darker top, hint of color at bottom)
    float vGrad = smoothstep(-0.2, 1.2, uv.y);

    vec3 col = mix(vec3(0.018, 0.02, 0.025), NEON * 0.08, vGrad);
    col += NEON * glow;

    // Soft vignette
    col *= smoothstep(1.6, 0.3, d);

    gl_FragColor = vec4(col, 1.0);
  }
`;

function MinimalShader() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { getAnalyser } = useAudioAnalyser();
  const freqRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const smoothedBass = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBass: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    }),
    [],
  );

  useFrame(({ clock, size }) => {
    if (!matRef.current) return;
    const analyser = getAnalyser();
    let bass = 0;

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
      const bassEnd = Math.floor(data.length * 0.1);
      let sum = 0;
      for (let i = 0; i < bassEnd; i++) sum += data[i];
      bass = sum / Math.max(1, bassEnd) / 255;
    }

    smoothedBass.current += (bass - smoothedBass.current) * 0.18;

    matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    matRef.current.uniforms.uBass.value = smoothedBass.current;
    matRef.current.uniforms.uResolution.value.set(size.width, size.height);
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

export default function FullscreenVisualizer({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`absolute inset-0 ${className}`} aria-hidden>
      <Canvas
        dpr={[1, 1.25]}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 1] }}
      >
        <MinimalShader />
      </Canvas>
    </div>
  );
}
