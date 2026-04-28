/* eslint-disable react-refresh/only-export-components -- co-located hooks and constants are deliberate; refresh is a DX concern */
/* eslint-disable react-hooks/set-state-in-effect -- animations use guarded, self-clearing state */
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
  coffee: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 010 8h-1" />
      <path d="M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
      <path d="M6 2v3M10 2v3M14 2v3" />
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
  link: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1.5 1.5M14 11a5 5 0 00-7.07 0l-3 3a5 5 0 007.07 7.07l1.5-1.5" />
    </svg>
  ),
};

const b64uEncode = (bytes) => {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const b64uDecode = (str) => {
  const pad = str.length % 4 ? 4 - (str.length % 4) : 0;
  const b64 = (str + "=".repeat(pad)).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

export async function encodeShare(state) {
  const json = JSON.stringify(state);
  const bytes = new TextEncoder().encode(json);
  const cs = new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"));
  const out = new Uint8Array(await new Response(cs).arrayBuffer());
  return b64uEncode(out);
}
export async function decodeShare(str) {
  const ds = new Blob([b64uDecode(str)]).stream().pipeThrough(new DecompressionStream("gzip"));
  const text = await new Response(ds).text();
  return JSON.parse(text);
}

export function ShareButton({ state }) {
  const [status, setStatus] = useState("idle");
  const onClick = async () => {
    try {
      const encoded = await encodeShare(state);
      const url = `${window.location.origin}${window.location.pathname}#s=${encoded}`;
      if (url.length > 6000) { setStatus("too-large"); setTimeout(() => setStatus("idle"), 1800); return; }
      await navigator.clipboard.writeText(url);
      window.history.replaceState(null, "", `#s=${encoded}`);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 1400);
    } catch { setStatus("error"); setTimeout(() => setStatus("idle"), 1400); }
  };
  const label = status === "copied" ? "Link copied" : status === "too-large" ? "SVG too large to share" : status === "error" ? "Share failed" : "Share";
  return (
    <button className={`copy-btn ${status === "copied" ? "copied" : ""}`} onClick={onClick} title="Copy a link that restores this exact state">
      {status === "copied" ? Icon.check : Icon.link}
      <span>{label}</span>
    </button>
  );
}

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem("vek-theme") || "light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("vek-theme", theme);
  }, [theme]);
  return [theme, setTheme];
}

export function TopBar({ view, setView, theme, setTheme }) {
  const [coffeeOpen, setCoffeeOpen] = useState(false);
  const go = (v) => (e) => {
    // Preserve native cmd/ctrl/middle-click for open-in-new-tab.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    setView(v);
  };
  return (
    <div className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <a className="wordmark" href="/" onClick={go("landing", "/")}>
          <span>Vectorio</span>
          <span className="dot" />
        </a>
        <div className="nav">
          <a className={`nav-btn ${view === "landing" ? "active" : ""}`} href="/" onClick={go("landing", "/")}>Overview</a>
          <a className={`nav-btn ${view === "converter" ? "active" : ""}`} href="/convert" onClick={go("converter", "/convert")}>Converter</a>
          <a className={`nav-btn ${view === "batch" ? "active" : ""}`} href="/batch" onClick={go("batch", "/batch")}>Batch</a>
        </div>
      </div>
      <div className="nav-meta">
        <a className={`nav-btn ${view === "docs" ? "active" : ""}`} href="/docs" onClick={go("docs", "/docs")}>Docs</a>
        <button className="theme-toggle" onClick={() => setCoffeeOpen(true)} title="Buy me a coffee" aria-label="Buy me a coffee">
          {Icon.coffee}
        </button>
        <button className="theme-toggle" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle theme">
          {theme === "dark" ? Icon.sun : Icon.moon}
        </button>
      </div>
      <CoffeeModal open={coffeeOpen} onClose={() => setCoffeeOpen(false)} title="Buy me a coffee" body="Vectorio is free, open source, and runs entirely in your browser. If it saves you time, you can support development with a coffee — every bit helps." />
    </div>
  );
}

export function CodeBlock({ code, lang, changedLines = [] }) {
  // Derive fadeKey during render — bumping it on each code change is cheaper
  // than a state+effect pair and avoids the setState-in-effect anti-pattern.
  // Bump fadeKey when code changes to retrigger the CSS fade-in animation.
  const [fadeKey, setFadeKey] = useState(0);
  const prevRef = useRef(code);
  useEffect(() => {
    if (prevRef.current !== code) {
      prevRef.current = code;
      setFadeKey((k) => k + 1);
    }
  }, [code]);

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

export function CopyButton({ text, onCopy }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className={`copy-btn ${copied ? "copied" : ""}`}
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); } catch { /* noop */ }
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
        onCopy?.();
      }}
    >
      {copied ? Icon.check : Icon.copy}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

// Suppression key is set only after an explicit dismiss/support action.
const COFFEE_KEY = "vectorio:coffee-suppressed-until";
const COFFEE_SUPPRESS_DAYS = 14;
const COFFEE_URL = "https://buymeacoffee.com/berkinduz";

