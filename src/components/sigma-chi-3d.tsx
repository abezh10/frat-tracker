"use client";

import { useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function traceShape(vertices: [number, number][], radius: number): THREE.Shape {
  const s = new THREE.Shape();
  const len = vertices.length;

  for (let i = 0; i < len; i++) {
    const prev = vertices[(i - 1 + len) % len];
    const curr = vertices[i];
    const next = vertices[(i + 1) % len];

    const toPrev = [prev[0] - curr[0], prev[1] - curr[1]];
    const toNext = [next[0] - curr[0], next[1] - curr[1]];
    const dPrev = Math.hypot(toPrev[0], toPrev[1]);
    const dNext = Math.hypot(toNext[0], toNext[1]);

    const r = Math.min(radius, dPrev / 3, dNext / 3);

    const p1x = curr[0] + (toPrev[0] / dPrev) * r;
    const p1y = curr[1] + (toPrev[1] / dPrev) * r;
    const p2x = curr[0] + (toNext[0] / dNext) * r;
    const p2y = curr[1] + (toNext[1] / dNext) * r;

    if (i === 0) s.moveTo(p1x, p1y);
    else s.lineTo(p1x, p1y);
    if (r > 0.001) s.quadraticCurveTo(curr[0], curr[1], p2x, p2y);
  }
  s.closePath();
  return s;
}

// ---------------------------------------------------------------------------
// Σ  –  full-width top/bottom bars, right-end serifs, thick diagonal strokes
//       whose inner edges meet at a deep inner vertex.
// ---------------------------------------------------------------------------
function createSigmaShape(): THREE.Shape {
  const w = 2.1;
  const h = 3.0;
  const th = 0.36;
  const sw = 0.07;
  const sh = 0.04;

  // Outer vertex – where the two outer diagonal edges meet (the > tip)
  const ovx = 0.9;
  // Inner vertex – where the two inner diagonal edges meet (deeper into letter)
  const ivx = 1.25;
  // Inner bar junction – where inner diagonal meets inner bar edge
  const ijx = 0.55;

  return traceShape(
    [
      [0, h],
      [w, h],
      [w, h + sh],
      [w + sw, h + sh],
      [w + sw, h - th - sh],
      [w, h - th - sh],
      [w, h - th],
      [ijx, h - th],
      [ivx, h / 2],
      [ijx, th],
      [w, th],
      [w, th + sh],
      [w + sw, th + sh],
      [w + sw, -sh],
      [w, -sh],
      [w, 0],
      [0, 0],
      [ovx, h / 2],
    ],
    0.02,
  );
}

// ---------------------------------------------------------------------------
// Χ  –  12-vertex X with straight edges from serif tips to center vertices.
//       No step-down kinks; every inner edge is a single clean line.
// ---------------------------------------------------------------------------
function createChiShape(): THREE.Shape {
  const w = 2.2;
  const h = 3.0;
  const cx = w / 2;
  const cy = h / 2;
  const hw = 0.22;
  const armLen = Math.hypot(cx, cy);

  // Serif half-width at each arm tip
  const sfw = 0.30;

  // Center diamond vertices (where adjacent arm inner edges intersect)
  const cTopY = cy + (2 * hw * cy) / armLen + 0.08;
  const cBotY = cy - (2 * hw * cy) / armLen - 0.08;
  const cRightX = cx + (2 * hw * cx) / armLen + 0.06;
  const cLeftX = cx - (2 * hw * cx) / armLen - 0.06;

  return traceShape(
    [
      [-sfw, h],
      [sfw, h],
      [cx, cTopY],
      [w - sfw, h],
      [w + sfw, h],
      [cRightX, cy],
      [w + sfw, 0],
      [w - sfw, 0],
      [cx, cBotY],
      [sfw, 0],
      [-sfw, 0],
      [cLeftX, cy],
    ],
    0.02,
  );
}

const extrudeSettings: THREE.ExtrudeGeometryOptions = {
  depth: 0.45,
  bevelEnabled: true,
  bevelThickness: 0.04,
  bevelSize: 0.03,
  bevelSegments: 1,
  curveSegments: 4,
};

function Letters() {
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const { size } = useThree();

  const sigmaGeo = useMemo(
    () => new THREE.ExtrudeGeometry(createSigmaShape(), extrudeSettings),
    [],
  );
  const chiGeo = useMemo(
    () => new THREE.ExtrudeGeometry(createChiShape(), extrudeSettings),
    [],
  );

  const handlePointerMove = useCallback(
    (e: { clientX: number; clientY: number }) => {
      mouse.current.x = (e.clientX / size.width - 0.5) * 2;
      mouse.current.y = -(e.clientY / size.height - 0.5) * 2;
    },
    [size],
  );

  useFrame(() => {
    if (!groupRef.current) return;
    const targetX = mouse.current.y * 0.15;
    const targetY = mouse.current.x * 0.2;
    groupRef.current.rotation.x +=
      (targetX - groupRef.current.rotation.x) * 0.05;
    groupRef.current.rotation.y +=
      (targetY - groupRef.current.rotation.y) * 0.05;
  });

  useThree(({ gl }) => {
    gl.domElement.onpointermove = handlePointerMove;
  });

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("hsl(43, 65%, 52%)"),
        metalness: 0.3,
        roughness: 0.45,
        emissive: new THREE.Color("hsl(43, 55%, 16%)"),
        emissiveIntensity: 0.3,
      }),
    [],
  );

  const edgeMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color("hsl(0, 0%, 90%)"),
        transparent: true,
        opacity: 0.4,
      }),
    [],
  );

  const sigmaEdges = useMemo(
    () => new THREE.EdgesGeometry(sigmaGeo, 20),
    [sigmaGeo],
  );
  const chiEdges = useMemo(
    () => new THREE.EdgesGeometry(chiGeo, 20),
    [chiGeo],
  );

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <group position={[-2.8, -1.5, -0.22]}>
        <mesh geometry={sigmaGeo} material={material} />
        <lineSegments geometry={sigmaEdges} material={edgeMaterial} />
      </group>

      <group position={[0.2, -1.5, -0.22]}>
        <mesh geometry={chiGeo} material={material} />
        <lineSegments geometry={chiEdges} material={edgeMaterial} />
      </group>
    </group>
  );
}

export function SigmaChiLetters3D() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        style={{ pointerEvents: "auto" }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight
          position={[-3, -2, 4]}
          intensity={0.25}
          color="hsl(40, 60%, 70%)"
        />
        <Letters />
      </Canvas>

      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background/60 to-transparent" />
    </div>
  );
}
