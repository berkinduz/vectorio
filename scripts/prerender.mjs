// Emits per-route HTML shells with route-specific <title>/meta/og/canonical,
// per-route JSON-LD structured data, and a crawler-readable <noscript> body
// summarizing each route. We don't SSR the React tree — Google JS-crawls SPAs,
// and this gives us flawless head tags + rich results without the complexity.
import fs from "node:fs/promises";
import path from "node:path";

const ORIGIN = "https://vectorio.app";
const DIST = path.resolve("dist");

const ROUTES = {
  "/convert": {
    title: "Convert SVG to React, Vue, Svelte, Solid component — Vectorio",
    desc: "Paste or drop an SVG. Get a clean, typed component for React, Vue, Svelte, or Solid — with auto-detected props and a live preview. No CLI, no account.",
    image: "/converter.jpg",
    imageType: "image/jpeg",
    imageWidth: "1280",
    imageHeight: "630",
    imageAlt: "Vectorio Converter screen with SVG preview and generated component output.",
    h1: "Convert SVG to React, Vue, Svelte, or Solid component",
    body: `
      <p>Vectorio's single-file converter takes any SVG — including messy Figma or Sketch exports — and produces a clean, typed component for React, Vue, Svelte, or Solid. Props like <code>color</code>, <code>size</code>, and <code>stroke</code> are auto-detected from the source markup.</p>
      <h2>What the converter does</h2>
      <ul>
        <li>Paste, drop, or browse an SVG file</li>
        <li>Pick React, Vue, Svelte, or Solid — with optional TypeScript</li>
        <li>Toggle Tailwind class support and <code>forwardRef</code></li>
        <li>Auto-cleaned output: prolog removed, namespace attrs stripped, IDs prefixed to prevent collisions</li>
        <li>Copy the generated component, or share the whole session via URL</li>
      </ul>
    `,
    schemaName: "Vectorio — SVG Converter",
    schemaDesc: "Convert an SVG into a React, Vue, Svelte, or Solid component with auto-detected props and a live preview.",
  },
  "/batch": {
    title: "SVG icon library generator — Vectorio",
    desc: "Drop a folder of SVGs. Vectorio bundles them into a tree-shakable icon library with typed components, package.json, and README. Runs in your browser.",
    image: "/batch.jpg",
    imageType: "image/jpeg",
    imageWidth: "1232",
    imageHeight: "720",
    imageAlt: "Vectorio Batch screen generating an icon library from multiple SVG files.",
    h1: "Generate a tree-shakable SVG icon library from a folder",
    body: `
      <p>Vectorio's batch mode turns a folder of SVGs into a production-ready icon library — one typed component per icon, a barrel <code>index</code> export, <code>package.json</code>, and a README. Runs entirely in your browser; nothing is uploaded.</p>
      <h2>What batch mode produces</h2>
      <ul>
        <li>One component file per SVG in your folder — React, Vue, Svelte, or Solid</li>
        <li>Tree-shakable barrel <code>index</code> for named imports</li>
        <li>Generated <code>package.json</code> with correct entry points</li>
        <li>README with install and usage examples</li>
        <li>Auto-cleans Figma/Sketch export junk and prefixes IDs to prevent collisions</li>
        <li>Per-icon copy, download, and remove actions for quick editing</li>
        <li>Download the whole library as a zip</li>
      </ul>
    `,
    schemaName: "Vectorio — SVG Icon Library Generator",
    schemaDesc: "Turn a folder of SVGs into a tree-shakable icon library with typed components, package.json, and README.",
  },
  "/docs": {
    title: "Documentation — Vectorio",
    desc: "Current Vectorio documentation: converter, batch mode, SVG cleaning behavior, advanced output options, framework output, share links, and privacy.",
    image: "/og-image.png",
    imageType: "image/png",
    imageWidth: "1200",
    imageHeight: "630",
    imageAlt: "Vectorio — Convert SVGs into clean components.",
    h1: "Vectorio documentation — how it works",
    body: `
      <p>Full documentation for Vectorio: how the converter and batch modes work, every option and what it does, what the SVG cleaner removes, how auto-detected props are chosen, advanced output options, share link mechanics, and privacy guarantees.</p>
      <h2>Covered in the docs</h2>
      <ul>
        <li>Quick start — choose Converter or Batch, load SVGs, copy or export</li>
        <li>Converter reference — inputs, preview metadata, cleaner summary, samples</li>
        <li>Advanced output — prefix/suffix, React memo, React/Solid default exports</li>
        <li>Batch reference — folder/zip input, filtering, per-icon actions, bulk rename, export structure</li>
        <li>Cleaning — structural cleanup, ID prefixing, and clean-vs-optimize behavior</li>
        <li>Auto-detected props — color, size, and strokeWidth behavior</li>
        <li>Framework output — React, Vue, Svelte, and Solid output differences</li>
        <li>Share links — gzip+base64url encoding, included settings, URL limits, privacy</li>
        <li>Privacy — no SVG upload, aggregate page analytics only, fully client-side conversion</li>
      </ul>
    `,
    schemaName: "Vectorio Documentation",
    schemaDesc: "Complete reference for Vectorio's SVG converter and batch icon library generator — cleaning behavior, advanced output, framework output, share links, and privacy.",
    isArticle: true,
  },
};

