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
  const frontEndDir = path.resolve(__dirname, "..");
  const outDir = path.join(frontEndDir, "out");
  const publicDir = path.join(frontEndDir, "public");
  
  // Copy model directories to out if they exist
  const modelDirs = ["gpt-5", "gpt-5.1", "opus-4.1", "opus-4.5", "sonnet-4.5", "gemini-3"];

  for (const modelDir of modelDirs) {
    const src = path.join(publicDir, "apps", modelDir);
    const dest = path.join(outDir, "apps", modelDir);

    if (await exists(src)) {
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