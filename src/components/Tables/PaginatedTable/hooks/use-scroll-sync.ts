import { useRef, useState } from "react";

export function useScrollSync() {
  const [scrollLeft, setScrollLeft] = useState(0);
  const bodyScrollRef = useRef<HTMLDivElement | null>(null);

  const handleBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft((e.currentTarget as HTMLDivElement).scrollLeft);
  };

  return { scrollLeft, bodyScrollRef, handleBodyScroll };
}
