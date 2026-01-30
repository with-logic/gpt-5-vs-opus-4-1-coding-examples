import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

function detectAppPaths(): Array<{ source: string; destination: string }> {
  const rewrites: Array<{ source: string; destination: string }> = [];

  try {
    const appsDir = path.join(__dirname, "public", "apps");

    if (!fs.existsSync(appsDir)) {
      return rewrites;
    }

    // Dynamically read all model directories from public/apps/
    const modelDirs = fs.readdirSync(appsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    for (const modelDir of modelDirs) {
      const modelPath = path.join(appsDir, modelDir);
      const entries = fs.readdirSync(modelPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const indexPath = path.join(modelPath, entry.name, "index.html");
          if (fs.existsSync(indexPath)) {
            rewrites.push({
              source: `/apps/${modelDir}/${entry.name}`,
              destination: `/apps/${modelDir}/${entry.name}/index.html`,
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("Error detecting app paths:", err);
  }

  return rewrites;
}

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  async rewrites() {
    const appRewrites = detectAppPaths();
    return [
      // Client-side routing for compare pages (dev server only)
      {
        source: "/compare/:path*",
        destination: "/",
      },
      ...appRewrites,
    ];
  },
  // Required for Next/Image with static export
  images: { unoptimized: true },
};

export default nextConfig;
