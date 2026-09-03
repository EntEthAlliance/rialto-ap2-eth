import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const siteFiles = ["index.html", "demo.html"];
const requiredDocs = ["README.md", "SPEC.md", "CONTRIBUTING.md", "LICENSE"];

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

for (const file of requiredDocs) {
  assert(existsSync(resolve(root, file)), `missing required repository document: ${file}`);
}

const index = read("index.html");
const readme = read("README.md");
const spec = read("SPEC.md");
const demo = read("demo.html");

assert.match(
  index,
  /href="https:\/\/github\.com\/EntEthAlliance\/rialto-ap2-eth\/blob\/main\/SPEC\.md">canonical technical specification<\/a>/,
  "index.html: must link to SPEC.md as the canonical technical specification",
);
assert.doesNotMatch(
  index,
  /href="README\.md">technical discussion draft<\/a>/,
  "index.html: README.md must not be presented as the specification",
);
assert.match(
  readme,
  /\[SPEC\.md\]\(SPEC\.md\) is the canonical technical document/,
  "README.md: missing canonicality rule",
);
assert.match(
  spec,
  /This file is the canonical technical source for this repository\./,
  "SPEC.md: missing canonicality declaration",
);

const canonicalQuestions = [
  "# 1. What is the problem?",
  "# 2. What is missing today?",
  "# 3. What could Rialto provide?",
  "# 4. What needs to be tested?",
  "# 5. What does the industry need to work on together?",
];
for (const heading of canonicalQuestions) {
  assert(spec.includes(heading), `SPEC.md: missing canonical section ${heading}`);
}

const scripts = [...demo.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
assert(scripts.length > 0, "demo.html: missing JavaScript");
for (const [, source] of scripts) {
  new Function(source);
}

assert.equal(
  (demo.match(/pinned ERC-8183: fund job/g) ?? []).length,
  2,
  "demo.html: both escrow scenarios must show semantic ERC-8183 funding",
);
assert.doesNotMatch(
  demo,
  /ERC8183\.(?:createJob|setBudget|fund)\(/,
  "demo.html: must not freeze an unpinned Draft ERC-8183 ABI",
);

console.log("Static site validation passed.");
