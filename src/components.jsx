import { useState, useEffect, useRef, useMemo } from "react";
import { Vek } from "./lib/engine.js";

export const Icon = {
  sun: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  moon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
    </svg>
  ),
  check: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  copy: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  ),
  download: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  ),
  arrow: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  ),
  sliders: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
    </svg>
  ),
};

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem("vek-theme") || "light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("vek-theme", theme);
  }, [theme]);
  return [theme, setTheme];
}

export function TopBar({ view, setView, theme, setTheme }) {
  return (
    <div className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <a className="wordmark" href="#" onClick={(e) => { e.preventDefault(); setView("landing"); }}>
          <span>Vektorio</span>
          <span className="dot" />
        </a>
        <div className="nav">
          <button className={`nav-btn ${view === "landing" ? "active" : ""}`} onClick={() => setView("landing")}>Overview</button>
          <button className={`nav-btn ${view === "converter" ? "active" : ""}`} onClick={() => setView("converter")}>Converter</button>
          <button className={`nav-btn ${view === "batch" ? "active" : ""}`} onClick={() => setView("batch")}>Batch</button>
        </div>
      </div>
      <div className="nav-meta">
        <span>v2.4 · no account required</span>
        <button className="theme-toggle" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle theme">
          {theme === "dark" ? Icon.sun : Icon.moon}
        </button>
      </div>
    </div>
  );
}

export function CodeBlock({ code, lang, changedLines = [] }) {
  const [prev, setPrev] = useState(code);
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    if (code !== prev) {
      setFadeKey((k) => k + 1);
      setPrev(code);
    }
  }, [code, prev]);

  const lines = code.split("\n");
  return (
    <div className="code-wrap">
      <pre className="code" key={fadeKey}>
        {lines.map((l, i) => (
          <span
            key={i}
            className={`ln ${changedLines.includes(i) ? "changed" : ""}`}
            dangerouslySetInnerHTML={{ __html: Vek.highlight(l, lang) || "&nbsp;" }}
          />
        ))}
      </pre>
    </div>
  );
}

export const FRAMEWORKS = [
  { id: "react", label: "React" },
  { id: "vue", label: "Vue" },
  { id: "svelte", label: "Svelte" },
  { id: "solid", label: "Solid" },
];

export function FrameworkTabs({ value, onChange }) {
  return (
    <div className="seg" role="tablist">
      {FRAMEWORKS.map((f) => (
        <button key={f.id} className={value === f.id ? "active" : ""} onClick={() => onChange(f.id)}>
          {f.label}
        </button>
      ))}
    </div>
  );
}

export function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className={`copy-btn ${copied ? "copied" : ""}`}
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); } catch { /* noop */ }
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
    >
      {copied ? Icon.check : Icon.copy}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

export function useConverter(initialSvg) {
  const [source, setSource] = useState(initialSvg || Vek.DEFAULT_SVG);
  const [framework, setFramework] = useState("react");
  const [ts, setTs] = useState(false);
  const [tw, setTw] = useState(false);
  const [name, setName] = useState("SunIcon");
  const [propToggles, setPropToggles] = useState({ color: true, size: true, stroke: false });
  const [changedLines, setChangedLines] = useState([]);

  const parsed = useMemo(() => Vek.parseSvg(source), [source]);

  const code = useMemo(() => {
    if (!parsed.ok) return "// paste a valid SVG to begin";
    return Vek.generate(framework, parsed, { name, ts, tw, props: propToggles });
  }, [parsed, framework, name, ts, tw, propToggles]);

  const prevCodeRef = useRef(code);
  useEffect(() => {
    const prev = prevCodeRef.current.split("\n");
    const cur = code.split("\n");
    const diff = [];
    for (let i = 0; i < cur.length; i++) {
      if (prev[i] !== cur[i]) diff.push(i);
    }
    if (diff.length && diff.length < cur.length) {
      setChangedLines(diff);
      const t = setTimeout(() => setChangedLines([]), 900);
      prevCodeRef.current = code;
      return () => clearTimeout(t);
    }
    prevCodeRef.current = code;
  }, [code]);

  return {
    source, setSource,
    framework, setFramework,
    ts, setTs,
    tw, setTw,
    name, setName,
    propToggles, setPropToggles,
    parsed, code, changedLines,
  };
}
