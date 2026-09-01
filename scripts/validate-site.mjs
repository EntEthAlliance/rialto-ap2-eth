import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const siteFiles = ["index.html", "demo.html"];

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

function validateLocalTarget(sourceFile, href, ids) {
  if (
    !href ||
    href.startsWith("https://") ||
    href.startsWith("http://") ||
    href.startsWith("mailto:")
  ) {
    return;
  }

  const [targetFile, fragment] = href.split("#", 2);
  if (!targetFile) {
    assert(ids.has(fragment), `${sourceFile}: missing fragment target #${fragment}`);
    return;
  }

  const targetPath = resolve(root, dirname(sourceFile), targetFile);
  assert(existsSync(targetPath), `${sourceFile}: missing local link target ${href}`);
}

for (const file of siteFiles) {
  const html = read(file);
  assert.match(html, /^<!doctype html>/i, `${file}: missing HTML doctype`);
  assert.match(html, /<title>[^<]+<\/title>/i, `${file}: missing document title`);
  assert.match(html, /<h1>[^<]+<\/h1>/i, `${file}: missing primary heading`);

  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${file}: duplicate HTML id`);
  const idSet = new Set(ids);

  for (const match of html.matchAll(/\bhref="([^"]+)"/g)) {
    validateLocalTarget(file, match[1], idSet);
  }
}

const demo = read("demo.html");
const scripts = [...demo.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
assert(scripts.length > 0, "demo.html: missing JavaScript");
for (const [, source] of scripts) {
  new Function(source);
}

assert.equal(
  (demo.match(/ERC8183\.setBudget/g) ?? []).length,
  2,
  "demo.html: both escrow scenarios must show the ERC-8183 setBudget step",
);

console.log("Static site validation passed.");
