// src/views/market/components/Sections/Hero/useTypewriter.ts
import { useEffect, useState } from "react";

export function useTypewriter(text: string, speed = 24) {
  const [out, setOut] = useState("");
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 1000 / speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return out;
}
