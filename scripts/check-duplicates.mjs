#!/usr/bin/env node
// Dev-only maintenance script: checks the G array in index.html for duplicate
// BGG ids or near-duplicate names. Run with: node scripts/check-duplicates.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import path from "node:path";

const indexPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "index.html");
const html = readFileSync(indexPath, "utf8");

const start = html.indexOf("const G=[");
if (start === -1) {
  console.error("Could not find 'const G=[' in index.html");
  process.exit(1);
}
const end = html.indexOf("\n];", start);
if (end === -1) {
  console.error("Could not find the closing '];' for the G array");
  process.exit(1);
}
const snippet = html.slice(start, end + 3).replace(/^const G=/, "var G=");

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(snippet, sandbox);
const games = sandbox.G;

if (!Array.isArray(games)) {
  console.error("Failed to extract G as an array");
  process.exit(1);
}

const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

let problems = 0;

const byBgg = new Map();
for (const g of games) {
  if (!byBgg.has(g.bgg)) byBgg.set(g.bgg, []);
  byBgg.get(g.bgg).push(g.n);
}
for (const [bgg, names] of byBgg) {
  if (names.length > 1) {
    problems++;
    console.log(`Duplicate BGG id ${bgg}: ${names.join(", ")}`);
  }
}

const byName = new Map();
for (const g of games) {
  const key = normalize(g.n);
  if (!byName.has(key)) byName.set(key, []);
  byName.get(key).push(g.n);
}
for (const [, names] of byName) {
  if (names.length > 1) {
    problems++;
    console.log(`Duplicate/near-duplicate name: ${names.join(" / ")}`);
  }
}

if (problems === 0) {
  console.log(`OK: ${games.length} games checked, no duplicates found.`);
} else {
  console.log(`\nFound ${problems} issue(s).`);
  process.exit(1);
}
