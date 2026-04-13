"use client";

import { useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Trace a closed polygon with subtle corner rounding.
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
// Σ (Sigma) — matches the reference: full-width bars, right-end serifs,
// diagonal inner strokes meeting at a center vertex.
// ---------------------------------------------------------------------------
function createSigmaShape(): THREE.Shape {
  const w = 2.1;
  const h = 3.0;
  const th = 0.34;
  const sw = 0.08; // right-serif width
  const sh = 0.05; // right-serif height

  return traceShape(
    [
      // Top-left corner
      [0, h],
      // Top bar → right end
      [w, h],
      // Top-right serif (rectangular extension above & below bar end)
      [w, h + sh],
      [w + sw, h + sh],
      [w + sw, h - th - sh],
      [w, h - th - sh],
      // Inner edge of top bar
      [w, h - th],
      [0.48, h - th],
      // Inner vertex (center of the > shape)
      [0.65, h / 2],
      // Inner edge of bottom bar
      [0.48, th],
      [w, th],
      // Bottom-right serif
      [w, th + sh],
      [w + sw, th + sh],
      [w + sw, -sh],
      [w, -sh],
      // Bottom bar
      [w, 0],
      [0, 0],
      // Outer vertex (point of the > shape)
      [1.0, h / 2],
    ],
    0.02,
  );
}

// ---------------------------------------------------------------------------
// Χ (Chi) — serif X with flat horizontal caps at all four arm tips.
// 20 vertices: 4 serif caps (3 verts each) + 4 center intersection vertices
// + 4 inner connections.
// ---------------------------------------------------------------------------
function createChiShape(): THREE.Shape {
  const w = 2.2;
  const h = 3.0;
  const sfw = 0.32; // serif half-width at tips
  const st = 0.12; // serif step height

  // Perpendicular offset of stroke edges (hw = 0.22)
  const hw = 0.22;
  const cx = w / 2;
  const cy = h / 2;
  const armLen = Math.hypot(cx, cy);
  const px = (hw * cy) / armLen;
  const py = (hw * cx) / armLen;

  // Center intersection vertices (where adjacent stroke edges cross)
  const cTopY = cy + (2 * hw * cy) / armLen + py * 0.6;
  const cBotY = cy - (2 * hw * cy) / armLen - py * 0.6;
  const cRightX = cx + (2 * hw * cx) / armLen + px * 0.6;
  const cLeftX = cx - (2 * hw * cx) / armLen - px * 0.6;

  return traceShape(
    [
      // TL arm — flat horizontal serif cap
      [-sfw, h],
      [sfw, h],
      [px + 0.02, h - st],
      // Center top
      [cx, cTopY],
      // TR arm
      [w - px - 0.02, h - st],
      [w - sfw, h],
      [w + sfw, h],
      [w + px + 0.02, h - st],
      // Center right
      [cRightX, cy],
      // BR arm
      [w + px + 0.02, st],
      [w + sfw, 0],
      [w - sfw, 0],
      [w - px - 0.02, st],
      // Center bottom
      [cx, cBotY],
      // BL arm
      [px + 0.02, st],
      [sfw, 0],
      [-sfw, 0],
      [-px - 0.02, st],
      // Center left
      [cLeftX, cy],
      [-px - 0.02, h - st],
    ],
    0.02,
  );
}

const extrudeSettings: THREE.ExtrudeGeometryOptions = {
  depth: 0.5,
  bevelEnabled: true,
  bevelThickness: 0.05,
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

  // Gold fill — matching reference
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("hsl(43, 65%, 52%)"),
        metalness: 0.35,
        roughness: 0.4,
        emissive: new THREE.Color("hsl(43, 55%, 18%)"),
        emissiveIntensity: 0.35,
      }),
    [],
  );

  // White outline — matching reference border
  const edgeMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color("hsl(0, 0%, 92%)"),
        transparent: true,
        opacity: 0.55,
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

      <group position={[0.2, -1.5, -0.25]}>
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
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight
          position={[-3, -2, 4]}
          intensity={0.3}
          color="hsl(40, 60%, 70%)"
        />
        <Letters />
      </Canvas>

      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background/60 to-transparent" />
    </div>
  );
}
