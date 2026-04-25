import { describe, expect, it } from "vitest";
import { Vek } from "./engine.js";

const messyDesignExport = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- exported from design tool -->
<svg
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:sketch="http://www.bohemiancoding.com/sketch/ns"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  sketch:type="MSPage"
  data-name="Bolt"
>
  <g id="unused" data-name="wrapper" sketch:type="MSLayerGroup">
    <g></g>
    <path
      id="bolt-shape"
      data-name="bolt"
      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
      stroke="#000000"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </g>
</svg>`;

const gradientSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <defs>
    <linearGradient id="paint0" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6366f1"/>
      <stop offset="1" stop-color="#ec4899"/>
    </linearGradient>
  </defs>
  <rect id="unused-rect-id" width="24" height="24" fill="url(#paint0)"/>
  <use href="#paint0"/>
</svg>`;

const multicolorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M3 7h18v12H3z" fill="#f4c77a"/>
  <path d="M3 10h18v9H3z" fill="#e8a84a"/>
  <circle cx="18" cy="14" r="2" fill="#ffffff"/>
</svg>`;

const frameworkConfig = {
  name: "BoltIcon",
  ts: true,
  tw: true,
  props: { color: true, size: true, stroke: true },
  a11y: "hidden",
  forwardRef: true,
};

describe("Vek.parseSvg", () => {
  it("rejects empty, malformed, and non-SVG input", () => {
    expect(Vek.parseSvg("")).toEqual({ ok: false, error: "empty" });
    expect(Vek.parseSvg("<div></div>")).toEqual({ ok: false, error: "not-svg" });
    expect(Vek.parseSvg("<svg><path></svg>")).toEqual({ ok: false, error: "parse" });
  });

  it("cleans design-tool exports and reports what changed", () => {
    const parsed = Vek.parseSvg(messyDesignExport);

    expect(parsed.ok).toBe(true);
    expect(parsed.iconType).toBe("stroke");
    expect(parsed.props).toEqual({ color: true, size: true, stroke: true });
    expect(parsed.raw).not.toContain("<?xml");
    expect(parsed.raw).not.toContain("<!DOCTYPE");
    expect(parsed.raw).not.toContain("exported from design tool");
    expect(parsed.inner).not.toContain("data-name");
    expect(parsed.inner).not.toContain("sketch:");
    expect(parsed.inner).not.toContain('id="unused"');
    expect(parsed.inner).not.toContain('id="bolt-shape"');
    expect(parsed.inner).not.toContain("<g></g>");
    expect(parsed.stats).toMatchObject({
      prologStripped: 2,
      commentsStripped: 1,
      nsStripped: 3,
      emptyGroupsRemoved: 1,
      idsPrefixed: 0,
    });
  });

  it("prefixes referenced ids and rewrites url/href references", () => {
    const parsed = Vek.parseSvg(gradientSvg);

    expect(parsed.ok).toBe(true);
    expect(parsed.stats.idsPrefixed).toBe(1);
    expect(parsed.inner).toContain(`id="${parsed.prefix}-paint0"`);
    expect(parsed.inner).toContain(`fill="url(#${parsed.prefix}-paint0)"`);
    expect(parsed.inner).toContain(`href="#${parsed.prefix}-paint0"`);
    expect(parsed.inner).not.toContain('id="unused-rect-id"');
  });

  it("preserves multicolor palettes and suppresses the color prop", () => {
    const parsed = Vek.parseSvg(multicolorSvg);

    expect(parsed.ok).toBe(true);
    expect(parsed.multicolor).toBe(true);
    expect(parsed.colors).toEqual(["#f4c77a", "#e8a84a", "#ffffff"]);
    expect(parsed.props.color).toBe(false);
    expect(parsed.inner).toContain('fill="#f4c77a"');
    expect(parsed.inner).toContain('fill="#e8a84a"');
    expect(parsed.inner).toContain('fill="#ffffff"');
  });
});

describe("Vek.generate", () => {
  it.each(["react", "vue", "svelte", "solid"])("generates stable %s output", (framework) => {
    const parsed = Vek.parseSvg(messyDesignExport);
    const code = Vek.generate(framework, parsed, frameworkConfig);

    expect(code).toMatchSnapshot();
  });

  it("binds generated strokeWidth props for stroke icons", () => {
    const parsed = Vek.parseSvg(messyDesignExport);

    expect(Vek.generate("react", parsed, frameworkConfig)).toContain("strokeWidth={strokeWidth}");
    expect(Vek.generate("vue", parsed, frameworkConfig)).toContain(':stroke-width="strokeWidth"');
    expect(Vek.generate("svelte", parsed, frameworkConfig)).toContain("stroke-width={strokeWidth}");
    expect(Vek.generate("solid", parsed, frameworkConfig)).toContain("stroke-width={merged.strokeWidth}");
  });

  it("uses a string title default in Vue accessibility output", () => {
    const parsed = Vek.parseSvg(messyDesignExport);
    const code = Vek.generate("vue", parsed, frameworkConfig);

    expect(code).toContain("title?: string;");
    expect(code).toContain("title: '',");
  });

  it("supports React memo and default export output", () => {
    const parsed = Vek.parseSvg(messyDesignExport);
    const code = Vek.generate("react", parsed, {
      ...frameworkConfig,
      name: "MemoBoltIcon",
      memo: true,
      defaultExport: true,
    });

    expect(code).toContain("const MemoBoltIcon = React.memo(React.forwardRef");
    expect(code).toContain("export default MemoBoltIcon;");
    expect(code).not.toContain("export const MemoBoltIcon");
  });

  it("supports Solid default exports", () => {
    const parsed = Vek.parseSvg(messyDesignExport);
    const code = Vek.generate("solid", parsed, {
      ...frameworkConfig,
      name: "DefaultBoltIcon",
      defaultExport: true,
    });

    expect(code).toContain("function DefaultBoltIcon(props: IconProps)");
    expect(code).toContain("export default DefaultBoltIcon;");
    expect(code).not.toContain("export function DefaultBoltIcon");
  });

  it("keeps multicolor React output from flattening child fills", () => {
    const parsed = Vek.parseSvg(multicolorSvg);
    const code = Vek.generate("react", parsed, {
      name: "FolderIcon",
      ts: true,
      tw: false,
      props: { ...parsed.props, size: true, stroke: false },
      a11y: "hidden",
      forwardRef: false,
    });

    expect(code).not.toContain("fill={color}");
    expect(code).toContain('fill="#f4c77a"');
    expect(code).toContain('fill="#e8a84a"');
    expect(code).toContain('fill="#ffffff"');
  });
});
