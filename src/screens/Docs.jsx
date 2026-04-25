import { useEffect, useRef, useState } from "react";

const SECTIONS = [
  { id: "quick-start", label: "Quick start" },
  { id: "converter", label: "Converter" },
  { id: "batch", label: "Batch" },
  { id: "options", label: "Options reference" },
  { id: "cleaning", label: "What Vectorio cleans" },
  { id: "props", label: "Auto-detected props" },
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
          <h2 className="eyebrow">Documentation · how it works</h2>
          <h1 className="docs-title">Convert, clean, and ship SVG icons.</h1>
          <p className="docs-lead">
            Vectorio is a browser-based tool that turns SVG files into production-ready components for React, Vue, Svelte, and Solid — and turns folders of SVGs into tree-shakable icon libraries. No CLI, no config, no account. This page documents every option and behavior.
          </p>
        </header>

        <section id="quick-start" className="docs-section">
          <h2>Quick start</h2>
          <ol className="docs-steps">
            <li><strong>Paste or drop an SVG.</strong> Use <a href="/convert" onClick={go("converter")}>Converter</a> for a single icon, <a href="/batch" onClick={go("batch")}>Batch</a> for a folder.</li>
            <li><strong>Pick a framework.</strong> React, Vue, Svelte, or Solid — toggle TypeScript or Tailwind if you need them.</li>
            <li><strong>Copy or download.</strong> One-click copy for a single component; a zipped library with <code>package.json</code> and README for batch.</li>
          </ol>
          <p>Everything runs locally. Your SVGs never leave the browser.</p>
        </section>

        <section id="converter" className="docs-section">
          <h2>Converter</h2>
          <p>The Converter turns one SVG into one component. It's the right mode when you need to convert a single icon, inspect the output, or experiment with options.</p>

          <h3>Input methods</h3>
          <ul>
            <li><strong>Paste</strong> — <kbd>⌘V</kbd> / <kbd>Ctrl+V</kbd> anywhere on the page. Vectorio detects SVG source and loads it.</li>
            <li><strong>Drop</strong> — drag a <code>.svg</code> file onto the editor pane.</li>
            <li><strong>Browse</strong> — click the file input to pick a <code>.svg</code> from disk.</li>
            <li><strong>Samples</strong> — load a pre-made SVG (Sun, Star, Folder, Bolt, Sparkle) to experiment.</li>
            <li><strong>Share link</strong> — open a <code>/convert#s=…</code> URL to restore a previous session.</li>
          </ul>

          <h3>What you get</h3>
          <p>The output pane shows a single file: imports, an optional <code>Props</code> interface (TypeScript), the component body with your SVG inlined, and a default export. The component name is derived from the filename — <code>sun-icon.svg</code> becomes <code>SunIcon</code>. Rename manually in the name field if you prefer something else.</p>

          <h3>Live preview</h3>
          <p>The left pane renders the parsed SVG plus a metadata strip (<code>viewBox</code>, <code>width</code>, <code>stroke</code>, <code>fill</code>). If the preview shows "invalid", the SVG failed to parse — check for truncated markup or non-SVG content.</p>
        </section>

        <section id="batch" className="docs-section">
          <h2>Batch</h2>
          <p>Batch mode turns a collection of SVGs into a tree-shakable icon library. Use it when you have a folder of icons from a design file or an existing set you want to ship as an npm-ready package.</p>

          <h3>Input</h3>
          <ul>
            <li><strong>Folder upload</strong> — drop a folder; Vectorio walks it recursively and collects every <code>.svg</code>.</li>
            <li><strong>Zip</strong> — drop a <code>.zip</code>; Vectorio extracts and processes SVGs inside.</li>
            <li><strong>Multi-file</strong> — select or drop several individual files.</li>
          </ul>

          <h3>Naming</h3>
          <p>Each filename is converted to PascalCase with an <code>Icon</code> suffix: <code>arrow-right.svg</code> → <code>ArrowRightIcon</code>. Folder paths are preserved as metadata but flattened in the output. Duplicate names are disambiguated by path.</p>

          <h3>Bulk rename</h3>
          <p>A rename toolbar above the icon grid lets you strip a common prefix or suffix from all names, or add a suffix. Useful when your source files have something like <code>ic_</code> everywhere.</p>

          <h3>Per-icon actions</h3>
          <p>Hover an icon card to reveal: <strong>copy component</strong>, <strong>download single file</strong>, and <strong>remove from library</strong>. Removed icons don't affect the source files — it's a client-side filter.</p>

          <h3>Export structure</h3>
          <p>The downloaded zip contains:</p>
          <ul>
            <li>One component file per icon in the selected framework</li>
            <li><code>index.js</code> (or <code>.ts</code>) — a barrel file re-exporting every icon for tree-shakable named imports</li>
            <li><code>package.json</code> — with a derived name, version, and entry point</li>
            <li><code>README.md</code> — with install and usage examples</li>
          </ul>
        </section>

        <section id="options" className="docs-section">
          <h2>Options reference</h2>
          <p>Every toggle, with one line on what it does and when to turn it on.</p>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr><th>Option</th><th>What it does</th><th>When to enable</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>TypeScript</code></td>
                  <td>Emits <code>.tsx</code>/<code>.ts</code> output with a typed <code>Props</code> interface.</td>
                  <td>Consumer uses TypeScript.</td>
                </tr>
                <tr>
                  <td><code>Tailwind</code></td>
                  <td>Adds a <code>className</code> prop merged with <code>inline-block shrink-0</code>.</td>
                  <td>Consumer uses Tailwind utility classes.</td>
                </tr>
                <tr>
                  <td><code>forwardRef</code></td>
                  <td>Wraps the React component in <code>React.forwardRef</code> so consumers can attach refs.</td>
                  <td>On by default — production icon libraries expect it.</td>
                </tr>
                <tr>
                  <td><code>a11y: hidden</code></td>
                  <td>Adds <code>aria-hidden="true"</code>. The icon is decoration; screen readers skip it.</td>
                  <td>Icon sits next to text that already describes the action (default).</td>
                </tr>
                <tr>
                  <td><code>a11y: labeled</code></td>
                  <td>Adds a <code>title</code> prop that, when provided, renders <code>&lt;title&gt;</code> + <code>role="img"</code>.</td>
                  <td>Icon stands alone and carries meaning (e.g. a status indicator).</td>
                </tr>
                <tr>
                  <td><code>a11y: none</code></td>
                  <td>Leaves accessibility attributes untouched.</td>
                  <td>You handle a11y in the consumer.</td>
                </tr>
                <tr>
                  <td><code>color</code> prop</td>
                  <td>Replaces hard-coded stroke/fill values with a <code>color</code> prop defaulting to <code>currentColor</code>.</td>
                  <td>You want the icon to inherit text color.</td>
                </tr>
                <tr>
                  <td><code>size</code> prop</td>
                  <td>Replaces <code>width</code> / <code>height</code> with a single <code>size</code> prop.</td>
                  <td>You want to scale the icon from one prop.</td>
                </tr>
                <tr>
                  <td><code>stroke</code> prop</td>
                  <td>Extracts <code>stroke-width</code> into a prop.</td>
                  <td>Source is a stroked (outline) icon and you want to adjust line weight.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="cleaning" className="docs-section">
          <h2>What Vectorio cleans</h2>
          <p>Most SVGs exported from Figma, Sketch, or Illustrator carry noise that breaks or bloats downstream usage. Vectorio strips it automatically.</p>

          <h3>Removed</h3>
          <ul>
            <li><strong>Vendor namespaces</strong> — <code>sketch:</code>, <code>figma:</code>, <code>inkscape:</code>, <code>sodipodi:</code> attributes and elements.</li>
            <li><strong>Data attributes</strong> — any <code>data-*</code> attribute the exporter added.</li>
            <li><strong>XML prolog and comments</strong> — <code>&lt;?xml ... ?&gt;</code> and <code>&lt;!-- ... --&gt;</code>.</li>
            <li><strong>Redundant namespaces</strong> — <code>xmlns:xlink</code>, unused <code>xmlns</code> declarations on inner elements.</li>
            <li><strong>Empty groups</strong> — <code>&lt;g&gt;</code> elements with no children or attributes.</li>
            <li><strong>Root-level noise</strong> — non-standard attributes on the root <code>&lt;svg&gt;</code> that aren't in the whitelist.</li>
          </ul>

          <h3>ID collision prefixing</h3>
          <p>When multiple icons share <code>id="gradient-a"</code>, the second one on the page silently breaks — <code>url(#gradient-a)</code> resolves to the first match. Vectorio prefixes every <code>id</code> with a deterministic 5-character hash of the source:</p>
          <pre className="docs-code"><code>{`<!-- before -->
<linearGradient id="gradient-a">...</linearGradient>
<rect fill="url(#gradient-a)" />

<!-- after -->
<linearGradient id="vA3f8q-gradient-a">...</linearGradient>
<rect fill="url(#vA3f8q-gradient-a)" />`}</code></pre>
          <p>The hash is derived from the SVG source, so the same input always produces the same IDs — diffs stay clean across rebuilds.</p>
        </section>

        <section id="props" className="docs-section">
          <h2>Auto-detected props</h2>
          <p>Vectorio scans the root SVG and decides which props make sense:</p>
          <ul>
            <li><strong>color</strong> — suggested when the SVG uses a solid stroke or fill. The prop defaults to <code>currentColor</code> so the icon inherits the surrounding text color.</li>
            <li><strong>size</strong> — suggested when <code>width</code> and <code>height</code> are set. Replaces both with a single numeric prop.</li>
            <li><strong>stroke</strong> — suggested when the SVG is a stroked (outline) icon. Extracts <code>stroke-width</code> into a prop.</li>
          </ul>
          <p>Each suggestion is a toggle — turn it off and Vectorio keeps the original value baked into the output. If your icon is multicolor (multiple different fills/strokes), the <code>color</code> prop is disabled automatically since there's no single value to extract.</p>
        </section>

        <section id="share-links" className="docs-section">
          <h2>Share links</h2>
          <p>The <strong>Share</strong> button in the Converter copies a URL like <code>/convert#s=H4sIAAAAA…</code> that restores your exact session: source SVG, framework, options, and component name.</p>

          <h3>How it works</h3>
          <ul>
            <li>Session state is serialized to JSON.</li>
            <li>Compressed with gzip (via the browser's <code>CompressionStream</code>).</li>
            <li>Encoded as URL-safe base64 into the URL hash.</li>
          </ul>

          <h3>What that means in practice</h3>
          <ul>
            <li><strong>Private by design.</strong> URL hashes are <em>never</em> sent to the server — the share link stays between you and whoever you paste it to.</li>
            <li><strong>Size limit.</strong> URLs larger than ~6,000 characters are rejected with a "too large" message. Trim the source or use Batch for large inputs.</li>
            <li><strong>Legacy links work.</strong> Old <code>/#s=…</code> links redirect automatically to <code>/convert#s=…</code>.</li>
          </ul>
        </section>

        <section id="privacy" className="docs-section">
          <h2>Privacy &amp; offline</h2>
          <p>After the initial page load, Vectorio makes zero network requests. No analytics, no telemetry, no error reporting. Your SVGs are parsed, cleaned, and converted entirely in your browser — the app is a single static bundle with no backend.</p>
          <p>Fonts load once from Google Fonts; after that, the browser caches them. Once the page is open, conversion works even if you drop your connection.</p>
          <p>The only persistent state is your theme preference (<code>light</code> / <code>dark</code>), stored in <code>localStorage</code>. Clearing site data resets it.</p>
        </section>

        <section id="faq" className="docs-section">
          <h2>FAQ</h2>

          <h3>Is there a license?</h3>
          <p>Yes — Vectorio is MIT-licensed. Generated component code is yours; use it in commercial products, modify freely, no attribution required.</p>

          <h3>How do I report a bug or request a feature?</h3>
          <p>Open an issue on <a href="https://github.com/berkinduz/vectorio" target="_blank" rel="noopener noreferrer">GitHub</a>. Include a minimal SVG reproducer if the bug is about parsing or cleaning.</p>

          <h3>Why is my icon not rendering correctly?</h3>
          <p>Most often: the SVG uses external references (<code>&lt;use href="external.svg#id" /&gt;</code>) that Vectorio can't inline, or it relies on CSS from a stylesheet that isn't bundled. Vectorio only handles self-contained SVGs.</p>
        </section>
      </article>
    </div>
  );
}
