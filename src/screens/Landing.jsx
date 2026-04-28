import { useState } from "react";
import { Vek } from "../lib/engine.js";
import { useConverter, FrameworkTabs, CodeBlock, CopyButton } from "../components.jsx";

const BEFORE_AFTER = [
  {
    label: "Figma export",
    title: "Exporter noise gets stripped before it reaches your repo.",
    before: `<svg xmlns="http://www.w3.org/2000/svg"
  xmlns:sketch="http://www.bohemiancoding.com/sketch/ns"
  data-name="bolt" sketch:type="MSLayerGroup">
  <!-- Generator: Figma Export -->
  <g id="Layer_1" data-name="icon">
    <g></g>
    <path stroke="#000" stroke-width="2" .../>
  </g>
</svg>`,
    after: `<svg viewBox="0 0 24 24"
  width={size}
  height={size}
  stroke={color}
  strokeWidth={strokeWidth}>
  <g>
    <path d="M13 2L3 14..." />
  </g>
</svg>`,
    note: "Namespaces, comments, data attrs, unused ids, and empty groups are removed. Useful attributes become props.",
  },
  {
    label: "Gradient IDs",
    title: "Repeated IDs are prefixed together with their references.",
    before: `<defs>
  <linearGradient id="paint0">...</linearGradient>
</defs>
<rect fill="url(#paint0)" />`,
    after: `<defs>
  <linearGradient id="v8k2a-paint0">...</linearGradient>
</defs>
<rect fill="url(#v8k2a-paint0)" />`,
    note: "The same icon keeps a stable prefix, so gradients, masks, and filters do not collide across a page.",
  },
  {
    label: "Multicolor icons",
    title: "Palettes stay intact instead of being flattened to one color.",
    before: `<path fill="#f4c77a" />
<path fill="#e8a84a" />
<circle fill="#ffffff" />`,
    after: `<path fill="#f4c77a" />
<path fill="#e8a84a" />
<circle fill="#ffffff" />
// color prop is disabled`,
    note: "Vectorio detects multiple real colors and avoids generating a color prop that would break the original artwork.",
  },
];

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
      <div className="eyebrow">SVG to React, Vue, Svelte &amp; Solid · batch icon libraries</div>
      <h1 className="hero-head">
        Convert SVGs into<br />
        <em>clean</em> components.
      </h1>
      <p className="hero-sub hero-sub-desktop">
        Vectorio turns messy design exports into <strong>React, Vue, Svelte, or Solid</strong> components — strips Figma/Sketch junk, fixes id collisions, and turns a folder of SVGs into a tree-shakable icon library with <code>package.json</code> + README. No CLI, no config, no account. Runs entirely in your browser.
      </p>
      <p className="hero-sub hero-sub-mobile">
        Vectorio turns messy SVG exports into clean <strong>React, Vue, Svelte, or Solid</strong> components and icon libraries. It cleans design-tool noise, fixes ID collisions, and runs entirely in your browser.
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

      <section className="demo-reel" aria-labelledby="demo-reel-heading">
        <div className="demo-reel-head">
          <div>
            <div className="eyebrow">See it in action</div>
            <h2 id="demo-reel-heading" className="demo-reel-title">Three short loops. No narration needed.</h2>
          </div>
          <p>The interactive demo above is the fastest taste. These show what the full Converter and Batch screens add on top.</p>
        </div>

        <div className="demo-reel-grid">
          <figure className="demo-reel-card">
            <div className="demo-reel-frame">
              <video src="/converter.mp4" poster="/converter.jpg" autoPlay loop muted playsInline preload="metadata" aria-label="Converter screen with framework switcher and sample gallery" />
            </div>
            <figcaption>
              <strong>One paste, four frameworks.</strong>
              <span>React, Vue, Svelte, Solid — same input, four clean outputs.</span>
            </figcaption>
          </figure>

          <figure className="demo-reel-card">
            <div className="demo-reel-frame dark">
              <video src="/converter_short_dark.mp4" poster="/converter_short_dark.jpg" autoPlay loop muted playsInline preload="metadata" aria-label="Advanced output panel: TypeScript, Tailwind, a11y, forwardRef toggles" />
            </div>
            <figcaption>
              <strong>Output you can actually ship.</strong>
              <span>TypeScript, Tailwind, a11y modes, forwardRef — toggled, not configured.</span>
            </figcaption>
          </figure>

          <figure className="demo-reel-card">
            <div className="demo-reel-frame">
              <video src="/batch.mp4" poster="/batch.jpg" autoPlay loop muted playsInline preload="metadata" aria-label="Dropping a zip of SVGs onto the Batch screen to build an icon library" />
            </div>
            <figcaption>
              <strong>A folder in. A library out.</strong>
              <span>Drop a zip or a folder, get a tree-shakable package with index + README.</span>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="before-after" aria-labelledby="before-after-heading">
        <div className="before-after-head">
          <div>
            <div className="eyebrow">Before / after</div>
            <h2 id="before-after-heading" className="before-after-title">What Vectorio actually cleans.</h2>
          </div>
          <p>These are the SVG issues that usually show up after a design export: metadata noise, duplicated IDs, hard-coded dimensions, and palette-breaking color props.</p>
        </div>

        <div className="before-after-grid">
          {BEFORE_AFTER.map((item) => (
            <article className="ba-card" key={item.label}>
              <div className="ba-card-head">
                <span>{item.label}</span>
                <h3>{item.title}</h3>
              </div>
              <div className="ba-code-pair">
                <div className="ba-code-block">
                  <div className="ba-code-label">Before</div>
                  <pre><code>{item.before}</code></pre>
                </div>
                <div className="ba-code-block after">
                  <div className="ba-code-label">After</div>
                  <pre><code>{item.after}</code></pre>
                </div>
              </div>
              <p>{item.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="positioning" aria-labelledby="positioning-heading">
        <div className="positioning-head">
          <div>
            <div className="eyebrow">Where Vectorio fits</div>
            <h2 id="positioning-heading" className="positioning-title">Not a replacement for your build tools. A faster path from messy SVG to shippable code.</h2>
          </div>
          <p>
            Use Vectorio when you need to inspect, clean, share, or package SVGs before they enter a repo. Use your build pipeline when the conversion rules are already settled.
          </p>
        </div>

        <div className="positioning-grid">
          <div className="positioning-card">
            <div className="positioning-kicker">SVGR / build pipeline</div>
            <h3>Best when conversion is already automated.</h3>
            <p>Great for repo-integrated React transforms, CLI workflows, and repeatable build steps once the team knows exactly how icons should be emitted.</p>
          </div>
          <div className="positioning-card accent">
            <div className="positioning-kicker">Vectorio</div>
            <h3>Best before SVGs become code.</h3>
            <p>Paste or drop exports from design tools, see what changed, fix ID collisions, switch frameworks, share a reproducible link, or ship a whole icon library as a zip.</p>
            <div className="positioning-actions">
              <button onClick={() => setView("converter")}>Try Converter →</button>
              <button onClick={() => setView("batch")}>Build Library →</button>
            </div>
          </div>
          <div className="positioning-card">
            <div className="positioning-kicker">Icon sets</div>
            <h3>Best when you can use existing icons.</h3>
            <p>Icon platforms are ideal for common symbols. Vectorio is for your own product icons, brand assets, and exported SVG folders that need production cleanup.</p>
          </div>
        </div>

        <div className="trust-strip" aria-label="Privacy and workflow guarantees">
          <span>No upload</span>
          <span>No account</span>
          <span>No telemetry</span>
          <span>Share links stay in the URL hash</span>
        </div>
      </section>

      <div className="footer">
        <div>© 2026 Vectorio · runs entirely in your browser</div>
        <div className="links">
          <a href="/docs" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; e.preventDefault(); setView("docs"); }}>Docs</a>
          <a href="https://github.com/berkinduz/vectorio" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://buymeacoffee.com/berkinduz" target="_blank" rel="noopener noreferrer">Buy me a coffee</a>
        </div>
      </div>
    </div>
  );
}
