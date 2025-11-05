// src/views/market/components/Sections/Hero/HeroParticles.tsx
import { memo, useEffect, useRef, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import type { Engine, ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

export const HeroParticles = memo(function HeroParticles() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);
  const optionsRef = useRef<ISourceOptions>({
    fullScreen: { enable: true, zIndex: 0 },
    detectRetina: true,
    background: { color: { value: "transparent" } },
    fpsLimit: 60,
    particles: {
      number: { value: 30, density: { enable: true, width: 800, height: 800 } },
      color: { value: ["#f39c12", "#e67e22", "#ffb142"] },
      shape: { type: "circle" },
      opacity: { value: { min: 0.2, max: 0.55 } },
      size: { value: { min: 1, max: 4 } },
      links: { enable: true, color: { value: "#f39c12" }, distance: 140, opacity: 0.45, width: 1 },
      move: { enable: true, speed: 0.8, direction: "none", outModes: { default: "out" }, random: true, straight: false },
    },
    interactivity: {
      events: { onHover: { enable: true, mode: "grab" }, resize: { enable: true } },
      modes: { grab: { distance: 170, links: { opacity: 0.7 } } },
    },
  });
  if (!ready) return null;
  return <Particles id="heroParticles" options={optionsRef.current} />;
});
