# Vectorio

Turn SVGs into production-ready React, Vue, Svelte, or Solid components — with auto-detected props, optional TypeScript and Tailwind variants, and batch library generation. Runs entirely in your browser.

## Features

- **Converter** — paste/drop an SVG, get a clean component with auto-detected `color`, `size`, and `strokeWidth` props
- **Batch mode** — drop a folder or `.zip` of SVGs, download a tree-shakable library (`icons/`, `index.ts`, `README.md`) ready for your repo
- Four frameworks: React, Vue, Svelte, Solid
- TypeScript and Tailwind toggles
- Dark mode
- 100% client-side — nothing is uploaded

## Getting started

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Stack

Vite · React 19 · JSZip
