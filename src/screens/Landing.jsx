import { useState } from "react";
import { Vek } from "../lib/engine.js";
import { useConverter, FrameworkTabs, CodeBlock, CopyButton } from "../components.jsx";

export function Landing({ setView }) {
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
      <h2 className="eyebrow">SVG to React, Vue, Svelte &amp; Solid · batch icon libraries</h2>
      <h1 className="hero-head">
        Paste messy SVG.<br />
        Ship a <em>clean</em> icon library.
      </h1>
      <p className="hero-sub">
        Most tools hand you one React component. Vectorio gives you <strong>React, Vue, Svelte, or Solid</strong> — strips the Figma/Sketch junk, fixes id collisions that break multi-icon pages, and turns a folder of SVGs into a tree-shakable library with <code>package.json</code> + README. No CLI, no config, no account. Runs entirely in your browser.
      </p>

      <div className="demo-banner">
        <div className="demo-banner-label">
          <span className="dot" />
          <span>Interactive preview below</span>
          <span className="demo-banner-sep">·</span>
          <span className="demo-banner-hint">a 30-second taste — the full Converter adds drag-drop, .svg upload, sample gallery, a11y modes, forwardRef, and Batch for whole libraries</span>
        </div>
        <button className="demo-banner-cta" onClick={() => setView("converter")}>
          Open full Converter →
        </button>
      </div>

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
          <p>Vectorio reads your SVG and suggests <code style={{ fontFamily: "var(--mono)", fontSize: 13 }}>color</code>, <code style={{ fontFamily: "var(--mono)", fontSize: 13 }}>size</code>, and <code style={{ fontFamily: "var(--mono)", fontSize: 13 }}>strokeWidth</code> as typed props. Toggle each on or off.</p>
        </div>
        <div className="feature">
          <div className="num">03</div>
          <h3>Whole icon<br />libraries at once.</h3>
          <p>Drop a folder or a zip. Get a tree-shakable library with a generated index and per-icon component files.</p>
          <a
            href="/batch"
            className="feature-cta"
            onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; e.preventDefault(); setView("batch"); }}
          >Open Batch →</a>
        </div>
      </div>

      <section className="faq" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="faq-heading">Frequently asked</h2>
        <div className="faq-list">
          <div className="faq-item">
            <h3 className="faq-q">How do I convert an SVG to a React component?</h3>
            <p className="faq-a">Paste your SVG or drop the file into the Converter. Vectorio parses it, auto-detects props like <code>color</code>, <code>size</code>, and <code>strokeWidth</code>, and outputs a typed React component you can copy in one click. Everything runs locally in your browser.</p>
          </div>
          <div className="faq-item">
            <h3 className="faq-q">Does Vectorio support Vue, Svelte, and Solid?</h3>
            <p className="faq-a">Yes. The same SVG produces clean components for React, Vue, Svelte, or Solid — switch frameworks with a tab. TypeScript and Tailwind class output are optional toggles.</p>
          </div>
          <div className="faq-item">
            <h3 className="faq-q">Can I turn a folder of SVGs into an icon library?</h3>
            <p className="faq-a"><a href="/batch" className="faq-link" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; e.preventDefault(); setView("batch"); }}>Batch mode</a> takes a folder (or a zip) of SVGs and generates a tree-shakable library: one typed component per icon, a barrel <code>index</code>, <code>package.json</code>, and a README. Download the whole thing as a zip when you're done.</p>
          </div>
          <div className="faq-item">
            <h3 className="faq-q">Is my SVG uploaded to a server?</h3>
            <p className="faq-a">No. Vectorio is 100% client-side — parsing, cleaning, and code generation all happen in your browser. No account, no upload, no telemetry.</p>
          </div>
          <div className="faq-item">
            <h3 className="faq-q">How is this different from other SVG-to-component tools?</h3>
            <p className="faq-a">Most tools give you a single React component. Vectorio covers four frameworks, cleans Figma and Sketch export junk, prefixes IDs to prevent collisions on multi-icon pages, and ships whole libraries — not just components.</p>
          </div>
        </div>
      </section>

      <div className="footer">
        <div>© 2026 Vectorio · runs entirely in your browser</div>
        <div className="links">
          <a href="/docs" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; e.preventDefault(); setView("docs"); }}>Docs</a>
          <a href="https://github.com/berkinduz/vectorio" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </div>
    </div>
  );
}
