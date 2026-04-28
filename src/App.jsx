import { lazy, Suspense, useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { TopBar, useTheme } from "./components.jsx";
import { Landing } from "./screens/Landing.jsx";
import { Converter } from "./screens/Converter.jsx";

const Batch = lazy(() => import("./screens/Batch.jsx").then((m) => ({ default: m.Batch })));
const Docs = lazy(() => import("./screens/Docs.jsx").then((m) => ({ default: m.Docs })));

const ACCENT_HUE = 145;
const ACCENT_CHROMA = 0.11;
const SERIF = "Playfair Display";

const ORIGIN = "https://vectorio.app";
const ROUTE_META = {
  "/": {
    title: "Vectorio — SVGs to React, Vue, Svelte, Solid components",
    desc: "Paste messy SVG, ship a clean icon library. Multi-framework components, Figma/Sketch cleaner, and folder-to-library batch mode — entirely in your browser.",
    image: "/og-image.png",
    imageType: "image/png",
    imageWidth: "1200",
    imageHeight: "630",
    imageAlt: "Vectorio — Convert SVGs into clean components.",
  },
  "/convert": {
    title: "Convert SVG to React, Vue, Svelte, Solid component — Vectorio",
    desc: "Paste or drop an SVG. Get a clean, typed component for React, Vue, Svelte, or Solid — with auto-detected props and a live preview. No CLI, no account.",
    image: "/converter.jpg",
    imageType: "image/jpeg",
    imageWidth: "1280",
    imageHeight: "630",
    imageAlt: "Vectorio Converter screen with SVG preview and generated component output.",
  },
  "/batch": {
    title: "SVG icon library generator — Vectorio",
    desc: "Drop a folder of SVGs. Vectorio bundles them into a tree-shakable icon library with typed components, package.json, and README. Runs in your browser.",
    image: "/batch.jpg",
    imageType: "image/jpeg",
    imageWidth: "1232",
    imageHeight: "720",
    imageAlt: "Vectorio Batch screen generating an icon library from multiple SVG files.",
  },
  "/docs": {
    title: "Documentation — Vectorio",
    desc: "How Vectorio converts, cleans, and ships SVG icons. Options reference, input methods, what the cleaner removes, share link mechanics, and privacy details.",
    image: "/og-image.png",
    imageType: "image/png",
    imageWidth: "1200",
    imageHeight: "630",
    imageAlt: "Vectorio — Convert SVGs into clean components.",
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
    const image = ORIGIN + meta.image;
    document.title = meta.title;
    setMetaContent('meta[name="description"]', meta.desc);
    setMetaContent('meta[property="og:title"]', meta.title);
    setMetaContent('meta[property="og:description"]', meta.desc);
    setMetaContent('meta[property="og:url"]', canonical);
    setMetaContent('meta[property="og:image"]', image);
    setMetaContent('meta[property="og:image:type"]', meta.imageType);
    setMetaContent('meta[property="og:image:width"]', meta.imageWidth);
    setMetaContent('meta[property="og:image:height"]', meta.imageHeight);
    setMetaContent('meta[property="og:image:alt"]', meta.imageAlt);
    setMetaContent('meta[name="twitter:title"]', meta.title);
    setMetaContent('meta[name="twitter:description"]', meta.desc);
    setMetaContent('meta[name="twitter:url"]', canonical);
    setMetaContent('meta[name="twitter:image"]', image);
    setMetaContent('meta[name="twitter:image:alt"]', meta.imageAlt);
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
      <Suspense fallback={<RouteSkeleton view={view} />}>
        {view === "batch" && <Batch />}
        {view === "docs" && <Docs setView={setView} />}
      </Suspense>
      <Analytics />
    </div>
  );
}

function RouteSkeleton({ view }) {
  if (view === "docs") {
    return (
      <div className="docs-skeleton" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading documentation</span>
        <aside className="docs-skeleton-toc" aria-hidden="true">
          <div className="sk-line tiny" />
          {Array.from({ length: 9 }, (_, i) => (
            <div className="sk-line toc" style={{ width: `${58 + (i % 3) * 10}%` }} key={i} />
          ))}
        </aside>
        <article className="docs-skeleton-content" aria-hidden="true">
          <div className="sk-line eyebrow" />
          <div className="sk-line title" />
          <div className="sk-line title short" />
          <div className="sk-block lead" />
          {Array.from({ length: 3 }, (_, i) => (
            <section className="docs-skeleton-section" key={i}>
              <div className="sk-line heading" />
              <div className="sk-line body" />
              <div className="sk-line body mid" />
              <div className="sk-line body short" />
            </section>
          ))}
        </article>
      </div>
    );
  }

  return (
    <div className="batch-skeleton" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading batch workspace</span>
      <div className="batch-skeleton-head" aria-hidden="true">
        <div>
          <div className="sk-line batch-title" />
          <div className="sk-line batch-title short" />
          <div className="sk-line batch-sub" />
          <div className="sk-line batch-sub mid" />
        </div>
        <div className="sk-line batch-meta" />
      </div>
      <div className="batch-skeleton-drop" aria-hidden="true">
        <div>
          <div className="sk-line drop-lead" />
          <div className="sk-line drop-hint" />
        </div>
        <div className="sk-line drop-action" />
      </div>
      <div className="batch-skeleton-stats" aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <div className="batch-skeleton-stat" key={i}>
            <div className="sk-line stat-key" />
            <div className="sk-line stat-value" />
          </div>
        ))}
      </div>
      <div className="batch-skeleton-toolbar" aria-hidden="true">
        <div className="sk-line toolbar-title" />
        <div className="sk-line toolbar-tabs" />
      </div>
      <div className="batch-skeleton-empty" aria-hidden="true">
        <div className="sk-line empty-title" />
        <div className="sk-line empty-sub" />
        <div className="sk-line empty-link" />
      </div>
    </div>
  );
}
