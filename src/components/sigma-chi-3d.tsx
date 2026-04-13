"use client";

import { useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Helper: trace a closed polygon with optional rounded corners.
// ---------------------------------------------------------------------------
function traceShape(
  vertices: [number, number][],
  radius: number,
): THREE.Shape {
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

    if (i === 0) {
      s.moveTo(p1x, p1y);
    } else {
      s.lineTo(p1x, p1y);
    }
    if (r > 0.001) {
      s.quadraticCurveTo(curr[0], curr[1], p2x, p2y);
    }
  }
  s.closePath();
  return s;
}

// ---------------------------------------------------------------------------
// Σ (Sigma) — serif-style with rectangular flares at bar terminals.
// ---------------------------------------------------------------------------
function createSigmaShape(): THREE.Shape {
  const th = 0.28; // bar thickness (thinner for serif contrast)
  const sw = 0.08; // serif width extension
  const sh = 0.045; // serif height extension

  return traceShape(
    [
      // Top-left corner
      [0, 3],
      // Top bar → right end
      [2.1, 3],
      // Top-right serif
      [2.1, 3 + sh],
      [2.1 + sw, 3 + sh],
      [2.1 + sw, 3 - th - sh],
      [2.1, 3 - th - sh],
      // Inner top bar edge
      [2.1, 3 - th],
      [th + 0.18, 3 - th],
      // Center peak (outer)
      [1.05, 1.5],
      // Inner bottom bar edge
      [th + 0.18, th],
      [2.1, th],
      // Bottom-right serif
      [2.1, th + sh],
      [2.1 + sw, th + sh],
      [2.1 + sw, -sh],
      [2.1, -sh],
      // Bottom bar
      [2.1, 0],
      [0, 0],
      // Center peak (inner)
      [1.05 - th * 0.3, 1.5],
    ],
    0.025,
  );
}

// ---------------------------------------------------------------------------
// Χ (Chi) — serif-style with flared arm tips.
// ---------------------------------------------------------------------------
function createChiShape(): THREE.Shape {
  const hw = 0.25;
  const sq = Math.sqrt(13);
  const dx = (hw * 3) / sq;
  const dy = (hw * 2) / sq;

  // Serif extension at arm tips — small perpendicular widening
  const sf = 0.06;

  // Center intersections
  const cTop: [number, number] = [1.0, 1.5 + (3 * hw * 2) / sq];
  const cBot: [number, number] = [1.0, 1.5 - (3 * hw * 2) / sq];
  const cLeft: [number, number] = [1.0 - (2 * hw * 2) / sq, 1.5];
  const cRight: [number, number] = [1.0 + (2 * hw * 2) / sq, 1.5];

  return traceShape(
    [
      // TL arm with serif flare (wider at tip)
      [-dx - sf, 3 - dy + sf * 0.3],
      [dx + sf, 3 + dy - sf * 0.3],
      cTop,
      // TR arm with serif flare
      [2 - dx - sf, 3 + dy - sf * 0.3],
      [2 + dx + sf, 3 - dy + sf * 0.3],
      cRight,
      // BR arm with serif flare
      [2 + dx + sf, dy - sf * 0.3],
      [2 - dx - sf, -dy + sf * 0.3],
      cBot,
      // BL arm with serif flare
      [dx + sf, -dy + sf * 0.3],
      [-dx - sf, dy - sf * 0.3],
      cLeft,
    ],
    0.03,
  );
}

const extrudeSettings: THREE.ExtrudeGeometryOptions = {
  depth: 0.5,
  bevelEnabled: true,
  bevelThickness: 0.06,
  bevelSize: 0.04,
  bevelSegments: 2,
  curveSegments: 6,
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
        color: new THREE.Color("hsl(220, 45%, 35%)"),
        metalness: 0.5,
        roughness: 0.45,
        emissive: new THREE.Color("hsl(220, 40%, 12%)"),
        emissiveIntensity: 0.3,
      }),
    [],
  );

  const edgeMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color("hsl(215, 50%, 45%)"),
        transparent: true,
        opacity: 0.2,
      }),
    [],
  );

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <group position={[-2.8, -1.5, -0.25]}>
        <mesh geometry={sigmaGeo} material={material} />
        <lineSegments
          geometry={new THREE.EdgesGeometry(sigmaGeo, 15)}
          material={edgeMaterial}
        />
      </group>

      <group position={[0.35, -1.5, -0.25]}>
        <mesh geometry={chiGeo} material={material} />
        <lineSegments
          geometry={new THREE.EdgesGeometry(chiGeo, 15)}
          material={edgeMaterial}
        />
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
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.7} />
        <directionalLight
          position={[-3, -2, 4]}
          intensity={0.25}
          color="hsl(210, 60%, 50%)"
        />
        <Letters />
      </Canvas>

      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background/60 to-transparent" />
    </div>
  );
}
