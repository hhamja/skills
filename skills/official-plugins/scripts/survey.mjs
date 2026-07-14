#!/usr/bin/env node
// survey.mjs — Survey the official Claude Code plugin marketplace
// (anthropics/claude-plugins-official) and report, per plugin:
//   - author        (from the catalog; null means "not declared")
//   - description   (what the plugin does)
//   - origin        Anthropic-authored vs External contribution
//   - distribution  how it is hosted (in-repo source vs remote git-subdir)
//
// The catalog (.claude-plugin/marketplace.json) is the source of truth that
// Claude Code itself reads. Being listed there does NOT mean Anthropic wrote
// the plugin — most entries are third-party (vendor / community) contributions.
//
// Classification is driven by the `source` field (structural, always present),
// not by `author` (which is null for ~1/3 of entries):
//   "./plugins/..."           -> Anthropic-authored, vendored in this repo
//   "./external_plugins/..."  -> External, vendored in this repo
//   { source:"git-subdir", url } -> External, pulled from the vendor's own repo
//
// Usage:
//   node scripts/survey.mjs                    # summary + grouped one-line report
//   node scripts/survey.mjs --desc             # add the description under each line
//   node scripts/survey.mjs --origin anthropic # filter: anthropic | external
//   node scripts/survey.mjs --filter <text>    # substring match (name/author/desc/category)
//   node scripts/survey.mjs --json             # full structured JSON to stdout
//   node scripts/survey.mjs --file <path>      # read a local marketplace.json (offline)
//   node scripts/survey.mjs --selfcheck        # run classifier assertions, no network

const CATALOG_URL =
  "https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/.claude-plugin/marketplace.json";
const CATALOG_REPO = "anthropics/claude-plugins-official";

function repoShort(url) {
  return String(url).replace(/^https?:\/\//, "").replace(/\.git$/, "");
}

// Decide origin/distribution from the catalog `source` field. See header.
function classify(source) {
  if (typeof source === "string") {
    if (source.startsWith("./plugins/"))
      return { origin: "Anthropic", distribution: "in-repo", location: source };
    return { origin: "External", distribution: "in-repo", location: source };
  }
  if (source && typeof source === "object") {
    const location = source.url ? repoShort(source.url) : source.source || "remote";
    return { origin: "External", distribution: "remote", location };
  }
  return { origin: "Unknown", distribution: "unknown", location: null };
}

function normalize(p) {
  const c = classify(p.source);
  return {
    name: p.name,
    author: p.author?.name ?? p.author ?? null,
    category: p.category ?? null,
    description: p.description ?? "",
    origin: c.origin,
    distribution: c.distribution,
    location: c.location,
  };
}

function parseArgs(argv) {
  const o = { desc: false, json: false, selfcheck: false, origin: null, filter: null, file: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--desc") o.desc = true;
    else if (a === "--json") o.json = true;
    else if (a === "--selfcheck") o.selfcheck = true;
    else if (a === "--origin") o.origin = (argv[++i] || "").toLowerCase();
    else if (a === "--filter") o.filter = argv[++i] || "";
    else if (a === "--file") o.file = argv[++i] || "";
    else {
      console.error(`unknown argument: ${a}`);
      process.exit(2);
    }
  }
  return o;
}

async function loadCatalog(file) {
  if (file) {
    const fs = await import("node:fs/promises");
    return { catalog: JSON.parse(await fs.readFile(file, "utf8")), fetchedAt: `local:${file}` };
  }
  const res = await fetch(CATALOG_URL, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${CATALOG_URL}`);
  return { catalog: await res.json(), fetchedAt: new Date().toISOString() };
}

function selfcheck() {
  const eq = (got, want, msg) => {
    if (got !== want) {
      console.error(`FAIL: ${msg} — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
      process.exit(1);
    }
  };
  eq(classify("./plugins/x").origin, "Anthropic", "in-repo ./plugins = Anthropic");
  eq(classify("./external_plugins/x").origin, "External", "./external_plugins = External");
  const sub = { source: "git-subdir", url: "https://github.com/a/b.git" };
  eq(classify(sub).origin, "External", "git-subdir = External");
  eq(classify(sub).distribution, "remote", "git-subdir = remote");
  eq(classify(sub).location, "github.com/a/b", "repoShort strips scheme/.git");
  eq(classify(undefined).origin, "Unknown", "missing source = Unknown");
  eq(normalize({ name: "n", author: null, source: "./plugins/n" }).author, null, "null author preserved");
  console.log("selfcheck OK");
}

function report(plugins, fetchedAt, opts) {
  let rows = plugins;
  if (opts.origin) rows = rows.filter((p) => p.origin.toLowerCase() === opts.origin);
  if (opts.filter) {
    const q = opts.filter.toLowerCase();
    rows = rows.filter((p) =>
      [p.name, p.author, p.category, p.description].some((v) => (v || "").toLowerCase().includes(q)),
    );
  }
  rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));

  const anthropic = plugins.filter((p) => p.origin === "Anthropic");
  const external = plugins.filter((p) => p.origin === "External");
  const vendored = external.filter((p) => p.distribution === "in-repo");
  const remote = external.filter((p) => p.distribution === "remote");
  const noAuthor = plugins.filter((p) => !p.author);

  const lines = [];
  lines.push(`Claude Official Plugin Marketplace Survey`);
  lines.push(`Source:  ${CATALOG_REPO} (.claude-plugin/marketplace.json)`);
  lines.push(`Fetched: ${fetchedAt}`);
  lines.push(``);
  lines.push(`Total plugins:          ${plugins.length}`);
  lines.push(`  Anthropic-authored:   ${anthropic.length}`);
  lines.push(`  External contributions: ${external.length}  (vendored in-repo: ${vendored.length}, remote git-subdir: ${remote.length})`);
  lines.push(`  No declared author:   ${noAuthor.length}  (all external)`);
  if (opts.origin || opts.filter) lines.push(`Showing:                ${rows.length} after filters`);
  lines.push(``);

  let group = null;
  for (const p of rows) {
    if (p.origin !== group) {
      group = p.origin;
      lines.push(`── ${group.toUpperCase()} ${"─".repeat(Math.max(0, 40 - group.length))}`);
    }
    const author = p.author || "—";
    const cat = p.category ? `[${p.category}]` : "[-]";
    const tag = p.distribution === "remote" ? `(${p.location})` : "";
    lines.push(`  ${p.name.padEnd(34)} ${cat.padEnd(14)} ${author.padEnd(22)} ${tag}`);
    if (opts.desc && p.description) lines.push(`      ${p.description.replace(/\s+/g, " ").trim()}`);
  }
  return lines.join("\n");
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.selfcheck) return selfcheck();

  const { catalog, fetchedAt } = await loadCatalog(opts.file);
  const raw = Array.isArray(catalog.plugins) ? catalog.plugins : [];
  const plugins = raw.map(normalize);

  if (opts.json) {
    let rows = plugins;
    if (opts.origin) rows = rows.filter((p) => p.origin.toLowerCase() === opts.origin);
    if (opts.filter) {
      const q = opts.filter.toLowerCase();
      rows = rows.filter((p) =>
        [p.name, p.author, p.category, p.description].some((v) => (v || "").toLowerCase().includes(q)),
      );
    }
    console.log(JSON.stringify({ source: CATALOG_REPO, fetchedAt, count: rows.length, plugins: rows }, null, 2));
    return;
  }
  console.log(report(plugins, fetchedAt, opts));
}

main().catch((e) => {
  console.error(`survey failed: ${e.message}`);
  process.exit(1);
});
