import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { faviconLinks, faviconMetadata } from "../lib/favicon.mjs";

const publicDir = resolve(process.cwd(), "public");
const layoutSource = readFileSync(resolve(process.cwd(), "app/layout.tsx"), "utf8");

const expectedFaviconLinks = [
  {
    rel: "icon",
    type: "image/png",
    sizes: "16x16",
    href: "/favicon-16x16.png",
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "32x32",
    href: "/favicon-32x32.png",
  },
  {
    rel: "icon",
    type: "image/x-icon",
    href: "/favicon.ico",
  },
  {
    rel: "apple-touch-icon",
    href: "/apple-touch-icon.png",
  },
];

const expectedAssetHashes = {
  "apple-touch-icon.png":
    "8662c3503d62dbfa2db3d26d9b55bfd3553bc03ffcead303f18c932b2483239b",
  "favicon-144x144.png":
    "a7ab83ef6aa8746e61e652efa178ece5e97306f08b7cf81406bbf210234bb723",
  "favicon-16x16.png":
    "ac35846fa0eae348d17b8596163665c14b577a05e714c718cc82f7771dfbcaa2",
  "favicon-192x192.png":
    "5cfe34352a8ed9ffdf0e111b85beec107c7e956867ea571aadb1f58ac7f0a855",
  "favicon-256x256.png":
    "0f7206560e79c11cad64f934655f9fd7500099382aaf8767724a6207850dba07",
  "favicon-32x32.png":
    "bbb2caa59de9e173fa2cbd03a45b884e5e7b38607dd1364561444722f762b3da",
  "favicon-384x384.png":
    "85366b8766989768c04d9c2e9b4fa686be6d139f0d5a3bcbb4923ee82765b63c",
  "favicon-48x48.png":
    "8a3eb1d59be7587282790285f48e7cc87ae4abc6cb489c73eb15407a6cb1d1e3",
  "favicon-512x512.png":
    "457a16fc666ab921cf601c1985bd1f977f7a5cea6e54dd0d90d8b000cde72ba4",
  "favicon-72x72.png":
    "682046940847bc158ce6d2355bb0fb8a1d2eafe1bb34c6b0a0fc744afe54b7f1",
  "favicon-96x96.png":
    "5b33944583a0a7ed8f6e9270c6e7e4ce6e15cf501378b0df30d6c41fd0d4b0f0",
  "favicon.ico":
    "9b4f7f724707d8952e3eaff72df3116551d7aa489b90670c84c4cb6e948481a4",
  "favicon.png":
    "df850dff8b159f3ec698b47279092b79f5fd3cd7072c0dfc55ef96afaaa9884f",
  "manifest.webmanifest":
    "a1845a4aa3e5aa56356b596479a61e95d3b17b3a153adfc93e3a80c5c19547f6",
};

function readPublicFile(fileName) {
  return readFileSync(resolve(publicDir, fileName));
}

test("exports the canonical favicon entry points", () => {
  assert.deepEqual(faviconLinks, expectedFaviconLinks);
});

test("exposes favicon metadata for the Next app layout", () => {
  assert.deepEqual(faviconMetadata, {
    icons: {
      icon: expectedFaviconLinks
        .filter((link) => link.rel === "icon")
        .map((link) => link.href),
      apple: "/apple-touch-icon.png",
    },
  });
  assert.match(layoutSource, /import\s+\{\s*faviconMetadata\s+\}\s+from\s+"\.\.\/lib\/favicon\.mjs";/);
  assert.match(layoutSource, /export const metadata: Metadata = \{/);
  assert.match(layoutSource, /\.\.\.faviconMetadata,/);
});

test("ships the approved favicon asset family", () => {
  for (const [fileName, expectedHash] of Object.entries(expectedAssetHashes)) {
    const actualHash = createHash("sha256")
      .update(readPublicFile(fileName))
      .digest("hex");

    assert.equal(actualHash, expectedHash);
  }
});
