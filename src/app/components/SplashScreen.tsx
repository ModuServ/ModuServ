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
    <>
    <style>{`@keyframes ms-splash-spin { to { transform: rotate(360deg); } } @keyframes ms-splash-pulse { 0%,100%{transform:scale(1);filter:drop-shadow(0 0 0px rgba(26,115,232,0))} 50%{transform:scale(1.08);filter:drop-shadow(0 0 18px rgba(26,115,232,0.35))} }`}</style>
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
      <div className="ms-splash__content" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          className="ms-splash__logo-wrap"
          style={{ width: 160, height: 160, marginBottom: "1.5rem", flexShrink: 0 }}
        >
          <img src={logo} alt="ModuServ" className="ms-splash__logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <h1
          className="ms-splash__brand"
          style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "2.5rem", fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", margin: "0 0 0.5rem" }}
        >
          Moduserv
        </h1>
        <p
          className="ms-splash__tagline"
          style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: "0.9rem", fontWeight: 400, color: "#9ca3af", margin: "0 0 2rem" }}
        >
          Modular Infrastructure. Infinite Scale.
        </p>
        <div style={{ opacity: 1 }}>
          <div style={{
            width: 28,
            height: 28,
            border: "2.5px solid #e5e7eb",
            borderTopColor: "#1a73e8",
            borderRadius: "50%",
            animation: "ms-splash-spin 0.9s linear infinite",
          }} />
        </div>
      </div>
    </div>
    </>
  );
}