export function isCoffeeSuppressed() {
  try {
    const v = localStorage.getItem(COFFEE_KEY);
    if (!v) return false;
    return Date.now() < Number(v);
  } catch { return false; }
}
function suppressCoffee() {
  try {
    localStorage.setItem(COFFEE_KEY, String(Date.now() + COFFEE_SUPPRESS_DAYS * 86400 * 1000));
  } catch { /* noop */ }
}

export function CoffeeToast({ open, onClose }) {
  // Auto-dismiss after 7s so it never lingers. Only explicit actions suppress
  // future prompts.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => { onClose?.(); }, 7000);
    return () => clearTimeout(t);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="coffee-toast" role="status" aria-live="polite">
      <span className="coffee-toast-text">
        Copied. Vectorio is free and runs in your browser — if it saved you time you can{" "}
        <a href={COFFEE_URL} target="_blank" rel="noopener noreferrer" onClick={() => { suppressCoffee(); onClose?.(); }}>buy me a coffee</a>.
      </span>
      <button className="coffee-toast-dismiss" onClick={() => { suppressCoffee(); onClose?.(); }} aria-label="Dismiss">×</button>
    </div>
  );
}

export function CoffeeModal({ open, onClose, title = "Library downloaded", body = "Vectorio is free, open source, and runs entirely in your browser. If it saved you time, you can support development with a coffee." }) {
  const dialogRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    // Remember what had focus so we can restore it on close.
    previouslyFocusedRef.current = document.activeElement;
    // Move focus into the dialog after paint so screen readers announce it.
    const t = setTimeout(() => {
      const first = dialogRef.current?.querySelector("a, button:not([disabled])");
      first?.focus();
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = dialogRef.current?.querySelectorAll(
        'a, button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || !focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      // Wrap focus inside the dialog so Tab cannot escape behind the backdrop.
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Restore focus to the previously active element when the modal closes.
  useEffect(() => {
    if (open) return;
    const prev = previouslyFocusedRef.current;
    if (prev && typeof prev.focus === "function") prev.focus();
  }, [open]);

  if (!open) return null;
  return (
    <div className="coffee-modal-backdrop" onClick={onClose}>
      <div ref={dialogRef} className="coffee-modal" role="dialog" aria-modal="true" aria-labelledby="coffee-modal-title" aria-describedby="coffee-modal-body" onClick={(e) => e.stopPropagation()}>
        <h3 id="coffee-modal-title">{title}</h3>
        <p id="coffee-modal-body">{body}</p>
        <div className="coffee-modal-actions">
          <button className="coffee-modal-skip" onClick={() => { suppressCoffee(); onClose?.(); }}>No thanks</button>
          <a className="coffee-modal-cta" href={COFFEE_URL} target="_blank" rel="noopener noreferrer" onClick={() => { suppressCoffee(); onClose?.(); }}>Buy me a coffee</a>
        </div>
      </div>
    </div>
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
  // A11y: "hidden" adds aria-hidden="true" (decorative icon next to text — most common);
  // "labeled" adds a `title` prop that, when provided, renders <title> + role="img".
  // "none" leaves it untouched.
  const [a11y, setA11y] = useState("hidden");
  const [forwardRef, setForwardRef] = useState(true);
  const [advanced, setAdvanced] = useState({
    memo: false,
    defaultExport: false,
    namePrefix: "",
    nameSuffix: "",
  });

  const parsed = useMemo(() => Vek.parseSvg(source), [source]);
  const outputName = useMemo(() => {
    const next = `${advanced.namePrefix}${name}${advanced.nameSuffix}`.replace(/[^a-zA-Z0-9]/g, "");
    return next || name;
  }, [advanced.namePrefix, advanced.nameSuffix, name]);

  const code = useMemo(() => {
    if (!parsed.ok) return "// paste a valid SVG to begin";
    return Vek.generate(framework, parsed, {
      name: outputName,
      ts,
      tw,
      props: propToggles,
      a11y,
      forwardRef,
      memo: advanced.memo,
      defaultExport: advanced.defaultExport,
    });
  }, [parsed, framework, outputName, ts, tw, propToggles, a11y, forwardRef, advanced.memo, advanced.defaultExport]);

  const prevCodeRef = useRef(code);
  useEffect(() => {
    const prev = prevCodeRef.current.split("\n");
    const cur = code.split("\n");
    const diff = [];
    for (let i = 0; i < cur.length; i++) {
      if (prev[i] !== cur[i]) diff.push(i);
    }
    prevCodeRef.current = code;
    if (!diff.length || diff.length >= cur.length) return;
    setChangedLines(diff);
    const t = setTimeout(() => setChangedLines([]), 900);
    return () => clearTimeout(t);
  }, [code]);

  return {
    source, setSource,
    framework, setFramework,
    ts, setTs,
    tw, setTw,
    name, setName,
    propToggles, setPropToggles,
    a11y, setA11y,
    forwardRef, setForwardRef,
    advanced, setAdvanced,
    outputName,
    parsed, code, changedLines,
  };
}
