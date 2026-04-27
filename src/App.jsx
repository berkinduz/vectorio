import { useEffect, useState } from "react";
import { TopBar, useTheme } from "./components.jsx";
import { Landing } from "./screens/Landing.jsx";
import { Converter } from "./screens/Converter.jsx";
import { Batch } from "./screens/Batch.jsx";
import { Docs } from "./screens/Docs.jsx";

const ACCENT_HUE = 145;
const ACCENT_CHROMA = 0.11;
const SERIF = "Playfair Display";

const ORIGIN = "https://vectorio.app";
const ROUTE_META = {
  "/": {
    title: "Vectorio — SVGs to React, Vue, Svelte, Solid components",
    desc: "Paste messy SVG, ship a clean icon library. Multi-framework components, Figma/Sketch cleaner, and folder-to-library batch mode — entirely in your browser.",
  },
  "/convert": {
    title: "Convert SVG to React, Vue, Svelte, Solid component — Vectorio",
    desc: "Paste or drop an SVG. Get a clean, typed component for React, Vue, Svelte, or Solid — with auto-detected props and a live preview. No CLI, no account.",
  },
  "/batch": {
    title: "SVG icon library generator — Vectorio",
    desc: "Drop a folder of SVGs. Vectorio bundles them into a tree-shakable icon library with typed components, package.json, and README. Runs in your browser.",
  },
  "/docs": {
    title: "Documentation — Vectorio",
    desc: "How Vectorio converts, cleans, and ships SVG icons. Options reference, input methods, what the cleaner removes, share link mechanics, and privacy details.",
  },
};

function pathToView(p) {
  if (p === "/convert") return "converter";
  if (p === "/batch") return "batch";
  if (p === "/docs") return "docs";
  return "landing";
}
function viewToPath(v) {
  if (v === "converter") return "/convert";
  if (v === "batch") return "/batch";
  if (v === "docs") return "/docs";
  return "/";
}

function setMetaContent(selector, value) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute("content", value);
}

export default function App() {
  const [path, setPath] = useState(() => {
    if (typeof window === "undefined") return "/";
    // Legacy share links: `/#s=...` → `/convert#s=...`
    if (window.location.pathname === "/" && /^#s=/.test(window.location.hash)) {
      window.history.replaceState(null, "", "/convert" + window.location.hash);
      return "/convert";
    }
    return window.location.pathname in ROUTE_META ? window.location.pathname : "/";
  });
  const [theme, setTheme] = useTheme();

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const meta = ROUTE_META[path] || ROUTE_META["/"];
    const canonical = ORIGIN + path;
    document.title = meta.title;
    setMetaContent('meta[name="description"]', meta.desc);
    setMetaContent('meta[property="og:title"]', meta.title);
    setMetaContent('meta[property="og:description"]', meta.desc);
    setMetaContent('meta[property="og:url"]', canonical);
    setMetaContent('meta[name="twitter:title"]', meta.title);
    setMetaContent('meta[name="twitter:description"]', meta.desc);
    setMetaContent('meta[name="twitter:url"]', canonical);
    const canon = document.head.querySelector('link[rel="canonical"]');
    if (canon) canon.setAttribute("href", canonical);
  }, [path]);

  const navigate = (target) => {
    const next = typeof target === "string" && target.startsWith("/") ? target : viewToPath(target);
    if (next === window.location.pathname) return;
    window.history.pushState(null, "", next);
    setPath(next);
    window.scrollTo(0, 0);
  };
  const setView = (v) => navigate(viewToPath(v));
  const view = pathToView(path);

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
      {view === "landing" && <Landing setView={setView} />}
      {view === "converter" && <Converter />}
      {view === "batch" && <Batch />}
      {view === "docs" && <Docs setView={setView} />}
    </div>
  );
}
