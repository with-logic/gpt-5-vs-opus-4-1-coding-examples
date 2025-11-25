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
  
  // Copy gpt-5, opus-4.1, and sonnet-4.5 directories to out if they exist
  const gpt5Src = path.join(publicDir, "gpt-5");
  const opus41Src = path.join(publicDir, "opus-4.1");
  const sonnet45Src = path.join(publicDir, "sonnet-4.5");
  const gemini3Src = path.join(publicDir, "gemini-3");
  const gpt5Dest = path.join(outDir, "gpt-5");
  const opus41Dest = path.join(outDir, "opus-4.1");
  const sonnet45Dest = path.join(outDir, "sonnet-4.5");
  const gemini3Dest = path.join(outDir, "gemini-3");

  if (await exists(gpt5Src)) {
    console.log(`[post-build] Copying ${gpt5Src} -> ${gpt5Dest}`);
    await fs.cp(gpt5Src, gpt5Dest, { recursive: true, force: true });
  }

  if (await exists(opus41Src)) {
    console.log(`[post-build] Copying ${opus41Src} -> ${opus41Dest}`);
    await fs.cp(opus41Src, opus41Dest, { recursive: true, force: true });
  }

  if (await exists(sonnet45Src)) {
    console.log(`[post-build] Copying ${sonnet45Src} -> ${sonnet45Dest}`);
    await fs.cp(sonnet45Src, sonnet45Dest, { recursive: true, force: true });
  }

  if (await exists(gemini3Src)) {
    console.log(`[post-build] Copying ${gemini3Src} -> ${gemini3Dest}`);
    await fs.cp(gemini3Src, gemini3Dest, { recursive: true, force: true });
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