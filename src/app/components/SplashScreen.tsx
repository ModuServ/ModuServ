import { useEffect, useRef, useState } from "react";
import logo from "../../assets/Favicon_V2.png";
import "./SplashScreen.css";

type Props = {
  onDone: () => void;
};

const MIN_DISPLAY_MS = 5000;
const FADE_MS = 500;
const FALLBACK_MS = 5500;

export default function SplashScreen({ onDone }: Props) {
  const [fading, setFading] = useState(false);
  const startRef = useRef(Date.now());
  const doneCalledRef = useRef(false);

  const triggerDone = () => {
    if (doneCalledRef.current) return;
    doneCalledRef.current = true;

    const elapsed = Date.now() - startRef.current;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

    setTimeout(() => {
      setFading(true);
      setTimeout(onDone, FADE_MS);
    }, remaining);
  };

  useEffect(() => {
    window.addEventListener("moduserv:ready", triggerDone);
    const fallback = setTimeout(triggerDone, FALLBACK_MS);
    return () => {
      window.removeEventListener("moduserv:ready", triggerDone);
      clearTimeout(fallback);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`ms-splash${fading ? " ms-splash--fade" : ""}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        transition: "opacity 0.5s ease, visibility 0.5s ease",
        opacity: fading ? 0 : 1,
        visibility: fading ? "hidden" : "visible",
      }}
    >
      <div className="ms-splash__content">
        <div className="ms-splash__logo-wrap">
          <img src={logo} alt="ModuServ" className="ms-splash__logo" />
        </div>
        <p className="ms-splash__tagline">Modular Service. Total Control.</p>
        <div className="ms-splash__spinner-wrap">
          <div className="ms-splash__spinner" />
        </div>
      </div>
    </div>
  );
}
