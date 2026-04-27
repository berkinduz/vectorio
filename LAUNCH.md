# Vectorio Launch Checklist

Use this before sharing the project publicly.

## Local checks

```bash
npm run lint
npm test
npm run build
npm run smoke
```

## Routes

- `/`
- `/convert`
- `/batch`
- `/docs`
- `/robots.txt`
- `/sitemap.xml`
- `/og-image.png`

## GitHub polish

- Repository description: `Private browser tool for converting messy SVG exports into React, Vue, Svelte, or Solid components and icon libraries.`
- Website URL: `https://vectorio.app` until `vectorio.app` is connected.
- Suggested topics: `svg`, `react`, `vue`, `svelte`, `solid`, `icons`, `svg-converter`, `developer-tools`, `vite`.

## Known limitations

- Vectorio expects self-contained SVG markup. External stylesheet references and external `<use href="...">` targets are not inlined.
- Current cleaning is structural, not SVGO-style byte optimization.
- Share links are limited by browser URL length; very large SVGs may be too large to share.

## Domain migration

When `vectorio.app` is ready:

- Update `ORIGIN` in `src/App.jsx` and `scripts/prerender.mjs`.
- Update canonical, Open Graph, Twitter, and JSON-LD URLs in `index.html`.
- Update `public/robots.txt`, `public/sitemap.xml`, `package.json` homepage, README, and this checklist.
- Run `npm run build && npm run smoke`.
