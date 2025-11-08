import { useMemo, useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";
import { useTheme } from "@mui/material";

export default function AnonParticles() {
  const [init, setInit] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));
  }, []);

  const options = useMemo<ISourceOptions>(
    () => ({
      background: {
        color: theme.palette.background.default,
      },
      fpsLimit: 60,
      detectRetina: true,
      particles: {
        number: {
          value: 8,
          density: { enable: true, area: 800 },
        },
        color: {
          value: [
            theme.palette.primary.light,
            theme.palette.primary.main,
            theme.palette.primary.dark,
          ],
        },
        shape: {
          type: "polygon",
          polygon: { sides: 6 },
        },
        opacity: {
          value: 0.15,
          random: true,
          animation: {
            enable: true,
            speed: 0.4,
            minimumValue: 0.05,
            sync: false,
          },
        },
        size: {
          value: 120,
          random: { enable: true, minimumValue: 60 },
          animation: {
            enable: true,
            speed: 2,
            minimumValue: 60,
            sync: false,
          },
        },
        move: {
          enable: true,
          speed: 1.5,
          direction: "none",
          random: false,
          straight: false,
          outModes: { default: "out" },
          attract: { enable: false },
        },
        links: { enable: false },
      },
      interactivity: {
        events: {
          onHover: { enable: false },
          onClick: { enable: false },
        },
      },
    }),
    [theme]
  );

  if (!init) return null;

  return (
    <Particles
      id="anon-particles"
      options={options}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
