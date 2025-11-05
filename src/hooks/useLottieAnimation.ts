import { useState, useEffect } from "react";

export function useLottieAnimation(fileName: string) {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/animations/${fileName}`);
        const json = await res.json();
        if (!cancelled) setAnimationData(json);
      } catch {
        if (!cancelled) setAnimationData(null);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fileName]);

  return animationData;
}
