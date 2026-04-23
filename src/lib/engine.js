// Vektorio — SVG parsing + multi-framework code generation

const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
</svg>`;

  // Attributes we strip from SVG root + children during cleaning.
  // These come from Figma/Illustrator/Sketch exports and add noise without value.
  const CLEAN_STRIP_ATTRS = new Set([
    "id", // we re-add prefixed ids below for referenced elements only
    "data-name",
    "xmlns:xlink", // xlink is deprecated in SVG2
    "xml:space",
    "enable-background",
    "xmlns:sketch",
    "xmlns:figma",
    "xmlns:xd",
    "sketch:type",
    "inkscape:label",
    "inkscape:groupmode",
    "sodipodi:nodetypes",
  ]);

  const TRIVIAL_COLORS = new Set([
    "none", "transparent", "currentcolor", "inherit", "",
  ]);

  // Attributes that should be kept on root svg.
  const ROOT_WHITELIST = new Set([
    "xmlns", "viewBox", "width", "height", "fill", "stroke",
    "stroke-width", "stroke-linecap", "stroke-linejoin",
    "stroke-miterlimit", "stroke-opacity", "fill-opacity",
    "fill-rule", "clip-rule", "preserveAspectRatio",
  ]);

  // Collect ids that are referenced via url(#x) / href="#x" so we only keep those.
  function collectReferencedIds(svgString) {
    const refs = new Set();
    const re1 = /url\(#([^)]+)\)/g;
    const re2 = /(?:xlink:)?href=["']#([^"']+)["']/g;
    let m;
    while ((m = re1.exec(svgString))) refs.add(m[1]);
    while ((m = re2.exec(svgString))) refs.add(m[1]);
    return refs;
  }

  // Clean an element tree in place: drop junk attrs, remove empty <g>, prefix ids.
  // `stripColorFromChildren` — when color is bound at the root, remove hardcoded
  // stroke/fill attrs from children so the root binding isn't overridden.
  function cleanElement(el, prefix, referenced, opts = {}) {
    const { iconType } = opts;
    // Remove comment and processing-instruction siblings — they stay as text nodes otherwise.
    const toRemove = [];
    for (const child of el.childNodes) {
      if (child.nodeType === 8 /* comment */ || child.nodeType === 7 /* PI */) {
        toRemove.push(child);
      }
    }
    toRemove.forEach((c) => c.parentNode?.removeChild(c));

    // Attribute cleanup.
    const attrsToRemove = [];
    for (const attr of Array.from(el.attributes || [])) {
      const name = attr.name;
      // xmlns belongs on root only — DOMParser clones it onto every child on serialize.
      if (name === "xmlns" || name.startsWith("xmlns:")) { attrsToRemove.push(name); continue; }
      if (name.startsWith("data-")) { attrsToRemove.push(name); continue; }
      if (name.startsWith("sketch:") || name.startsWith("inkscape:") || name.startsWith("sodipodi:") || name.startsWith("figma:")) {
        attrsToRemove.push(name); continue;
      }
      // Drop hardcoded stroke/fill on children when the root is binding them — otherwise
      // the child value overrides the prop-bound root value.
      if (iconType === "stroke" && (name === "stroke" || name === "stroke-width" || name === "stroke-linecap" || name === "stroke-linejoin") && el !== opts.root) {
        const v = attr.value.trim().toLowerCase();
        if (name === "stroke" && (TRIVIAL_COLORS.has(v) || v.startsWith("#") || v.startsWith("rgb") || v.startsWith("hsl") || v === "black" || v === "white")) {
          attrsToRemove.push(name); continue;
        }
        if (name !== "stroke") { attrsToRemove.push(name); continue; }
      }
      if (iconType === "fill" && name === "fill" && el !== opts.root) {
        const v = attr.value.trim().toLowerCase();
        if (TRIVIAL_COLORS.has(v) || v.startsWith("#") || v.startsWith("rgb") || v.startsWith("hsl") || v === "black" || v === "white") {
          attrsToRemove.push(name); continue;
        }
      }
      if (CLEAN_STRIP_ATTRS.has(name)) {
        if (name === "id") {
          if (!referenced.has(attr.value)) attrsToRemove.push(name);
          else el.setAttribute("id", `${prefix}-${attr.value}`);
        } else {
          attrsToRemove.push(name);
        }
      }
    }
    attrsToRemove.forEach((n) => el.removeAttribute(n));

    // Rewrite url(#x) and href="#x" references to the prefixed form.
    for (const attr of Array.from(el.attributes || [])) {
      if (/^(xlink:)?href$/.test(attr.name) && attr.value.startsWith("#")) {
        const id = attr.value.slice(1);
        if (referenced.has(id)) el.setAttribute(attr.name, `#${prefix}-${id}`);
      } else if (attr.value && attr.value.includes("url(#")) {
        el.setAttribute(
          attr.name,
          attr.value.replace(/url\(#([^)]+)\)/g, (_, id) =>
            referenced.has(id) ? `url(#${prefix}-${id})` : `url(#${id})`
          )
        );
      }
    }

    // Recurse into children.
    for (const child of Array.from(el.children || [])) {
      cleanElement(child, prefix, referenced, opts);
    }

    // Drop empty <g> with no attributes (Figma leaves a lot of these).
    if (el.tagName && el.tagName.toLowerCase() === "g" && el.attributes.length === 0 && el.children.length === 0) {
      el.parentNode?.removeChild(el);
    }
  }

  // Extract distinct non-trivial colors used in the icon — for multi-color detection.
  function detectColors(root) {
    const colors = new Set();
    const walk = (el) => {
      for (const attr of Array.from(el.attributes || [])) {
        if (attr.name === "fill" || attr.name === "stroke") {
          const v = attr.value.trim().toLowerCase();
          if (!TRIVIAL_COLORS.has(v)) colors.add(v);
        }
        if (attr.name === "style") {
          // style="fill:#abc; stroke:#def"
          const styleRe = /(fill|stroke)\s*:\s*([^;]+)/gi;
          let m;
          while ((m = styleRe.exec(attr.value))) {
            const v = m[2].trim().toLowerCase();
            if (!TRIVIAL_COLORS.has(v)) colors.add(v);
          }
        }
      }
      for (const c of Array.from(el.children || [])) walk(c);
    };
    walk(root);
    return Array.from(colors);
  }

  // Deterministic id prefix from the source — so the same SVG cleans to the same output.
  function prefixFor(source) {
    let h = 0;
    for (let i = 0; i < source.length; i++) {
      h = ((h << 5) - h + source.charCodeAt(i)) | 0;
    }
    return "v" + Math.abs(h).toString(36).slice(0, 5);
  }

  function parseSvg(source) {
    const trimmed = (source || "").trim();
    if (!trimmed) return { ok: false, error: "empty" };
    // Strip XML prolog and HTML comments up-front — DOMParser tolerates them
    // but they end up in the serialized output otherwise.
    const preClean = trimmed
      .replace(/<\?xml[^?]*\?>/g, "")
      .replace(/<!DOCTYPE[^>]*>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      // Design-tool namespaces (Sketch, Inkscape, Figma, Adobe) trip DOMParser
      // in strict svg mode if their xmlns binding is absent — strip them.
      .replace(/\s+(sketch|inkscape|sodipodi|figma|adobe-ns|ai|i):[\w-]+\s*=\s*"[^"]*"/gi, "")
      .replace(/\s+xmlns:(sketch|inkscape|sodipodi|figma|adobe-ns|ai|i)\s*=\s*"[^"]*"/gi, "")
      .trim();
    try {
      const doc = new DOMParser().parseFromString(preClean, "image/svg+xml");
      const err = doc.querySelector("parsererror");
      if (err) return { ok: false, error: "parse" };
      const root = doc.documentElement;
      if (!root || root.tagName.toLowerCase() !== "svg") {
        return { ok: false, error: "not-svg" };
      }

      // Inspect first (before mutating tree) to determine icon type + colors.
      const rootAttrsPre = {};
      for (const a of root.attributes) rootAttrsPre[a.name] = a.value;
      const colors = detectColors(root);
      const multicolor = colors.length > 1;
      const rootFill = (rootAttrsPre.fill || "").toLowerCase();
      const rootStroke = (rootAttrsPre.stroke || "").toLowerCase();
      const hasAnyStroke = root.querySelector("[stroke]") !== null || !!rootAttrsPre.stroke;
      const iconType =
        rootFill === "none" && hasAnyStroke ? "stroke" :
        rootStroke && rootStroke !== "none" ? "stroke" :
        "fill";

      // Clean tree. For single-color icons, strip hardcoded child colors so the
      // root-bound color prop actually takes effect.
      const referenced = collectReferencedIds(preClean);
      const prefix = prefixFor(preClean);
      const cleanOpts = {
        root,
        iconType: multicolor ? null : iconType,
      };
      for (const child of Array.from(root.children)) {
        cleanElement(child, prefix, referenced, cleanOpts);
      }
      // Root attr cleanup (keep only whitelist + xmlns).
      for (const attr of Array.from(root.attributes)) {
        if (attr.name.startsWith("xmlns")) continue;
        if (!ROOT_WHITELIST.has(attr.name)) root.removeAttribute(attr.name);
      }

      const attrs = {};
      for (const a of root.attributes) attrs[a.name] = a.value;

      // Possible props to auto-enable.
      const props = {
        color: !multicolor, // refuse to auto-enable color on multi-color icons
        size: true,
        stroke: iconType === "stroke",
      };

      // Serialize cleaned inner. SVG children inherit the SVG namespace, so the
      // serializer may inject xmlns="http://www.w3.org/2000/svg" on each child
      // element — strip those since they're redundant inside an already-rooted svg.
      const inner = Array.from(root.childNodes)
        .map((n) => n.nodeType === 1 ? n.outerHTML : (n.nodeValue || "").trim())
        .filter(Boolean)
        .join("\n  ")
        .replace(/\s+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, "");

      // Derive viewBox from width/height if missing (and vice versa).
      let viewBox = attrs.viewBox;
      const w = attrs.width;
      const h = attrs.height;
      if (!viewBox) {
        const nw = parseFloat(w) || 24;
        const nh = parseFloat(h) || 24;
        viewBox = `0 0 ${nw} ${nh}`;
      }

      return {
        ok: true,
        attrs,
        inner,
        viewBox,
        width: w || 24,
        height: h || 24,
        strokeWidth: attrs["stroke-width"] || "2",
        fill: attrs.fill || (iconType === "stroke" ? "none" : "currentColor"),
        stroke: attrs.stroke || (iconType === "stroke" ? "currentColor" : "none"),
        iconType,
        colors,
        multicolor,
        props,
        raw: preClean,
        prefix,
      };
    } catch {
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
    const { name, ts, tw, props, a11y = "hidden", forwardRef = false } = config;
    const isStroke = parsed.iconType === "stroke";
    const typeSig = ts ? `: IconProps` : "";
    const propsDecl = [];
    const rootAttrs = [];

    rootAttrs.push(`xmlns="http://www.w3.org/2000/svg"`);
    rootAttrs.push(`viewBox="${parsed.viewBox}"`);

    if (props.size) {
      propsDecl.push({ name: "size", def: "24", type: "number | string" });
      rootAttrs.push(`width={size}`);
      rootAttrs.push(`height={size}`);
    } else {
      rootAttrs.push(`width="${parsed.width}"`);
      rootAttrs.push(`height="${parsed.height}"`);
    }

    if (isStroke) {
      rootAttrs.push(`fill="${parsed.fill}"`);
      if (props.color) {
        propsDecl.push({ name: "color", def: '"currentColor"', type: "string" });
        rootAttrs.push(`stroke={color}`);
      } else {
        rootAttrs.push(`stroke="${parsed.stroke}"`);
      }
    } else {
      if (props.color) {
        propsDecl.push({ name: "color", def: '"currentColor"', type: "string" });
        rootAttrs.push(`fill={color}`);
      } else {
        rootAttrs.push(`fill="${parsed.fill}"`);
      }
    }

    if (props.stroke && isStroke) {
      propsDecl.push({ name: "strokeWidth", def: parsed.strokeWidth, type: "number | string" });
    }
    if (isStroke) {
      rootAttrs.push(`strokeLinecap="round"`);
      rootAttrs.push(`strokeLinejoin="round"`);
    }
    if (tw) rootAttrs.push(`className={\`inline-block shrink-0 \${className ?? ""}\`}`);

    // Accessibility: default to aria-hidden for decorative icons (the common case — an
    // icon next to a text label). "labeled" makes the icon self-labeling via a `title` prop.
    if (a11y === "hidden") {
      rootAttrs.push(`aria-hidden={title ? undefined : true}`);
      rootAttrs.push(`role={title ? "img" : undefined}`);
      rootAttrs.push(`aria-label={title}`);
      propsDecl.push({ name: "title", def: "undefined", type: "string" });
    } else if (a11y === "labeled") {
      rootAttrs.push(`role="img"`);
      rootAttrs.push(`aria-label={title}`);
      propsDecl.push({ name: "title", def: '""', type: "string" });
    }

    rootAttrs.push(`{...rest}`);

    const destruct =
      propsDecl.map((p) => `${p.name} = ${p.def}`).join(", ") +
      (tw ? `${propsDecl.length ? ", " : ""}className` : "") +
      (propsDecl.length || tw ? ", " : "") +
      "...rest";

    const typeBlock = ts
      ? `interface IconProps extends React.SVGProps<SVGSVGElement> {\n${propsDecl
          .map((p) => `  ${p.name}?: ${p.type};`)
          .join("\n")}${tw && !propsDecl.find(p => p.name === "className") ? `\n  className?: string;` : ""}\n}\n\n`
      : "";

    const bind = (attr, propName) => `${attr}={${propName}}`;
    const inner = rewriteInner(parsed.inner, props, bind);

    const importLine = forwardRef
      ? (ts ? `import * as React from "react";\n\n` : `import { forwardRef } from "react";\n\n`)
      : (ts ? `import * as React from "react";\n\n` : `import React from "react";\n\n`);

    if (forwardRef) {
      return (
        importLine +
        typeBlock +
        `export const ${name} = ${ts ? "React.forwardRef<SVGSVGElement, IconProps>" : "forwardRef"}(function ${name}({ ${destruct} }${typeSig}, ref${ts ? ": React.Ref<SVGSVGElement>" : ""}) {\n` +
        `  return (\n` +
        `    <svg\n` +
        `      ref={ref}\n` +
        rootAttrs.map((a) => `      ${a}`).join("\n") +
        `\n    >\n` +
        indent(inner, 6) +
        `\n    </svg>\n` +
        `  );\n` +
        `});\n`
      );
    }

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
    const { ts, tw, props, a11y = "hidden" } = config;
    const isStroke = parsed.iconType === "stroke";
    const propsObj = [];
    const rootAttrs = [`xmlns="http://www.w3.org/2000/svg"`, `viewBox="${parsed.viewBox}"`];

    if (props.size) {
      propsObj.push({ name: "size", def: `{ type: [Number, String], default: 24 }` });
      rootAttrs.push(`:width="size"`);
      rootAttrs.push(`:height="size"`);
    } else {
      rootAttrs.push(`width="${parsed.width}"`);
      rootAttrs.push(`height="${parsed.height}"`);
    }

    if (isStroke) {
      rootAttrs.push(`fill="${parsed.fill}"`);
      if (props.color) {
        propsObj.push({ name: "color", def: `{ type: String, default: 'currentColor' }` });
        rootAttrs.push(`:stroke="color"`);
      } else {
        rootAttrs.push(`stroke="${parsed.stroke}"`);
      }
    } else {
      if (props.color) {
        propsObj.push({ name: "color", def: `{ type: String, default: 'currentColor' }` });
        rootAttrs.push(`:fill="color"`);
      } else {
        rootAttrs.push(`fill="${parsed.fill}"`);
      }
    }

    if (props.stroke && isStroke) {
      propsObj.push({
        name: "strokeWidth",
        def: `{ type: [Number, String], default: ${parsed.strokeWidth} }`,
      });
    }
    if (isStroke) {
      rootAttrs.push(`stroke-linecap="round"`);
      rootAttrs.push(`stroke-linejoin="round"`);
    }
    if (tw) rootAttrs.push(`class="inline-block shrink-0"`);
    if (a11y === "hidden") {
      propsObj.push({ name: "title", def: `{ type: String, default: '' }` });
      rootAttrs.push(`:aria-hidden="title ? undefined : 'true'"`);
      rootAttrs.push(`:role="title ? 'img' : undefined"`);
      rootAttrs.push(`:aria-label="title || undefined"`);
    } else if (a11y === "labeled") {
      propsObj.push({ name: "title", def: `{ type: String, default: '' }` });
      rootAttrs.push(`role="img"`);
      rootAttrs.push(`:aria-label="title"`);
    }

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
    const { ts, tw, props, a11y = "hidden" } = config;
    const isStroke = parsed.iconType === "stroke";
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

    if (isStroke) {
      rootAttrs.push(`fill="${parsed.fill}"`);
      if (props.color) {
        script.push(ts ? `export let color: string = "currentColor";` : `export let color = "currentColor";`);
        rootAttrs.push(`stroke={color}`);
      } else {
        rootAttrs.push(`stroke="${parsed.stroke}"`);
      }
    } else {
      if (props.color) {
        script.push(ts ? `export let color: string = "currentColor";` : `export let color = "currentColor";`);
        rootAttrs.push(`fill={color}`);
      } else {
        rootAttrs.push(`fill="${parsed.fill}"`);
      }
    }

    if (props.stroke && isStroke) {
      script.push(
        ts
          ? `export let strokeWidth: number | string = ${parsed.strokeWidth};`
          : `export let strokeWidth = ${parsed.strokeWidth};`
      );
    }
    if (isStroke) {
      rootAttrs.push(`stroke-linecap="round"`);
      rootAttrs.push(`stroke-linejoin="round"`);
    }
    if (tw) rootAttrs.push(`class="inline-block shrink-0"`);
    if (a11y === "hidden" || a11y === "labeled") {
      script.push(ts ? `export let title: string = "";` : `export let title = "";`);
      if (a11y === "hidden") {
        rootAttrs.push(`aria-hidden={title ? undefined : true}`);
        rootAttrs.push(`role={title ? "img" : undefined}`);
        rootAttrs.push(`aria-label={title || undefined}`);
      } else {
        rootAttrs.push(`role="img"`);
        rootAttrs.push(`aria-label={title}`);
      }
    }

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
    const { name, ts, tw, props, a11y = "hidden" } = config;
    const isStroke = parsed.iconType === "stroke";
    const propsDecl = [];
    const rootAttrs = [];

    rootAttrs.push(`xmlns="http://www.w3.org/2000/svg"`);
    rootAttrs.push(`viewBox="${parsed.viewBox}"`);

    if (props.size) {
      propsDecl.push({ name: "size", def: "24", type: "number | string" });
      rootAttrs.push(`width={props.size}`);
      rootAttrs.push(`height={props.size}`);
    } else {
      rootAttrs.push(`width="${parsed.width}"`);
      rootAttrs.push(`height="${parsed.height}"`);
    }

    if (isStroke) {
      rootAttrs.push(`fill="${parsed.fill}"`);
      if (props.color) {
        propsDecl.push({ name: "color", def: `"currentColor"`, type: "string" });
        rootAttrs.push(`stroke={props.color}`);
      } else {
        rootAttrs.push(`stroke="${parsed.stroke}"`);
      }
    } else {
      if (props.color) {
        propsDecl.push({ name: "color", def: `"currentColor"`, type: "string" });
        rootAttrs.push(`fill={props.color}`);
      } else {
        rootAttrs.push(`fill="${parsed.fill}"`);
      }
    }

    if (props.stroke && isStroke) {
      propsDecl.push({ name: "strokeWidth", def: parsed.strokeWidth, type: "number | string" });
    }
    if (isStroke) {
      rootAttrs.push(`stroke-linecap="round"`);
      rootAttrs.push(`stroke-linejoin="round"`);
    }
    if (tw) rootAttrs.push(`class="inline-block shrink-0"`);

    let titleNode = "";
    if (a11y === "hidden") {
      propsDecl.push({ name: "title", def: "undefined", type: "string" });
      rootAttrs.push(`aria-hidden={props.title ? undefined : true}`);
      rootAttrs.push(`role={props.title ? "img" : undefined}`);
      rootAttrs.push(`aria-label={props.title}`);
      titleNode = `{props.title && <title>{props.title}</title>}\n`;
    } else if (a11y === "labeled") {
      propsDecl.push({ name: "title", def: "undefined", type: "string" });
      rootAttrs.push(`role="img"`);
      rootAttrs.push(`aria-label={props.title}`);
      titleNode = `{props.title && <title>{props.title}</title>}\n`;
    }

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
      (titleNode ? indent(titleNode.replace(/props\./g, `${usedProps}.`), 6) : "") +
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

// Curated samples for the Converter's "Try a sample" gallery.
// Each one exercises a distinct code path so users can see how the cleaner
// handles typical real-world input before pasting their own SVG.
const CONVERTER_SAMPLES = [
  {
    id: "outline",
    label: "Sun",
    hint: "outline icon — stroke-based, single color, currentColor friendly",
    name: "SunIcon",
    svg: DEFAULT_SVG,
  },
  {
    id: "solid",
    label: "Star",
    hint: "solid icon — fill-based, color prop binds to fill",
    name: "StarIcon",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.1 6.3 7 1-5 4.9 1.1 6.9L12 17.8 5.8 21l1.2-6.9-5-5 7-1z"/></svg>`,
  },
  {
    id: "multicolor",
    label: "Folder",
    hint: "multi-color icon — palette preserved, color prop suppressed",
    name: "FolderIcon",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z" fill="#f4c77a"/><path d="M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" fill="#e8a84a"/><circle cx="18" cy="14" r="1.5" fill="#ffffff"/></svg>`,
  },
  {
    id: "figma",
    label: "Bolt",
    hint: "from a Figma export — messy prolog, hardcoded colors, cleaner earns its keep",
    name: "BoltIcon",
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generator: Figma Export v4 -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <g id="Layer_1" data-name="icon-bolt" sketch:type="MSLayerGroup">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`,
  },
  {
    id: "gradient",
    label: "Sparkle",
    hint: "gradient fill — defs + url(#id) refs, ids auto-prefixed",
    name: "SparkleIcon",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#ec4899"/></linearGradient></defs><path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z" fill="url(#g)"/></svg>`,
  },
];

export const Vek = {
  DEFAULT_SVG,
  parseSvg,
  generate,
  highlight,
  renderCode,
  escapeHtml,
  SAMPLE_ICONS,
  CONVERTER_SAMPLES,
};
