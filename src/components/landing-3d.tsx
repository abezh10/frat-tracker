"use client";

import dynamic from "next/dynamic";

const SigmaChiLetters3D = dynamic(
  () =>
    import("@/components/sigma-chi-3d").then((mod) => mod.SigmaChiLetters3D),
  { ssr: false },
);

const GlobeScene = dynamic(
  () => import("@/components/globe-scene").then((mod) => mod.GlobeScene),
  { ssr: false },
);

export function LandingHero() {
  return <SigmaChiLetters3D />;
}

export function LandingGlobeBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <GlobeScene opacity={0.5} />
    </div>
  );
}
