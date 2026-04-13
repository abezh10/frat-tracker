"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";

function fibSpherePoints(count: number, radius: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    pts.push(
      new THREE.Vector3(
        Math.cos(theta) * r * radius,
        y * radius,
        Math.sin(theta) * r * radius,
      ),
    );
  }
  return pts;
}

function createArcPoints(
  a: THREE.Vector3,
  b: THREE.Vector3,
  radius: number,
  segments = 48,
): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const v = new THREE.Vector3()
      .lerpVectors(a, b, t)
      .normalize()
      .multiplyScalar(radius * 1.02);
    const lift = Math.sin(t * Math.PI) * 0.25;
    v.multiplyScalar(1 + lift);
    pts.push([v.x, v.y, v.z]);
  }
  return pts;
}

function Globe({ opacity = 1 }: { opacity?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const RADIUS = 2;

  const surfacePoints = useMemo(() => fibSpherePoints(120, RADIUS), []);

  const arcs = useMemo(() => {
    const pairs: [THREE.Vector3, THREE.Vector3][] = [];
    const used = new Set<string>();
    for (let i = 0; i < 14; i++) {
      let a: number, b: number;
      do {
        a = Math.floor(Math.random() * surfacePoints.length);
        b = Math.floor(Math.random() * surfacePoints.length);
      } while (a === b || used.has(`${a}-${b}`));
      used.add(`${a}-${b}`);
      used.add(`${b}-${a}`);
      pairs.push([surfacePoints[a], surfacePoints[b]]);
    }
    return pairs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wireframeMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("hsl(258, 70%, 50%)"),
        wireframe: true,
        transparent: true,
        opacity: 0.12 * opacity,
      }),
    [opacity],
  );

  const dotMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("hsl(210, 90%, 70%)"),
        transparent: true,
        opacity: 0.7 * opacity,
      }),
    [opacity],
  );

  const arcColor = "hsl(258, 80%, 65%)";

  const ringMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("hsl(258, 60%, 45%)"),
        wireframe: true,
        transparent: true,
        opacity: 0.18 * opacity,
        side: THREE.DoubleSide,
      }),
    [opacity],
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.08;
    groupRef.current.rotation.x =
      Math.sin(clock.getElapsedTime() * 0.04) * 0.1;
  });

  const dotGeo = useMemo(() => new THREE.SphereGeometry(0.025, 6, 6), []);

  return (
    <group ref={groupRef}>
      <mesh material={wireframeMat}>
        <sphereGeometry args={[RADIUS, 32, 32]} />
      </mesh>

      {surfacePoints.map((pt, i) => (
        <mesh key={i} position={pt} geometry={dotGeo} material={dotMat} />
      ))}

      {arcs.map(([a, b], i) => (
        <Line
          key={`arc-${i}`}
          points={createArcPoints(a, b, RADIUS)}
          color={arcColor}
          transparent
          opacity={0.35 * opacity}
          lineWidth={1}
        />
      ))}

      <mesh material={ringMat} rotation={[Math.PI / 2.4, 0.15, 0]}>
        <torusGeometry args={[RADIUS * 1.5, 0.015, 8, 80]} />
      </mesh>
      <mesh material={ringMat} rotation={[Math.PI / 2.1, -0.25, 0.3]}>
        <torusGeometry args={[RADIUS * 1.7, 0.01, 8, 90]} />
      </mesh>
      <mesh material={ringMat} rotation={[Math.PI / 2.6, 0.4, -0.15]}>
        <torusGeometry args={[RADIUS * 1.35, 0.008, 6, 70]} />
      </mesh>
    </group>
  );
}

export function GlobeScene({ opacity = 1 }: { opacity?: number }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.5]}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.3} />
      <pointLight
        position={[5, 3, 5]}
        intensity={0.5}
        color="hsl(258, 80%, 65%)"
      />
      <Globe opacity={opacity} />
    </Canvas>
  );
}
