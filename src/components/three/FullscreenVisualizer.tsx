"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useAudioAnalyser } from "@/context/AudioAnalyserContext";

const NEON = new THREE.Color("#72fe8f");

const SPHERE_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPos;

  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;

  // Pseudo 3D noise (simplex-ish, cheap)
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  void main() {
    vec3 p = position;
    float n = snoise(p * 1.2 + vec3(uTime * 0.35));
    float n2 = snoise(p * 3.0 + vec3(uTime * 0.7));

    // Bass nendang radius, mid + treble bikin detail
    float disp = n * (0.25 + uBass * 0.9) + n2 * (0.08 + uTreble * 0.35);
    vec3 displaced = p + normal * disp;

    vNormal = normalize(normalMatrix * normal);
    vPos = displaced;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const SPHERE_FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec3 vNormal;
  varying vec3 vPos;

  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform vec3 uColor;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vPos);
    float fresnel = pow(1.0 - max(0.0, dot(viewDir, vNormal)), 2.5);

    // Inner core fades toward edge, fresnel adds rim glow
    vec3 base = uColor * (0.35 + uMid * 0.4);
    vec3 rim = uColor * fresnel * (1.6 + uBass * 1.4);

    // Soft animated stripes
    float stripes = 0.5 + 0.5 * sin(vPos.y * 8.0 + uTime * 1.5);
    base *= 0.6 + 0.4 * stripes;

    vec3 col = base + rim;
    gl_FragColor = vec4(col, 0.92);
  }
`;

function ReactiveCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const wireMatRef = useRef<THREE.ShaderMaterial>(null);
  const { getAnalyser } = useAudioAnalyser();
  const freqRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const smoothed = useRef({ bass: 0, mid: 0, treble: 0 });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBass: { value: 0 },
      uMid: { value: 0 },
      uTreble: { value: 0 },
      uColor: { value: NEON.clone() },
    }),
    [],
  );

  const wireUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBass: { value: 0 },
      uMid: { value: 0 },
      uTreble: { value: 0 },
      uColor: { value: NEON.clone() },
    }),
    [],
  );

  useFrame(({ clock }) => {
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

    smoothed.current.bass += (bass - smoothed.current.bass) * 0.2;
    smoothed.current.mid += (mid - smoothed.current.mid) * 0.15;
    smoothed.current.treble += (treble - smoothed.current.treble) * 0.25;

    const t = clock.getElapsedTime();

    if (matRef.current) {
      matRef.current.uniforms.uTime.value = t;
      matRef.current.uniforms.uBass.value = smoothed.current.bass;
      matRef.current.uniforms.uMid.value = smoothed.current.mid;
      matRef.current.uniforms.uTreble.value = smoothed.current.treble;
    }
    if (wireMatRef.current) {
      wireMatRef.current.uniforms.uTime.value = t;
      wireMatRef.current.uniforms.uBass.value = smoothed.current.bass;
      wireMatRef.current.uniforms.uMid.value = smoothed.current.mid;
      wireMatRef.current.uniforms.uTreble.value = smoothed.current.treble;
    }

    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.15;
      meshRef.current.rotation.y = t * 0.25;
      const scale = 1 + smoothed.current.bass * 0.15;
      meshRef.current.scale.setScalar(scale);
    }
    if (wireRef.current) {
      wireRef.current.rotation.x = -t * 0.2;
      wireRef.current.rotation.y = t * 0.18;
      const scale = 1.08 + smoothed.current.bass * 0.18;
      wireRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1, 24]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={SPHERE_VERTEX}
          fragmentShader={SPHERE_FRAGMENT}
          uniforms={uniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[1, 8]} />
        <shaderMaterial
          ref={wireMatRef}
          vertexShader={SPHERE_VERTEX}
          fragmentShader={SPHERE_FRAGMENT}
          uniforms={wireUniforms}
          wireframe
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const { getAnalyser } = useAudioAnalyser();
  const freqRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const { geometry, material } = useMemo(() => {
    const COUNT = 1200;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      // Spread in a thick spherical shell around the core
      const r = 2.2 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: NEON.clone(),
      size: 0.035,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return { geometry: geom, material: mat };
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.05;
    pointsRef.current.rotation.x += delta * 0.02;

    const analyser = getAnalyser();
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
      let bass = 0;
      const bassEnd = Math.floor(freqRef.current.length * 0.08);
      for (let i = 0; i < bassEnd; i++) bass += freqRef.current[i];
      bass = bass / Math.max(1, bassEnd) / 255;
      (material as THREE.PointsMaterial).size = 0.03 + bass * 0.06;
      (material as THREE.PointsMaterial).opacity = 0.55 + bass * 0.45;
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

export default function FullscreenVisualizer({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`absolute inset-0 ${className}`} aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 4.5], fov: 55 }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[3, 3, 3]} intensity={1.2} color="#72fe8f" />
        <ReactiveCore />
        <ParticleField />
      </Canvas>
    </div>
  );
}
