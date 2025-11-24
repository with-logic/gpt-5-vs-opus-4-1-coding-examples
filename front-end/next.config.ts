import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

function detectAppPaths(): Array<{ source: string; destination: string }> {
  const rewrites: Array<{ source: string; destination: string }> = [];

  try {
    const publicDir = path.join(__dirname, "public");
    const modelDirs = ["gpt-5", "opus-4.1", "sonnet-4.5", "gemini-3"];

    for (const modelDir of modelDirs) {
      const modelPath = path.join(publicDir, modelDir);

      if (fs.existsSync(modelPath)) {
        const entries = fs.readdirSync(modelPath, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isDirectory()) {
            const indexPath = path.join(modelPath, entry.name, "index.html");
            if (fs.existsSync(indexPath)) {
              rewrites.push({
                source: `/${modelDir}/${entry.name}`,
                destination: `/${modelDir}/${entry.name}/index.html`,
              });
            }
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
    // Allow pretty URLs in dev by serving /model/app -> /model/app/index.html
    return detectAppPaths();
  },
  // Required for Next/Image with static export
  images: { unoptimized: true },
};

export default nextConfig;
