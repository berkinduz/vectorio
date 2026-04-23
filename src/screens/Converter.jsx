import { useState } from "react";
import { Vek } from "../lib/engine.js";
import { useConverter, FrameworkTabs, CodeBlock, CopyButton, Icon } from "../components.jsx";

export function Converter() {
  const conv = useConverter();
  const { source, setSource, framework, setFramework, ts, setTs, tw, setTw, name, setName, propToggles, setPropToggles, a11y, setA11y, forwardRef, setForwardRef, parsed, code, changedLines } = conv;

  const [drag, setDrag] = useState(false);

  const onDrop = async (e) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.name.endsWith(".svg")) return;
    const text = await file.text();
    setSource(text);
    const base = file.name.replace(/\.svg$/i, "").replace(/[^a-z0-9]+/gi, " ").trim();
    const pascal = base.split(" ").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join("");
    if (pascal) setName(pascal + "Icon");
  };

  const previewInner = parsed.ok ? { __html: source } : null;
  const ext = framework === "vue" ? "vue" : framework === "svelte" ? "svelte" : ts ? "tsx" : "jsx";

  return (
    <div className="converter">
      <div className="conv-pane left">
        <div className="pane-head">
          <div className="pane-title">Source · SVG</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="toggle-pill" onClick={() => setSource(Vek.DEFAULT_SVG)}>Reset</button>
            <button className="toggle-pill" onClick={() => setSource("")}>Clear</button>
          </div>
        </div>

        <div className="pane-body">
          <div className="preview-well">
            <div className="preview-canvas">
              {parsed.ok ? <div dangerouslySetInnerHTML={previewInner} /> : <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--fg-faint)" }}>invalid</span>}
            </div>
            <div className="preview-meta grid">
              <div className="meta-head">
                <span className="name">Preview</span>
                <span className="status" style={{ color: parsed.ok ? "var(--accent)" : "var(--fg-faint)" }}>
                  {parsed.ok ? "✓ parsed" : "waiting"}
                </span>
              </div>
              <div className="row"><span className="k">dims</span><span className="v">{parsed.ok ? `${parsed.width}×${parsed.height}` : "—"}</span></div>
              <div className="row"><span className="k">viewBox</span><span className="v">{parsed.ok ? parsed.viewBox : "—"}</span></div>
              <div className="row"><span className="k">type</span><span className="v">{parsed.ok ? parsed.iconType : "—"}</span></div>
              <div className="row"><span className="k">colors</span><span className="v">{parsed.ok ? (parsed.colors.length || "currentColor") : "—"}</span></div>
            </div>
          </div>
          {parsed.ok && parsed.multicolor && (
            <div className="notice notice-warn">
              <strong>Multi-color icon</strong> — detected {parsed.colors.length} distinct colors. Turning on <code>color</code> would flatten them all to one value. Keep it off to preserve the palette.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="section-title">Auto-detected props</div>
            <div className="chips">
              {["color", "size", "stroke"].map((k) => (
                <button
                  key={k}
                  className={`chip ${propToggles[k] ? "on" : ""}`}
                  onClick={() => setPropToggles({ ...propToggles, [k]: !propToggles[k] })}
                >
                  <span className="tick" />
                  <span>{k}</span>
                  <span style={{ color: "var(--fg-faint)", fontSize: 10 }}>
                    {k === "color" ? "fill/stroke" : k === "size" ? "w/h" : "stroke-width"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="section-title">
              <span>{source === Vek.DEFAULT_SVG ? "Try a sample" : "Samples"}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--fg-faint)" }}>
                {source === Vek.DEFAULT_SVG ? "see how each case is handled" : "swap in another"}
              </span>
            </div>
            <div className="sample-gallery">
              {Vek.CONVERTER_SAMPLES.map((s) => (
                <button
                  key={s.id}
                  className="sample-chip"
                  onClick={() => { setSource(s.svg); setName(s.name); }}
                  title={s.hint}
                >
                  <span className="sample-thumb" dangerouslySetInnerHTML={{ __html: s.svg }} />
                  <span className="sample-meta">
                    <span className="sample-label">{s.label}</span>
                    <span className="sample-hint">{s.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minHeight: 0 }}>
            <div className="section-title">
              <span>SVG markup</span>
              <span>{parsed.ok ? "valid" : "paste or drop below"}</span>
            </div>
            <textarea
              className={`svg-source ${drag ? "drag" : ""}`}
              value={source}
              onChange={(e) => setSource(e.target.value)}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              spellCheck={false}
              placeholder="<svg ...>&#10;  <path .../>&#10;</svg>"
            />
          </div>
        </div>
      </div>

      <div className="conv-pane right">
        <div className="pane-head">
          <div className="pane-title">Output · Component</div>
          <input
            className="name-edit"
            value={name}
            onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
            spellCheck={false}
          />
        </div>

        <div className="code-surface">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <FrameworkTabs value={framework} onChange={setFramework} />
            <div style={{ display: "flex", gap: 4 }}>
              <button
                className={`toggle-pill switch ${ts ? "on" : ""}`}
                onClick={() => setTs(!ts)}
                aria-pressed={ts}
              >
                <span className="dot" />
                <span>TypeScript</span>
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

          <div className="advanced-row">
            <div className="adv-group">
              <span className="adv-label">a11y</span>
              <div className="seg seg-sm" role="tablist">
                {[
                  { id: "hidden", label: "decorative", hint: "aria-hidden (for icons next to text)" },
                  { id: "labeled", label: "labeled", hint: "role=img + title prop" },
                  { id: "none", label: "none", hint: "no aria attributes" },
                ].map((o) => (
                  <button
                    key={o.id}
                    className={a11y === o.id ? "active" : ""}
                    onClick={() => setA11y(o.id)}
                    title={o.hint}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            {framework === "react" && (
              <button
                className={`toggle-pill switch ${forwardRef ? "on" : ""}`}
                onClick={() => setForwardRef(!forwardRef)}
                aria-pressed={forwardRef}
                title="Wrap in React.forwardRef so parents can attach a ref"
              >
                <span className="dot" />
                <span>forwardRef</span>
                <span className="state">{forwardRef ? "on" : "off"}</span>
              </button>
            )}
          </div>

          <div className="config-summary">
            <span className="sum-dot" />
            <span className="sum-text">
              {(() => {
                const fw = framework === "react" ? "React" : framework === "vue" ? "Vue" : framework === "svelte" ? "Svelte" : "Solid";
                const parts = [`${fw} · .${ext}`];
                if (tw) parts.push("Tailwind className");
                if (a11y === "hidden") parts.push("decorative (aria-hidden)");
                else if (a11y === "labeled") parts.push("labeled (title prop adds role=img)");
                else parts.push("no aria");
                if (framework === "react" && forwardRef) parts.push("forwardRef");
                return parts.join("  ·  ");
              })()}
            </span>
          </div>

          <CodeBlock code={code} lang={framework} changedLines={changedLines} />

          <div className="code-foot">
            <span>{name}.{ext}  ·  {code.split("\n").length} lines  ·  {new Blob([code]).size} B</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="copy-btn" onClick={() => {
                const blob = new Blob([code], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `${name}.${ext}`; a.click();
                URL.revokeObjectURL(url);
              }}>
                {Icon.download}<span>Download</span>
              </button>
              <CopyButton text={code} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
