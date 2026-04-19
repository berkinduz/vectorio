// Vektorio — SVG parsing + multi-framework code generation

const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
</svg>`;

  function parseSvg(source) {
    const trimmed = (source || "").trim();
    if (!trimmed) return { ok: false, error: "empty" };
    try {
      const doc = new DOMParser().parseFromString(trimmed, "image/svg+xml");
      const err = doc.querySelector("parsererror");
      if (err) return { ok: false, error: "parse" };
      const root = doc.documentElement;
      if (!root || root.tagName.toLowerCase() !== "svg") {
        return { ok: false, error: "not-svg" };
      }
      const attrs = {};
      for (const a of root.attributes) attrs[a.name] = a.value;
      // detect possible props
      const props = {
        color: /currentColor/i.test(trimmed) || !!attrs.fill || !!attrs.stroke,
        size: !!(attrs.width || attrs.height),
        stroke: !!attrs["stroke-width"] || /stroke-width="/i.test(trimmed),
      };
      // inner markup
      const inner = Array.from(root.childNodes)
        .map((n) => n.outerHTML || (n.nodeValue || "").trim())
        .filter(Boolean)
        .join("\n  ");
      return {
        ok: true,
        attrs,
        inner,
        viewBox: attrs.viewBox || `0 0 ${attrs.width || 24} ${attrs.height || 24}`,
        width: attrs.width || 24,
        height: attrs.height || 24,
        strokeWidth: attrs["stroke-width"] || "2",
        fill: attrs.fill || "none",
        stroke: attrs.stroke || "currentColor",
        props,
        raw: trimmed,
      };
    } catch (e) {
      return { ok: false, error: "exception" };
    }
  }

  // Replace literal attribute values inside svg inner with bindings.
  // Framework-specific binding syntax is applied by passing a `bind` fn.
  function rewriteInner(inner, opts, bind) {
    let out = inner;
    if (opts.color) {
      // keep currentColor; leave visuals alone — color prop is applied at root
    }
    if (opts.stroke) {
      out = out.replace(/stroke-width="[^"]*"/g, bind("stroke-width", "strokeWidth"));
    }
    return out;
  }

  function indent(str, n) {
    const pad = " ".repeat(n);
    return str.split("\n").map((l) => pad + l).join("\n");
  }

  // ---- React ----
  function genReact(parsed, config) {
    const { name, ts, tw, props } = config;
    const typeSig = ts ? `: React.SVGProps<SVGSVGElement> & IconProps` : "";
    const propsDecl = [];
    const rootAttrs = [];

    // base root attrs
    rootAttrs.push(`xmlns="http://www.w3.org/2000/svg"`);
    rootAttrs.push(`viewBox="${parsed.viewBox}"`);
    rootAttrs.push(`fill="${parsed.fill}"`);

    if (props.size) {
      propsDecl.push({ name: "size", def: "24", type: "number | string" });
      rootAttrs.push(`width={size}`);
      rootAttrs.push(`height={size}`);
    } else {
      rootAttrs.push(`width="${parsed.width}"`);
      rootAttrs.push(`height="${parsed.height}"`);
    }

    if (props.color) {
      propsDecl.push({ name: "color", def: '"currentColor"', type: "string" });
      rootAttrs.push(`stroke={color}`);
    } else {
      rootAttrs.push(`stroke="${parsed.stroke}"`);
    }

    if (props.stroke) {
      propsDecl.push({ name: "strokeWidth", def: parsed.strokeWidth, type: "number | string" });
    }
    rootAttrs.push(`strokeLinecap="round"`);
    rootAttrs.push(`strokeLinejoin="round"`);
    if (tw) rootAttrs.push(`className={\`inline-block shrink-0 \${className ?? ""}\`}`);
    rootAttrs.push(`{...rest}`);

    const destruct =
      propsDecl.map((p) => `${p.name} = ${p.def}`).join(", ") +
      (tw ? `${propsDecl.length ? ", " : ""}className` : "") +
      (propsDecl.length || tw ? ", " : "") +
      "...rest";

    const typeBlock = ts
      ? `interface IconProps {\n${propsDecl
          .map((p) => `  ${p.name}?: ${p.type};`)
          .join("\n")}${tw ? `\n  className?: string;` : ""}\n}\n\n`
      : "";

    const bind = (attr, propName) => `${attr}={${propName}}`;
    const inner = rewriteInner(parsed.inner, props, bind);

    const importLine = ts ? `import * as React from "react";\n\n` : `import React from "react";\n\n`;

    return (
      importLine +
      typeBlock +
      `export function ${name}({ ${destruct} }${typeSig}) {\n` +
      `  return (\n` +
      `    <svg\n` +
      rootAttrs.map((a) => `      ${a}`).join("\n") +
      `\n    >\n` +
      indent(inner, 6) +
      `\n    </svg>\n` +
      `  );\n` +
      `}\n`
    );
  }

  // ---- Vue ----
  function genVue(parsed, config) {
    const { name, ts, tw, props } = config;
    const propsObj = [];
    const rootAttrs = [`xmlns="http://www.w3.org/2000/svg"`, `:viewBox="'${parsed.viewBox}'"`];

    if (props.size) {
      propsObj.push({ name: "size", def: `{ type: [Number, String], default: 24 }` });
      rootAttrs.push(`:width="size"`);
      rootAttrs.push(`:height="size"`);
    } else {
      rootAttrs.push(`width="${parsed.width}"`);
      rootAttrs.push(`height="${parsed.height}"`);
    }

    rootAttrs.push(`fill="${parsed.fill}"`);

    if (props.color) {
      propsObj.push({ name: "color", def: `{ type: String, default: 'currentColor' }` });
      rootAttrs.push(`:stroke="color"`);
    } else {
      rootAttrs.push(`stroke="${parsed.stroke}"`);
    }

    if (props.stroke) {
      propsObj.push({
        name: "strokeWidth",
        def: `{ type: [Number, String], default: ${parsed.strokeWidth} }`,
      });
    }
    rootAttrs.push(`stroke-linecap="round"`);
    rootAttrs.push(`stroke-linejoin="round"`);
    if (tw) rootAttrs.push(`class="inline-block shrink-0"`);

    const bind = (attr, propName) => `:${attr}="${propName}"`;
    const inner = rewriteInner(parsed.inner, props, bind);

    const lang = ts ? ` lang="ts"` : "";
    const defineProps = propsObj.length
      ? (ts
          ? `const props = withDefaults(defineProps<{\n${propsObj
              .map((p) => `  ${p.name}?: ${p.name === "color" ? "string" : "number | string"};`)
              .join("\n")}\n}>(), {\n${propsObj
              .map((p) => {
                const d = p.name === "color" ? `'currentColor'` : p.name === "size" ? 24 : parsed.strokeWidth;
                return `  ${p.name}: ${d},`;
              })
              .join("\n")}\n});`
          : `defineProps({\n${propsObj.map((p) => `  ${p.name}: ${p.def},`).join("\n")}\n});`)
      : "";

    return (
      `<template>\n` +
      `  <svg\n` +
      rootAttrs.map((a) => `    ${a}`).join("\n") +
      `\n  >\n` +
      indent(inner, 4) +
      `\n  </svg>\n` +
      `</template>\n\n` +
      `<script setup${lang}>\n` +
      (defineProps ? defineProps + "\n" : "") +
      `</script>\n`
    );
  }

  // ---- Svelte ----
  function genSvelte(parsed, config) {
    const { name, ts, tw, props } = config;
    const script = [];
    const rootAttrs = [`xmlns="http://www.w3.org/2000/svg"`, `viewBox="${parsed.viewBox}"`];

    if (props.size) {
      script.push(ts ? `export let size: number | string = 24;` : `export let size = 24;`);
      rootAttrs.push(`width={size}`);
      rootAttrs.push(`height={size}`);
    } else {
      rootAttrs.push(`width="${parsed.width}"`);
      rootAttrs.push(`height="${parsed.height}"`);
    }

    rootAttrs.push(`fill="${parsed.fill}"`);

    if (props.color) {
      script.push(ts ? `export let color: string = "currentColor";` : `export let color = "currentColor";`);
      rootAttrs.push(`stroke={color}`);
    } else {
      rootAttrs.push(`stroke="${parsed.stroke}"`);
    }

    if (props.stroke) {
      script.push(
        ts
          ? `export let strokeWidth: number | string = ${parsed.strokeWidth};`
          : `export let strokeWidth = ${parsed.strokeWidth};`
      );
    }
    rootAttrs.push(`stroke-linecap="round"`);
    rootAttrs.push(`stroke-linejoin="round"`);
    if (tw) rootAttrs.push(`class="inline-block shrink-0"`);

    const bind = (attr, propName) => `${attr}={${propName}}`;
    const inner = rewriteInner(parsed.inner, props, bind);

    const scriptTag = script.length
      ? `<script${ts ? ' lang="ts"' : ""}>\n${script.map((s) => "  " + s).join("\n")}\n</script>\n\n`
      : "";

    return (
      scriptTag +
      `<svg\n` +
      rootAttrs.map((a) => "  " + a).join("\n") +
      `\n>\n` +
      indent(inner, 2) +
      `\n</svg>\n`
    );
  }

  // ---- Solid ----
  function genSolid(parsed, config) {
    const { name, ts, tw, props } = config;
    const propsDecl = [];
    const rootAttrs = [];

    rootAttrs.push(`xmlns="http://www.w3.org/2000/svg"`);
    rootAttrs.push(`viewBox="${parsed.viewBox}"`);
    rootAttrs.push(`fill="${parsed.fill}"`);

    if (props.size) {
      propsDecl.push({ name: "size", def: "24", type: "number | string" });
      rootAttrs.push(`width={props.size}`);
      rootAttrs.push(`height={props.size}`);
    } else {
      rootAttrs.push(`width="${parsed.width}"`);
      rootAttrs.push(`height="${parsed.height}"`);
    }

    if (props.color) {
      propsDecl.push({ name: "color", def: `"currentColor"`, type: "string" });
      rootAttrs.push(`stroke={props.color}`);
    } else {
      rootAttrs.push(`stroke="${parsed.stroke}"`);
    }

    if (props.stroke) {
      propsDecl.push({ name: "strokeWidth", def: parsed.strokeWidth, type: "number | string" });
    }
    rootAttrs.push(`stroke-linecap="round"`);
    rootAttrs.push(`stroke-linejoin="round"`);
    if (tw) rootAttrs.push(`class="inline-block shrink-0"`);

    const bind = (attr, propName) => `${attr}={props.${propName}}`;
    const inner = rewriteInner(parsed.inner, props, bind);

    const typeLine = ts
      ? `type IconProps = {\n${propsDecl.map((p) => `  ${p.name}?: ${p.type};`).join("\n")}\n};\n\n`
      : "";

    const destructDefaults = propsDecl.length
      ? `  const merged = mergeProps({ ${propsDecl.map((p) => `${p.name}: ${p.def}`).join(", ")} }, props);\n`
      : "";

    const importLine = propsDecl.length
      ? `import { mergeProps } from "solid-js";\n\n`
      : ``;

    const usedProps = propsDecl.length ? "merged" : "props";
    const rebound = rootAttrs.map((a) => a.replace(/props\./g, `${usedProps}.`));

    return (
      importLine +
      typeLine +
      `export function ${name}(props${ts ? ": IconProps" : ""}) {\n` +
      destructDefaults +
      `  return (\n` +
      `    <svg\n` +
      rebound.map((a) => `      ${a}`).join("\n") +
      `\n    >\n` +
      indent(inner.replace(/props\./g, `${usedProps}.`), 6) +
      `\n    </svg>\n` +
      `  );\n` +
      `}\n`
    );
  }

  const generators = { react: genReact, vue: genVue, svelte: genSvelte, solid: genSolid };

  function generate(framework, parsed, config) {
    const fn = generators[framework] || genReact;
    return fn(parsed, config);
  }

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function highlight(line) {
    // Tokenize the raw line first, then emit HTML once so tokens can't corrupt
    // each other (earlier passes were re-matching the spans they just inserted).
    const n = line.length;
    const marks = new Array(n).fill(null);
    const claim = (start, end, cls) => {
      for (let i = start; i < end; i++) if (marks[i]) return;
      for (let i = start; i < end; i++) marks[i] = cls;
    };
    const scan = (re, cls, group = 0) => {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        const offset = group === 0 ? m.index : m.index + m[0].indexOf(m[group]);
        claim(offset, offset + m[group].length, cls);
        if (m[0].length === 0) re.lastIndex++;
      }
    };

    scan(/\/\/.*$/g, "tk-com");
    scan(/"[^"]*"|'[^']*'|`[^`]*`/g, "tk-str");
    scan(/\b\d+(?:\.\d+)?\b/g, "tk-num");
    scan(/<\/?[\w-]+|\/?>/g, "tk-tag");
    scan(/(\s|^)([a-zA-Z][a-zA-Z0-9-]*)(?==)/g, "tk-attr", 2);
    scan(/\b(?:import|export|function|const|let|var|return|from|default|interface|type|as|if|else|true|false|null|undefined)\b/g, "tk-kw");

    let out = "";
    let i = 0;
    while (i < n) {
      const cls = marks[i];
      if (!cls) {
        out += escapeHtml(line[i]);
        i++;
        continue;
      }
      let j = i;
      while (j < n && marks[j] === cls) j++;
      out += `<span class="${cls}">${escapeHtml(line.slice(i, j))}</span>`;
      i = j;
    }
    return out;
  }

  function renderCode(code, lang) {
    const lines = code.split("\n");
    return lines.map((l) => `<span class="ln">${highlight(l, lang) || "&nbsp;"}</span>`).join("");
  }

  // ---- sample icons for batch mode ----
  const SAMPLE_ICONS = [
    { name: "arrow-right", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>` },
    { name: "check", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>` },
    { name: "close", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>` },
    { name: "search", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>` },
    { name: "settings", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 012.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 012.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>` },
    { name: "heart", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 000-7.6z"/></svg>` },
    { name: "download", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>` },
    { name: "upload", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>` },
    { name: "star", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.1 6.3 7 1-5 4.9 1.1 6.9L12 17.8 5.8 21l1.2-6.9-5-5 7-1z"/></svg>` },
    { name: "bell", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"/></svg>` },
    { name: "calendar", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>` },
    { name: "mail", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 6 10-6"/></svg>` },
    { name: "user", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` },
    { name: "trash", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>` },
    { name: "edit", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.4 2.6a2 2 0 112.8 2.8L12 14.6l-4 1 1-4z"/></svg>` },
    { name: "link", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.8 1.7"/><path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.8-1.7"/></svg>` },
    { name: "eye", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>` },
    { name: "lock", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>` },
    { name: "plus", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>` },
    { name: "minus", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>` },
    { name: "chevron-down", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>` },
    { name: "chevron-up", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>` },
    { name: "menu", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>` },
    { name: "grid", svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>` },
  ];

export const Vek = {
  DEFAULT_SVG,
  parseSvg,
  generate,
  highlight,
  renderCode,
  escapeHtml,
  SAMPLE_ICONS,
};
