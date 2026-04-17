import { useEffect, useState } from "react";
import ModuServLogo from "../branding/ModuServLogo";

type LaunchPhase = "initial" | "fadeout" | "transition";

type LaunchScreenProps = {
  onComplete: () => void;
};

export default function LaunchScreen({ onComplete }: LaunchScreenProps) {
  const [phase, setPhase] = useState<LaunchPhase>("initial");

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase("fadeout"), 400);
    const t2 = window.setTimeout(() => setPhase("transition"), 1200);
    const t3 = window.setTimeout(() => onComplete(), 1800);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className={`launch-screen launch-screen--${phase}`}>
      <div className="launch-screen__bg-glow" style={{ pointerEvents: "none" }} />
      <div className="launch-screen__content">
        <div className={`launch-screen__logo-wrap launch-screen__logo-wrap--${phase}`}>
          <ModuServLogo variant="horizontal" />
        </div>
      </div>
      <div className={`launch-screen__overlay launch-screen__overlay--${phase}`} />
    </div>
  );
}

