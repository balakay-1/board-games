#!/usr/bin/env node
// Checks games.js for mistakes before you push.
// Run with: node scripts/validate-games.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import path from "node:path";

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "games.js");
let data;
try {
  data = vm.runInNewContext(readFileSync(file, "utf8") + "\n;({GAMES,MECHANICS,MOODS,SHELVES})", {}, { filename: "games.js" });
} catch (e) {
  console.error("games.js has a syntax error (missing comma, quote or bracket?):\n" + e.stack.split("\n").slice(0, 3).join("\n"));
  process.exit(1);
}
const { GAMES, MECHANICS, MOODS, SHELVES } = data;
const shelfIds = new Set(SHELVES.map((s) => s.id));
const known = new Set(["name", "bgg", "players", "time", "weight", "shelf", "emoji", "mechanics", "moods", "blurb", "pros", "cons"]);
const errors = [];
const notes = [];
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const seenName = new Map();
const seenBgg = new Map();

GAMES.forEach((g, idx) => {
  const who = g.name ? `"${g.name}"` : `game #${idx + 1}`;
  const err = (m) => errors.push(`${who}: ${m}`);

  for (const k of ["name", "players", "time", "weight", "shelf", "emoji", "blurb"]) {
    if (g[k] === undefined || g[k] === "") err(`missing "${k}"`);
  }
  for (const k of Object.keys(g)) if (!known.has(k)) err(`unknown field "${k}" (typo?)`);

  if (g.bgg == null) notes.push(`${who}: no BGG id yet, so no box art (set "bgg" when you know it)`);
  else if (!(Number.isInteger(g.bgg) && g.bgg > 0)) err(`bgg must be a whole number or null, got ${JSON.stringify(g.bgg)}`);

  const pm = /^(\d+)(?:-(\d+))?$/.exec(String(g.players));
  if (!pm) err(`players must look like "2" or "2-4", got ${JSON.stringify(g.players)}`);
  else if (pm[2] && +pm[2] < +pm[1]) err(`players range is backwards: ${g.players}`);
  if (!/^\d+(?:-\d+)?$/.test(String(g.time))) err(`time must look like "30" or "45-90", got ${JSON.stringify(g.time)}`);
  if (typeof g.weight !== "number" || g.weight < 1 || g.weight > 5) err(`weight must be a number from 1 to 5, got ${JSON.stringify(g.weight)}`);

  if (g.shelf && !shelfIds.has(g.shelf)) err(`unknown shelf "${g.shelf}" (use: ${[...shelfIds].join(", ")})`);
  for (const m of g.mechanics || []) if (!(m in MECHANICS)) err(`unknown mechanic "${m}" (use: ${Object.keys(MECHANICS).join(", ")})`);
  for (const m of g.moods || []) if (!(m in MOODS)) err(`unknown mood "${m}" (use: ${Object.keys(MOODS).join(", ")})`);
  if (!(g.mechanics || []).length) err("needs at least one mechanic");
  if (!(g.moods || []).length) err("needs at least one mood");

  for (const k of ["pros", "cons"]) {
    if (!Array.isArray(g[k]) || !g[k].length) err(`"${k}" needs at least one bullet`);
    else if (g[k].some((s) => typeof s !== "string" || !s.trim())) err(`"${k}" has an empty bullet`);
  }

  if (g.name) {
    const k = norm(g.name);
    if (seenName.has(k)) err(`duplicate of "${seenName.get(k)}"`);
    else seenName.set(k, g.name);
  }
  if (g.bgg) {
    if (seenBgg.has(g.bgg)) err(`same BGG id ${g.bgg} as "${seenBgg.get(g.bgg)}"`);
    else seenBgg.set(g.bgg, g.name);
  }
});

for (const n of notes) console.log("note:  " + n);
if (errors.length) {
  for (const e of errors) console.log("ERROR: " + e);
  console.log(`\n${errors.length} problem(s) found in games.js.`);
  process.exit(1);
}
console.log(`OK: ${GAMES.length} games, no problems found.`);
