import { useEffect, useRef, useState } from "react";

const SECTIONS = [
  { id: "quick-start", label: "Quick start" },
  { id: "converter", label: "Converter" },
  { id: "advanced-output", label: "Advanced output" },
  { id: "batch", label: "Batch" },
  { id: "cleaning", label: "Cleaning" },
  { id: "props", label: "Auto-detected props" },
  { id: "frameworks", label: "Framework output" },
  { id: "share-links", label: "Share links" },
  { id: "privacy", label: "Privacy & offline" },
  { id: "faq", label: "FAQ" },
];

export function Docs({ setView }) {
  const [active, setActive] = useState(SECTIONS[0].id);
  const observerRef = useRef(null);

  useEffect(() => {
    const opts = { rootMargin: "-20% 0px -70% 0px", threshold: 0 };
    observerRef.current = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) setActive(e.target.id);
      }
    }, opts);
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observerRef.current.observe(el);
    }
    return () => observerRef.current?.disconnect();
  }, []);

  const go = (view) => (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    setView(view);
  };

  return (
    <div className="docs">
      <aside className="docs-toc" aria-label="Table of contents">
        <div className="docs-toc-label">On this page</div>
        <nav>
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`docs-toc-link ${active === s.id ? "active" : ""}`}
            >
              {s.label}
            </a>
          ))}
        </nav>
      </aside>

      <article className="docs-content">
        <header className="docs-header">
          <div className="eyebrow">Documentation · current product reference</div>
          <h1 className="docs-title">Convert, clean, inspect, and ship SVG icons.</h1>
          <p className="docs-lead">
            Vectorio is a browser tool for turning self-contained SVG files into React, Vue, Svelte, or Solid components. It also turns folders of SVGs into a downloadable icon library. This page documents the current behavior, including cleanup, advanced output options, share links, and privacy.
          </p>
        </header>

        <section id="quick-start" className="docs-section">
          <h2>Quick start</h2>
          <ol className="docs-steps">
            <li><strong>Choose a workflow.</strong> Use <a href="/convert" onClick={go("converter")}>Converter</a> for one SVG, or <a href="/batch" onClick={go("batch")}>Batch</a> for a folder or zip.</li>
            <li><strong>Load SVG input.</strong> Paste markup, drop a file, browse from disk, or try one of the sample icons.</li>
            <li><strong>Pick output.</strong> Choose React, Vue, Svelte, or Solid, then toggle TypeScript, Tailwind, accessibility behavior, and any advanced output options.</li>
            <li><strong>Copy, download, share, or export.</strong> Single components can be copied/downloaded. Batch mode exports a zip with component files, a barrel export, package metadata, and README.</li>
          </ol>
          <p>All conversion work runs in the browser. Vectorio does not upload SVGs to a server.</p>
        </section>

        <section id="converter" className="docs-section">
          <h2>Converter</h2>
          <p>The Converter is the single-file workspace. It is best for inspecting a messy design export, checking how a component will be generated, or sharing a reproducible conversion state with someone else.</p>

          <h3>Input methods</h3>
          <ul>
            <li><strong>Paste</strong> — paste SVG markup directly into the source editor.</li>
            <li><strong>Drop</strong> — drag a <code>.svg</code> file onto the editor pane.</li>
            <li><strong>Browse</strong> — use the <code>Browse .svg</code> control to pick a local file.</li>
            <li><strong>Samples</strong> — load built-in examples for outline, solid, multicolor, Figma-style, and gradient SVGs.</li>
            <li><strong>Share link</strong> — open a <code>/convert#s=...</code> URL to restore source, framework, options, component name, and advanced output settings.</li>
          </ul>

          <h3>Preview and parse metadata</h3>
          <p>The left pane renders the SVG and reports parse metadata: dimensions, <code>viewBox</code>, icon type, and color count. If an SVG is invalid, the output pane returns a placeholder comment until valid SVG markup is loaded.</p>

          <h3>Cleaner summary</h3>
          <p>After parsing, the cleaner summary reports what changed: XML prolog removal, comments stripped, design-tool attributes removed, root/child attributes stripped, referenced IDs prefixed, and empty groups removed. A clean SVG may show that nothing needed stripping.</p>
        </section>

        <section id="advanced-output" className="docs-section">
          <h2>Advanced output</h2>
          <p>Advanced output is intentionally collapsed in the Converter so the main flow stays simple. These settings change generated code only; the source SVG and base component name remain untouched.</p>

          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr><th>Option</th><th>Applies to</th><th>Behavior</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>Prefix</code></td>
                  <td>All frameworks</td>
                  <td>Adds text before the base component name. Example: <code>App</code> + <code>SearchIcon</code> → <code>AppSearchIcon</code>.</td>
                </tr>
                <tr>
                  <td><code>Suffix</code></td>
                  <td>All frameworks</td>
                  <td>Adds text after the base component name. Non-alphanumeric characters are stripped from prefix/suffix fields.</td>
                </tr>
                <tr>
                  <td><code>default export</code></td>
                  <td>React, Solid</td>
                  <td>Emits a local component function/const plus <code>export default Name;</code> instead of a named export.</td>
                </tr>
                <tr>
                  <td><code>memo</code></td>
                  <td>React</td>
                  <td>Wraps the generated React component in <code>memo</code>. If <code>forwardRef</code> is also enabled, the output wraps <code>forwardRef</code> with <code>memo</code>.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="batch" className="docs-section">
          <h2>Batch</h2>
          <p>Batch mode turns many SVGs into a tree-shakable icon library. Use it for exported icon folders, design-system icons, or an existing SVG set you want to consume as components.</p>

          <h3>Input</h3>
          <ul>
            <li><strong>Folder upload</strong> — drop a folder; Vectorio walks it recursively and collects <code>.svg</code> files.</li>
            <li><strong>Zip</strong> — drop a <code>.zip</code>; SVG files inside are extracted and processed in the browser.</li>
            <li><strong>Multi-file</strong> — select or drop several individual SVG files.</li>
          </ul>

          <h3>Library management</h3>
          <ul>
            <li><strong>Filtering</strong> — search the icon grid by component name, source filename, or folder.</li>
            <li><strong>Per-icon actions</strong> — hover an icon to copy its generated component, download one component file, or remove it from the export set.</li>
            <li><strong>Bulk rename</strong> — strip a common prefix/suffix, add a prefix/suffix, and rerun names from original file basenames.</li>
            <li><strong>Collision handling</strong> — duplicate component names are flagged so the zip cannot silently overwrite files.</li>
          </ul>

          <h3>Export structure</h3>
          <p>The downloaded zip contains:</p>
          <ul>
            <li>One component file per icon in the selected framework</li>
            <li><code>index.js</code> or <code>index.ts</code> for named, tree-shakable exports</li>
            <li><code>package.json</code> with framework-appropriate entry metadata</li>
            <li><code>README.md</code> with install and usage examples</li>
          </ul>
        </section>

        <section id="cleaning" className="docs-section">
          <h2>Cleaning</h2>
          <p>Vectorio performs structural cleanup before code generation. This is different from byte-size optimization: it removes exporter noise and fixes component-safety issues without trying to aggressively compress the SVG.</p>

          <h3>Removed or normalized</h3>
          <ul>
            <li><strong>XML prolog and comments</strong> — <code>&lt;?xml ... ?&gt;</code>, doctype declarations, and comments are stripped before parsing.</li>
            <li><strong>Vendor namespaces and attributes</strong> — Sketch, Figma, Inkscape, Illustrator-style namespaced attributes are removed.</li>
            <li><strong>Data attributes</strong> — exporter metadata such as <code>data-name</code> is stripped.</li>
            <li><strong>Redundant child namespaces</strong> — inner <code>xmlns</code> declarations are removed from serialized children.</li>
            <li><strong>Empty groups</strong> — empty <code>&lt;g&gt;</code> nodes with no attributes are removed.</li>
            <li><strong>Root-level noise</strong> — root attributes outside the whitelist are removed.</li>
          </ul>

          <h3>ID collision prefixing</h3>
          <p>Repeated IDs break gradients, masks, clip paths, and filters when multiple icons render on one page. Vectorio keeps referenced IDs, prefixes them with a deterministic source hash, and rewrites matching <code>url(#id)</code> and <code>href="#id"</code> references.</p>
          <pre className="docs-code"><code>{`<!-- before -->
<linearGradient id="paint0">...</linearGradient>
<rect fill="url(#paint0)" />

<!-- after -->
<linearGradient id="v8k2a-paint0">...</linearGradient>
<rect fill="url(#v8k2a-paint0)" />`}</code></pre>

          <h3>Clean vs optimize</h3>
          <p>Current Vectorio cleaning is conservative and structural. It is not an SVGO-style minifier yet: it does not remove paths, collapse geometry, shorten numeric precision, or make aggressive visual assumptions. That keeps conversion predictable while leaving room for an explicit optimize mode later.</p>
        </section>

        <section id="props" className="docs-section">
          <h2>Auto-detected props</h2>
          <p>Vectorio scans the parsed SVG and suggests props that are likely to be useful:</p>
          <ul>
            <li><strong>color</strong> — enabled for single-color icons and bound to root <code>fill</code> or <code>stroke</code>, defaulting to <code>currentColor</code>.</li>
            <li><strong>size</strong> — enabled when dimensions can be represented by a single <code>size</code> prop for both width and height.</li>
            <li><strong>stroke</strong> — enabled for outline icons and bound as <code>strokeWidth</code> / <code>stroke-width</code> depending on framework syntax.</li>
          </ul>
          <p>For multicolor icons, <code>color</code> is disabled automatically so the original palette is preserved. The multicolor notice explains why flattening color would change the artwork.</p>
        </section>

        <section id="frameworks" className="docs-section">
          <h2>Framework output</h2>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr><th>Framework</th><th>Output shape</th><th>Notes</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>React</td>
                  <td><code>.jsx</code> or <code>.tsx</code></td>
                  <td>Supports TypeScript props, Tailwind <code>className</code>, accessibility modes, <code>forwardRef</code>, <code>memo</code>, and optional default export.</td>
                </tr>
                <tr>
                  <td>Vue</td>
                  <td><code>.vue</code></td>
                  <td>Emits a single-file component with <code>&lt;script setup&gt;</code>; TypeScript uses <code>lang="ts"</code> and typed <code>defineProps</code>.</td>
                </tr>
                <tr>
                  <td>Svelte</td>
                  <td><code>.svelte</code></td>
                  <td>Emits exported props in a <code>&lt;script&gt;</code> block when needed, with framework-native attribute bindings.</td>
                </tr>
                <tr>
                  <td>Solid</td>
                  <td><code>.jsx</code> or <code>.tsx</code></td>
                  <td>Uses <code>mergeProps</code> when defaults are needed and supports optional default export.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="share-links" className="docs-section">
          <h2>Share links</h2>
          <p>The <strong>Share</strong> button copies a URL like <code>/convert#s=H4sIAAAAA...</code>. It restores source SVG, framework, TypeScript/Tailwind, component name, auto-detected prop toggles, accessibility mode, <code>forwardRef</code>, and advanced output settings.</p>

          <h3>How it works</h3>
          <ul>
            <li>Converter state is serialized to JSON.</li>
            <li>The JSON is compressed with browser <code>CompressionStream</code>.</li>
            <li>The compressed bytes are encoded as URL-safe base64 and stored in the URL hash.</li>
          </ul>

          <h3>Practical limits</h3>
          <ul>
            <li><strong>Private by design.</strong> URL hashes are not sent to the server as part of normal HTTP requests.</li>
            <li><strong>Size limit.</strong> Very large SVGs can exceed the share URL limit; Vectorio rejects URLs over roughly 6,000 characters.</li>
            <li><strong>Legacy links.</strong> Old <code>/#s=...</code> links are redirected to <code>/convert#s=...</code>.</li>
          </ul>
        </section>

        <section id="privacy" className="docs-section">
          <h2>Privacy &amp; offline</h2>
          <p>Vectorio is a static client-side app. SVG parsing, cleaning, generation, share-link encoding, zip creation, and downloads happen in the browser. There is no backend upload path for SVG files.</p>
          <p>Vectorio uses privacy-friendly aggregate page analytics to understand route usage. SVG content is never uploaded, and conversion state is not sent as analytics payload. Theme preference is stored in <code>localStorage</code>. Fonts are requested from Google Fonts during page load and then cached by the browser.</p>
          <p>Once the app is loaded, conversion can continue without a network connection unless the page is refreshed and uncached assets are needed again.</p>
        </section>

        <section id="faq" className="docs-section">
          <h2>FAQ</h2>

          <h3>Is Vectorio an SVGR replacement?</h3>
          <p>Not exactly. SVGR is excellent for automated repo/build pipelines. Vectorio is most useful before that: inspecting messy SVGs, cleaning design exports, comparing framework output, sharing one conversion, or generating a first-pass icon library zip.</p>

          <h3>Does Vectorio optimize SVG file size?</h3>
          <p>Not with SVGO-style minification yet. Current cleanup is structural and conservative: it removes exporter noise, normalizes component-safe attributes, and prefixes IDs. A separate optimize mode can be added later without changing this baseline behavior.</p>

          <h3>Can I use generated code commercially?</h3>
          <p>Yes. Vectorio is MIT-licensed, and generated component code is yours to use, modify, and ship.</p>

          <h3>Why is my icon not rendering correctly?</h3>
          <p>Most often, the SVG relies on external references (<code>&lt;use href="external.svg#id" /&gt;</code>) or stylesheet CSS that is not embedded in the SVG. Vectorio expects self-contained SVG markup.</p>

          <h3>How do I report a bug?</h3>
          <p>Open an issue on <a href="https://github.com/berkinduz/vectorio" target="_blank" rel="noopener noreferrer">GitHub</a>. Include the smallest SVG that reproduces the behavior if the bug is about parsing, cleaning, or output generation.</p>
        </section>

        <section className="docs-thanks">
          <h2>Found it useful?</h2>
          <p>Vectorio is free, open source, and runs entirely in your browser — no subscriptions, no telemetry. If it saved you time, you can <a href="https://buymeacoffee.com/berkinduz" target="_blank" rel="noopener noreferrer">buy me a coffee</a>. Bug reports, feedback, and stars on <a href="https://github.com/berkinduz/vectorio" target="_blank" rel="noopener noreferrer">GitHub</a> are equally appreciated.</p>
        </section>
      </article>
    </div>
  );
}
