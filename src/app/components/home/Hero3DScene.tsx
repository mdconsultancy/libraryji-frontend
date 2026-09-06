"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Brand palette (see public/images/logos/logo.jpeg) — navy + green. */
const NAVY = "#173F8A";
const GREEN = "#36C76C";
const LIGHT = "#7DD6A0";

// Built from raw @react-three/fiber JSX primitives (no @react-three/drei) —
// drei's barrel export evaluates some browser-only modules at import time,
// which crashes Next's server-side "collect page data" step even with this
// scene loaded via `dynamic(..., { ssr: false })`. Rotation/float/orbit are
// each only a few lines of useFrame math, so drei wasn't buying much here.
function BookStack() {
  const group = useRef<THREE.Group>(null);
  const t0 = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.15;
    group.current.position.y = Math.sin(clock.elapsedTime * 0.8 + t0) * 0.12;
  });

  const books = useMemo(
    () => [
      { color: NAVY, y: -0.6, rot: -0.12, w: 2.3 },
      { color: GREEN, y: -0.25, rot: 0.08, w: 2.15 },
      { color: LIGHT, y: 0.1, rot: -0.06, w: 2.0 },
      { color: NAVY, y: 0.45, rot: 0.14, w: 1.85 },
    ],
    []
  );

  return (
    <group ref={group}>
      {books.map((b, i) => (
        <mesh key={i} position={[0, b.y, 0]} rotation={[0, b.rot, 0]}>
          <boxGeometry args={[b.w, 0.28, 1.4]} />
          <meshStandardMaterial color={b.color} roughness={0.35} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

function OrbitRing() {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ring.current) {
      ring.current.rotation.x += delta * 0.2;
      ring.current.rotation.z += delta * 0.12;
    }
  });
  return (
    <mesh ref={ring} rotation={[Math.PI / 2.4, 0, 0]}>
      <torusGeometry args={[2.1, 0.04, 16, 100]} />
      <meshStandardMaterial color={GREEN} roughness={0.2} metalness={0.4} />
    </mesh>
  );
}

function SlowSpin({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.08;
  });
  return <group ref={group}>{children}</group>;
}

/**
 * Purely decorative — the hero's headline/copy/CTAs (the actual SEO content)
 * render as normal server-rendered HTML next to this, never inside it. Kept
 * to primitive geometries (no external model/texture fetch) so it's fast and
 * has nothing that can fail to load.
 */
export default function Hero3DScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.6, 6], fov: 40 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 5, 3]} intensity={1.1} />
      <directionalLight position={[-4, -2, -3]} intensity={0.3} color={GREEN} />

      <SlowSpin>
        <BookStack />
        <OrbitRing />
      </SlowSpin>
    </Canvas>
  );
}