const escAttr = (s) => s.replace(/"/g, "&quot;");

const replaceAttr = (html, tagRe, attrName, value) =>
  html.replace(tagRe, (m) => m.replace(new RegExp(`${attrName}="[^"]*"`), `${attrName}="${escAttr(value)}"`));

const base = await fs.readFile(path.join(DIST, "index.html"), "utf8");

for (const [route, meta] of Object.entries(ROUTES)) {
  const canonical = ORIGIN + route;
  const image = ORIGIN + meta.image;
  let html = base.replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`);
  html = replaceAttr(html, /<meta name="description"[^>]*>/, "content", meta.desc);
  html = replaceAttr(html, /<meta property="og:title"[^>]*>/, "content", meta.title);
  html = replaceAttr(html, /<meta property="og:description"[^>]*>/, "content", meta.desc);
  html = replaceAttr(html, /<meta property="og:url"[^>]*>/, "content", canonical);
  html = replaceAttr(html, /<meta property="og:image"[^>]*>/, "content", image);
  html = replaceAttr(html, /<meta property="og:image:type"[^>]*>/, "content", meta.imageType);
  html = replaceAttr(html, /<meta property="og:image:width"[^>]*>/, "content", meta.imageWidth);
  html = replaceAttr(html, /<meta property="og:image:height"[^>]*>/, "content", meta.imageHeight);
  html = replaceAttr(html, /<meta property="og:image:alt"[^>]*>/, "content", meta.imageAlt);
  html = replaceAttr(html, /<meta name="twitter:title"[^>]*>/, "content", meta.title);
  html = replaceAttr(html, /<meta name="twitter:description"[^>]*>/, "content", meta.desc);
  html = replaceAttr(html, /<meta name="twitter:url"[^>]*>/, "content", canonical);
  html = replaceAttr(html, /<meta name="twitter:image"[^>]*>/, "content", image);
  html = replaceAttr(html, /<meta name="twitter:image:alt"[^>]*>/, "content", meta.imageAlt);
  html = replaceAttr(html, /<link rel="canonical"[^>]*>/, "href", canonical);

  // Append per-route JSON-LD (WebPage + BreadcrumbList) right before </head>
  const webPageNode = {
    "@type": meta.isArticle ? ["WebPage", "TechArticle"] : "WebPage",
    "@id": canonical + "#webpage",
    url: canonical,
    name: meta.schemaName,
    description: meta.schemaDesc,
    isPartOf: { "@id": ORIGIN + "/#website" },
    inLanguage: "en",
    primaryImageOfPage: { "@id": image },
    ...(meta.isArticle ? {
      headline: meta.h1,
      author: { "@type": "Person", name: "Berkin Düz" },
      about: { "@id": ORIGIN + "/#app" },
    } : {}),
  };
  const pageSchema = {
    "@context": "https://schema.org",
    "@graph": [
      webPageNode,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN + "/" },
          { "@type": "ListItem", position: 2, name: meta.schemaName, item: canonical },
        ],
      },
    ],
  };
  const schemaTag = `<script type="application/ld+json">${JSON.stringify(pageSchema)}</script>`;
  html = html.replace(/<\/head>/, schemaTag + "\n  </head>");

  // Enrich the noscript block with route-specific crawlable content.
  const noscriptBody = `
      <div style="padding:48px;font-family:system-ui,sans-serif;max-width:720px;margin:0 auto;line-height:1.6;">
        <h1>${meta.h1}</h1>
        ${meta.body.trim()}
        <p>Vectorio needs JavaScript enabled to parse SVGs and generate components. Please enable JavaScript and reload.</p>
        <nav aria-label="Primary pages">
          <a href="/">Overview</a>
          <a href="/convert">Converter</a>
          <a href="/batch">Batch</a>
          <a href="/docs">Docs</a>
        </nav>
      </div>`;
  html = html.replace(/<noscript>[\s\S]*?<\/noscript>/, `<noscript>${noscriptBody}\n    </noscript>`);

  const outDir = path.join(DIST, route.slice(1));
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, "index.html"), html);
  console.log(`prerendered ${route} → ${path.relative(process.cwd(), path.join(outDir, "index.html"))}`);
}

// Static 404 page. Vercel auto-serves this with a real 404 status when no
// route matches — we deliberately don't ship the React bundle here so unknown
// URLs return fast HTML, no flash of landing-page content, and SEO crawlers
// see a proper 404 instead of a 200 SPA fallback.
{
  const notFoundCanonical = ORIGIN + "/404";
  const notFoundTitle = "Page not found — Vectorio";
  const notFoundDesc = "The page you tried to open does not exist on Vectorio. Open the converter, batch library generator, or documentation to continue.";
  let html = base.replace(/<title>[^<]*<\/title>/, `<title>${notFoundTitle}</title>`);
  html = replaceAttr(html, /<meta name="description"[^>]*>/, "content", notFoundDesc);
  html = replaceAttr(html, /<meta property="og:title"[^>]*>/, "content", notFoundTitle);
  html = replaceAttr(html, /<meta property="og:description"[^>]*>/, "content", notFoundDesc);
  html = replaceAttr(html, /<meta property="og:url"[^>]*>/, "content", notFoundCanonical);
  html = replaceAttr(html, /<meta name="twitter:title"[^>]*>/, "content", notFoundTitle);
  html = replaceAttr(html, /<meta name="twitter:description"[^>]*>/, "content", notFoundDesc);
  html = replaceAttr(html, /<meta name="twitter:url"[^>]*>/, "content", notFoundCanonical);
  html = replaceAttr(html, /<link rel="canonical"[^>]*>/, "href", notFoundCanonical);
  html = html.replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex, follow" />');

  // Strip the React script and JSON-LD graph — the 404 is a static page.
  html = html.replace(/<script type="module"[^>]*><\/script>/g, "");
  html = html.replace(/<script src="\/assets\/[^"]*"[^>]*><\/script>/g, "");
  html = html.replace(/<link rel="modulepreload"[^>]*>/g, "");

  const notFoundBody = `
    <main class="not-found-page">
      <div class="not-found-inner">
        <div class="not-found-eyebrow">404</div>
        <h1 class="not-found-title">This page slipped through the export.</h1>
        <p class="not-found-sub">The URL you opened does not exist. Use one of these to continue:</p>
        <nav class="not-found-links">
          <a href="/">Home</a>
          <a href="/convert">Converter</a>
          <a href="/batch">Batch</a>
          <a href="/docs">Docs</a>
        </nav>
      </div>
    </main>
  `;
  html = html.replace(/<div id="root"><\/div>[\s\S]*?<\/noscript>/, `<div id="root">${notFoundBody}</div>\n    <noscript></noscript>`);

  await fs.writeFile(path.join(DIST, "404.html"), html);
  console.log("wrote 404.html");
}

// Regenerate sitemap with today's lastmod so it doesn't rot between deploys.
const today = new Date().toISOString().slice(0, 10);
const sitemapRoutes = [
  { loc: ORIGIN + "/", priority: "1.0" },
  { loc: ORIGIN + "/convert", priority: "0.9" },
  { loc: ORIGIN + "/batch", priority: "0.9" },
  { loc: ORIGIN + "/docs", priority: "0.7" },
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapRoutes.map((r) => `  <url>
    <loc>${r.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;
await fs.writeFile(path.join(DIST, "sitemap.xml"), sitemap);
console.log(`wrote sitemap.xml (lastmod=${today})`);
