import React, { useState, useCallback } from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import SplashScreen from "./app/components/SplashScreen";
import "./styles/global.css";

const CACHE_VERSION = "2";
const storedVersion = localStorage.getItem("moduserv:cacheVersion");
if (storedVersion !== CACHE_VERSION) {
  Object.keys(localStorage)
    .filter((k) => k.startsWith("moduserv:") && k !== "moduserv:cacheVersion")
    .forEach((k) => localStorage.removeItem(k));
  localStorage.setItem("moduserv:cacheVersion", CACHE_VERSION);
}

function Root() {
  const [splashDone, setSplashDone] = useState(false);
  const handleDone = useCallback(() => setSplashDone(true), []);

  return splashDone ? (
    <App />
  ) : (
    <SplashScreen onDone={handleDone} />
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
