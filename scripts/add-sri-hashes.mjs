/**
 * add-sri-hashes.mjs
 *
 * Fetches every versioned CDN URL referenced by the generated apps, computes
 * its SHA-384 SRI hash, and injects integrity= + crossorigin="anonymous" into
 * every matching <script src=...> and <link href=...> tag across all HTML files
 * under public/apps/.
 *
 * Unversioned URLs (e.g. @latest, @3.x.x, bare package names with no version)
 * are skipped — their content can change at any time so an SRI hash would
 * either break on the next CDN update or give false security.
 *
 * Run:  node scripts/add-sri-hashes.mjs
 * Also invoked automatically as part of `bun run build`.
 */

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const APPS_DIR = path.join(REPO_ROOT, "public", "apps");

// URLs whose content is mutable or served dynamically — skip SRI for these.
const UNVERSIONABLE_PATTERNS = [
  /@latest/,
  /@\d+\.x/,                    // e.g. @3.x.x
  /npm\/chart\.js"$/,            // chart.js with no version pin
  /npm\/marked\//,               // marked with no version pin
  /@phosphor-icons\/web$/,       // no version
  /fonts\.googleapis\.com/,      // serves different CSS per User-Agent
  /fonts\.gstatic\.com/,         // font files vary by request
];

function isVersioned(url) {
  return !UNVERSIONABLE_PATTERNS.some((p) => p.test(url));
}

/** Fetch a URL and compute its SHA-384 SRI hash */
async function computeSRI(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = await res.arrayBuffer();
  const hash = crypto.createHash("sha384").update(Buffer.from(buf)).digest("base64");
  return `sha384-${hash}`;
}

/** Collect all unique versioned CDN URLs from all HTML files */
async function collectUrls(appsDir) {
  const urls = new Set();
  const entries = await fs.readdir(appsDir, { withFileTypes: true });

  for (const model of entries.filter((e) => e.isDirectory())) {
    const modelDir = path.join(appsDir, model.name);
    const apps = await fs.readdir(modelDir, { withFileTypes: true });

    for (const app of apps.filter((e) => e.isDirectory())) {
      const htmlPath = path.join(modelDir, app.name, "index.html");
      try {
        const html = await fs.readFile(htmlPath, "utf8");
        for (const [, url] of html.matchAll(/(?:src|href)="(https:\/\/[^"]+)"/g)) {
          if (isVersioned(url)) urls.add(url);
        }
      } catch {
        // file may not exist yet
      }
    }
  }

  return urls;
}

/** Inject integrity= and crossorigin= into a single HTML string */
function injectHashes(html, hashMap) {
  // Handle <script src="URL"> and <script src="URL" ...existing attrs...>
  html = html.replace(
    /<script\s([^>]*)>/g,
    (tag, attrs) => {
      const srcMatch = attrs.match(/src="([^"]+)"/);
      if (!srcMatch) return tag;
      const url = srcMatch[1];
      const hash = hashMap.get(url);
      if (!hash) return tag;
      // Skip if integrity already present
      if (attrs.includes("integrity=")) return tag;
      return `<script ${attrs} integrity="${hash}" crossorigin="anonymous">`;
    }
  );

  // Handle <link href="URL" ...> (stylesheets)
  html = html.replace(
    /<link\s([^>]*)>/g,
    (tag, attrs) => {
      const hrefMatch = attrs.match(/href="([^"]+)"/);
      if (!hrefMatch) return tag;
      const url = hrefMatch[1];
      const hash = hashMap.get(url);
      if (!hash) return tag;
      if (attrs.includes("integrity=")) return tag;
      // Only hash link tags that load resources (stylesheet, preload, modulepreload)
      if (!/rel="(stylesheet|preload|modulepreload)"/.test(attrs)) return tag;
      return `<link ${attrs} integrity="${hash}" crossorigin="anonymous">`;
    }
  );

  return html;
}

async function main() {
  console.log("[sri] Scanning HTML files for CDN URLs...");
  const urls = await collectUrls(APPS_DIR);
  console.log(`[sri] Found ${urls.size} unique versioned URLs to hash`);

  // Fetch and hash all URLs (with concurrency limit)
  const hashMap = new Map();
  const urlList = [...urls];
  const CONCURRENCY = 10;

  for (let i = 0; i < urlList.length; i += CONCURRENCY) {
    const batch = urlList.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (url) => {
        try {
          const hash = await computeSRI(url);
          hashMap.set(url, hash);
          process.stdout.write(".");
        } catch (err) {
          console.warn(`\n[sri] WARN: could not hash ${url}: ${err.message}`);
        }
      })
    );
  }
  console.log(`\n[sri] Hashed ${hashMap.size}/${urlList.length} URLs`);

  // Inject hashes into all HTML files
  const modelDirs = (await fs.readdir(APPS_DIR, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  let filesPatched = 0;
  let tagsPatched = 0;

  for (const model of modelDirs) {
    const modelDir = path.join(APPS_DIR, model);
    const apps = (await fs.readdir(modelDir, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    for (const app of apps) {
      const htmlPath = path.join(modelDir, app, "index.html");
      try {
        const original = await fs.readFile(htmlPath, "utf8");
        const patched = injectHashes(original, hashMap);
        if (patched !== original) {
          await fs.writeFile(htmlPath, patched, "utf8");
          filesPatched++;
          // Count tags changed
          const origTags = (original.match(/integrity="/g) || []).length;
          const newTags = (patched.match(/integrity="/g) || []).length;
          tagsPatched += newTags - origTags;
        }
      } catch {
        // skip missing files
      }
    }
  }

  console.log(`[sri] Patched ${tagsPatched} tags across ${filesPatched} files`);
  console.log("[sri] Done.");
}

main().catch((err) => {
  console.error("[sri] Fatal:", err);
  process.exit(1);
});
