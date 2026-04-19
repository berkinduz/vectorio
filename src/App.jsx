import { useEffect, useState } from "react";
import { TopBar, useTheme } from "./components.jsx";
import { Landing } from "./screens/Landing.jsx";
import { Converter } from "./screens/Converter.jsx";
import { Batch } from "./screens/Batch.jsx";

const ACCENT_HUE = 145;
const ACCENT_CHROMA = 0.11;
const SERIF = "Playfair Display";

export default function App() {
  const [view, setView] = useState(() => localStorage.getItem("vek-view") || "landing");
  const [theme, setTheme] = useTheme();

  useEffect(() => { localStorage.setItem("vek-view", view); }, [view]);

  useEffect(() => {
    const r = document.documentElement;
    if (theme === "dark") {
      r.style.setProperty("--accent", `oklch(0.72 ${ACCENT_CHROMA} ${ACCENT_HUE})`);
      r.style.setProperty("--accent-soft", `oklch(0.72 ${ACCENT_CHROMA} ${ACCENT_HUE} / 0.12)`);
    } else {
      r.style.setProperty("--accent", `oklch(0.58 ${ACCENT_CHROMA} ${ACCENT_HUE})`);
      r.style.setProperty("--accent-soft", `oklch(0.58 ${ACCENT_CHROMA} ${ACCENT_HUE} / 0.08)`);
    }
    r.style.setProperty("--serif", `"${SERIF}", Georgia, serif`);
  }, [theme]);

  return (
    <div className="app">
      <TopBar
        view={view} setView={setView}
        theme={theme} setTheme={setTheme}
      />
      {view === "landing" && <Landing />}
      {view === "converter" && <Converter />}
      {view === "batch" && <Batch />}
    </div>
  );
}
