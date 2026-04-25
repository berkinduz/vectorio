import fs from "node:fs/promises";
import path from "node:path";

const DIST = path.resolve("dist");

const requiredFiles = [
  "index.html",
  "convert/index.html",
  "batch/index.html",
  "docs/index.html",
  "robots.txt",
  "sitemap.xml",
  "og-image.png",
  "favicon.svg",
];

const checks = [
  ["index.html", ["Vectorio", "og-image.png", "application/ld+json"]],
  ["convert/index.html", ["Convert SVG to React", "https://vectorio-ten.vercel.app/convert"]],
  ["batch/index.html", ["SVG icon library generator", "https://vectorio-ten.vercel.app/batch"]],
  ["docs/index.html", ["Documentation", "advanced output options", "https://vectorio-ten.vercel.app/docs"]],
  ["sitemap.xml", ["/", "/convert", "/batch", "/docs"]],
  ["robots.txt", ["Sitemap: https://vectorio-ten.vercel.app/sitemap.xml"]],
];

let failures = 0;

async function assertFile(rel) {
  try {
    const stat = await fs.stat(path.join(DIST, rel));
    if (!stat.isFile() || stat.size === 0) throw new Error("empty or not a file");
    console.log(`ok file ${rel}`);
  } catch (error) {
    failures++;
    console.error(`missing ${rel}: ${error.message}`);
  }
}

async function assertContains(rel, needles) {
  try {
    const body = await fs.readFile(path.join(DIST, rel), "utf8");
    for (const needle of needles) {
      if (!body.includes(needle)) {
        failures++;
        console.error(`missing text in ${rel}: ${needle}`);
      }
    }
    console.log(`ok content ${rel}`);
  } catch (error) {
    failures++;
    console.error(`cannot read ${rel}: ${error.message}`);
  }
}

for (const rel of requiredFiles) {
  await assertFile(rel);
}

for (const [rel, needles] of checks) {
  await assertContains(rel, needles);
}

if (failures) {
  console.error(`smoke check failed: ${failures} issue${failures === 1 ? "" : "s"}`);
  process.exit(1);
}

console.log("smoke check passed");
