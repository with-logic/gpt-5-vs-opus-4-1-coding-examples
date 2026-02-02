import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const outDir = path.join(repoRoot, "out");
  const publicDir = path.join(repoRoot, "public");
  const appsDir = path.join(publicDir, "apps");

  // Dynamically copy all model directories from public/apps/ to out/apps/
  if (await exists(appsDir)) {
    const entries = await fs.readdir(appsDir, { withFileTypes: true });
    const modelDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

    for (const modelDir of modelDirs) {
      const src = path.join(appsDir, modelDir);
      const dest = path.join(outDir, "apps", modelDir);

      console.log(`[post-build] Copying ${src} -> ${dest}`);
      await fs.cp(src, dest, { recursive: true, force: true });
    }
  }
  
  // Copy logo
  const logoSrc = path.join(publicDir, "logic_logo.png");
  const logoDest = path.join(outDir, "logic_logo.png");

  if (await exists(logoSrc)) {
    console.log(`[post-build] Copying logo`);
    await fs.copyFile(logoSrc, logoDest);
  }

  console.log(`[post-build] Done.`);
}

main().catch((err) => {
  console.error("[post-build] Failed:", err);
  process.exit(1);
});