# Vectorio

Turn messy SVG exports into production-ready React, Vue, Svelte, or Solid components, then package whole folders as tree-shakable icon libraries. Vectorio runs entirely in your browser: no account, no upload, no backend.

![Vectorio social preview](public/og-image.png)

## Why Vectorio

Design tools export SVGs with useful shapes and a lot of production noise: vendor namespaces, `data-*` attributes, duplicate gradient IDs, hard-coded colors, and one-off dimensions. Vectorio gives you a quick place to inspect, clean, convert, share, and package those files before they enter your repo.

Use Vectorio when you need to:

- convert one SVG into a clean component without setting up a build pipeline
- compare React, Vue, Svelte, and Solid output from the same source
- strip design-tool noise while preserving self-contained SVG behavior
- prefix IDs so gradients, masks, and filters do not collide across icons
- generate a zip-ready icon library from a folder or `.zip`
- share a reproducible converter state without uploading the SVG

## Features

- **Single-file converter** — paste, drop, or browse an SVG and copy a clean component.
- **Batch mode** — drop a folder or `.zip` and download a library with component files, a barrel export, `package.json`, and README.
- **Four frameworks** — React, Vue, Svelte, and Solid from the same source SVG.
- **Production-minded cleanup** — strips exporter noise, removes empty groups, and prefixes referenced IDs.
- **Auto-detected props** — optional `color`, `size`, and `strokeWidth` props based on the source SVG.
- **Output options** — TypeScript, Tailwind classes, accessibility modes, React `forwardRef`, React `memo`, default exports, and component prefix/suffix.
- **Share links** — converter state is compressed into the URL hash; the hash is not sent to a server.
- **Private by design** — no uploads, no telemetry, no account.

## When to use it

Vectorio is not trying to replace build tools such as SVGR in a mature pipeline. It is most useful before that point: when you are cleaning design exports, validating output, making a quick component, sharing a broken SVG with a teammate, or turning a folder of product icons into a first-pass library.

For fully automated repo workflows, keep using your build pipeline. For messy source SVGs and fast inspection, use Vectorio first.

## Getting started

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Run the launch checks:

```bash
npm run lint
npm test
npm run build
npm run smoke
```

## Stack

Vite · React 19 · JSZip

## Privacy

Vectorio is a static client-side app. SVG parsing, cleanup, generation, zipping, and share-link encoding happen in the browser. The app has no backend and does not upload SVGs.

## Roadmap

- Optional SVGO-powered optimization mode
- CLI / npm package for repo automation
