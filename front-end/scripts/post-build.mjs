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
  
  // Copy openai and claude directories to out if they exist
  const openaiSrc = path.join(publicDir, "openai");
  const claudeSrc = path.join(publicDir, "claude");
  const openaiDest = path.join(outDir, "openai");
  const claudeDest = path.join(outDir, "claude");
  
  if (await exists(openaiSrc)) {
    console.log(`[post-build] Copying ${openaiSrc} -> ${openaiDest}`);
    await fs.cp(openaiSrc, openaiDest, { recursive: true, force: true });
  }
  
  if (await exists(claudeSrc)) {
    console.log(`[post-build] Copying ${claudeSrc} -> ${claudeDest}`);
    await fs.cp(claudeSrc, claudeDest, { recursive: true, force: true });
  }
  
  // Copy logo
  const logoSrc = path.join(publicDir, "logic_logo.png");
  const logoDest = path.join(outDir, "logic_logo.png");
  
  if (await exists(logoSrc)) {
    console.log(`[post-build] Copying logo`);
    await fs.copyFile(logoSrc, logoDest);
  }
  
  // Fix Next.js app paths (use absolute paths to handle Vercel's trailing slash removal)
  console.log(`[post-build] Fixing Next.js app paths...`);
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);
  
  try {
    await execAsync("node scripts/fix-nextjs-absolute-paths.mjs", { cwd: frontEndDir });
    console.log(`[post-build] Next.js paths fixed.`);
  } catch (err) {
    console.error(`[post-build] Failed to fix Next.js paths:`, err);
  }
  
  console.log(`[post-build] Done.`);
}

main().catch((err) => {
  console.error("[post-build] Failed:", err);
  process.exit(1);
});