import { useState } from "react";
import { Vek } from "../lib/engine.js";
import { useConverter, FrameworkTabs, CodeBlock, CopyButton } from "../components.jsx";

export function Landing() {
  const conv = useConverter();
  const { source, setSource, framework, setFramework, ts, setTs, tw, setTw, name, setName, propToggles, setPropToggles, parsed, code, changedLines } = conv;

  const [drag, setDrag] = useState(false);

  const onDrop = async (e) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".svg")) return;
    const text = await file.text();
    setSource(text);
    const base = file.name.replace(/\.svg$/i, "").replace(/[^a-z0-9]+/gi, " ").trim();
    const pascal = base.split(" ").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join("");
    if (pascal) setName(pascal + "Icon");
  };

  const onPaste = (e) => {
    const text = e.clipboardData.getData("text");
    if (text && text.trim().startsWith("<svg")) {
      e.preventDefault();
      setSource(text);
    }
  };

  const previewInner = parsed.ok ? { __html: source } : null;

  return (
    <div className="landing">
      <div className="eyebrow">SVG · to · component · converter</div>
      <h1 className="hero-head">
        Paste an SVG.<br />
        Get a <em>clean</em> component.
      </h1>
      <p className="hero-sub">
        Vektorio turns any SVG into a production-ready component for React, Vue, Svelte, and Solid — with auto-extracted props and an optional Tailwind variant. No config walls, no accounts, no build step. Just paste.
      </p>

      <div
        className="demo"
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onPaste={onPaste}
      >
        <div className="demo-pane">
          <div className="pane-label">
            <span>01 — Source</span>
            <span className="count">{source.length.toLocaleString()} chars</span>
          </div>

          <div className="preview-well">
            <div className="preview-canvas">
              {parsed.ok ? <div dangerouslySetInnerHTML={previewInner} /> : <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--fg-faint)" }}>invalid</span>}
            </div>
            <div className="preview-meta">
              <div className="name">{parsed.ok ? "sun.svg" : "—"}</div>
              <div className="row"><span className="k">viewBox</span><span className="v">{parsed.ok ? parsed.viewBox : "—"}</span></div>
              <div className="row"><span className="k">width</span><span className="v">{parsed.ok ? parsed.width : "—"}</span></div>
              <div className="row"><span className="k">stroke</span><span className="v">{parsed.ok ? parsed.stroke : "—"}</span></div>
              <div className="row"><span className="k">fill</span><span className="v">{parsed.ok ? parsed.fill : "—"}</span></div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="section-title">Auto-detected props <span style={{ color: "var(--fg-faint)" }}>{Object.values(propToggles).filter(Boolean).length}/{Object.keys(propToggles).length} on</span></div>
            <div className="chips">
              {Object.keys(propToggles).map((k) => (
                <button
                  key={k}
                  className={`chip ${propToggles[k] ? "on" : ""}`}
                  onClick={() => setPropToggles({ ...propToggles, [k]: !propToggles[k] })}
                >
                  <span className="tick" />
                  <span>{k}</span>
                </button>
              ))}
            </div>
          </div>

          <div
            className={`dropzone ${drag ? "drag" : ""}`}
            style={{ minHeight: 72, flex: "0 0 auto" }}
            onClick={(e) => e.currentTarget.querySelector("input").click()}
          >
            <input
              type="file"
              accept=".svg"
              style={{ display: "none" }}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const t = await f.text();
                setSource(t);
              }}
            />
            <span>Drop an SVG here, paste, or click to browse</span>
            <span className="kbd">⌘V also works</span>
          </div>
        </div>

        <div className="demo-pane">
          <div className="code-head">
            <FrameworkTabs value={framework} onChange={setFramework} />
            <div style={{ display: "flex", gap: 4 }}>
              <button
                className={`toggle-pill switch ${ts ? "on" : ""}`}
                onClick={() => setTs(!ts)}
                aria-pressed={ts}
              >
                <span className="dot" />
                <span>TS</span>
                <span className="state">{ts ? "on" : "off"}</span>
              </button>
              <button
                className={`toggle-pill switch ${tw ? "on" : ""}`}
                onClick={() => setTw(!tw)}
                aria-pressed={tw}
              >
                <span className="dot" />
                <span>Tailwind</span>
                <span className="state">{tw ? "on" : "off"}</span>
              </button>
            </div>
          </div>

          <CodeBlock code={code} lang={framework} changedLines={changedLines} />

          <div className="code-foot">
            <span>{name}.{framework === "vue" ? "vue" : framework === "svelte" ? "svelte" : ts ? "tsx" : "jsx"}  ·  {code.split("\n").length} lines</span>
            <CopyButton text={code} />
          </div>
        </div>
      </div>

      <div className="features">
        <div className="feature">
          <div className="num">01</div>
          <h3>Four frameworks,<br />one paste.</h3>
          <p>React, Vue, Svelte, Solid — same input, four clean outputs. Switch with a tab, copy in one click.</p>
        </div>
        <div className="feature">
          <div className="num">02</div>
          <h3>Props it figures<br />out for you.</h3>
          <p>Vektorio reads your SVG and suggests <code style={{ fontFamily: "var(--mono)", fontSize: 13 }}>color</code>, <code style={{ fontFamily: "var(--mono)", fontSize: 13 }}>size</code>, and <code style={{ fontFamily: "var(--mono)", fontSize: 13 }}>strokeWidth</code> as typed props. Toggle each on or off.</p>
        </div>
        <div className="feature">
          <div className="num">03</div>
          <h3>Whole icon<br />libraries at once.</h3>
          <p>Drop a folder or a zip. Get a tree-shakable library with a generated index and per-icon component files.</p>
        </div>
      </div>

      <div className="footer">
        <div>© 2026 Vektorio · runs entirely in your browser</div>
        <div className="links">
          <a href="#">Docs</a>
          <a href="#">Changelog</a>
          <a href="#">GitHub</a>
        </div>
      </div>
    </div>
  );
}
