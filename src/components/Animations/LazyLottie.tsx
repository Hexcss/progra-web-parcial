import Lottie from "lottie-react";
import { useLottieAnimation } from "../../hooks/useLottieAnimation";

interface LazyLottieProps {
  file: string;
  loop?: boolean;
  autoplay?: boolean;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
}

export function LazyLottie({
  file,
  loop = true,
  autoplay = true,
  width = 260,
  height = 260,
  style,
}: LazyLottieProps) {
  const animationData = useLottieAnimation(file);

  if (!animationData) return null;

  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      style={{ width, height, ...style }}
    />
  );
}
