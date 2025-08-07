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

async function rimrafDirIfExists(dir) {
  if (await exists(dir)) {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

async function copyDir(src, dest) {
  const stat = await fs.stat(src);
  if (!stat.isDirectory()) {
    throw new Error(`Source is not a directory: ${src}`);
  }
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(s, d);
    } else if (entry.isSymbolicLink()) {
      const link = await fs.readlink(s);
      try {
        await fs.symlink(link, d);
      } catch {
        /* ignore */
      }
    } else if (entry.isFile()) {
      await fs.copyFile(s, d);
    }
  }
}

async function main() {
  const frontEndDir = path.resolve(__dirname, "..");
  const repoRoot = path.resolve(frontEndDir, "..");
  const openaiDir = path.join(repoRoot, "openai-apps");
  const claudeDir = path.join(repoRoot, "claude-apps");
  const publicDir = path.join(frontEndDir, "public");

  await fs.mkdir(publicDir, { recursive: true });

  // Copy OpenAI apps to public/openai/
  if (await exists(openaiDir)) {
    const openaiPublicDir = path.join(publicDir, "openai");
    await rimrafDirIfExists(openaiPublicDir);
    await fs.mkdir(openaiPublicDir, { recursive: true });
    
    const openaiEntries = await fs.readdir(openaiDir, { withFileTypes: true });
    for (const entry of openaiEntries) {
      const s = path.join(openaiDir, entry.name);
      const d = path.join(openaiPublicDir, entry.name);

      if (entry.isDirectory()) {
        console.log(`[copy-apps] Copying OpenAI ${s} -> ${d}`);
        await copyDir(s, d);
      }
    }
  } else {
    console.log(`[copy-apps] No openai-apps directory found at ${openaiDir}, skipping.`);
  }

  // Copy Claude apps to public/claude/
  if (await exists(claudeDir)) {
    const claudePublicDir = path.join(publicDir, "claude");
    await rimrafDirIfExists(claudePublicDir);
    await fs.mkdir(claudePublicDir, { recursive: true });
    
    const claudeEntries = await fs.readdir(claudeDir, { withFileTypes: true });
    for (const entry of claudeEntries) {
      const s = path.join(claudeDir, entry.name);
      const d = path.join(claudePublicDir, entry.name);

      if (entry.isDirectory()) {
        console.log(`[copy-apps] Copying Claude ${s} -> ${d}`);
        await copyDir(s, d);
      }
    }
  } else {
    console.log(`[copy-apps] No claude-apps directory found at ${claudeDir}, skipping.`);
  }

  console.log(`[copy-apps] Done.`);
  
  // Fix Next.js paths
  console.log(`[copy-apps] Fixing Next.js paths...`);
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);
  
  try {
    await execAsync("node scripts/fix-nextjs-paths.mjs", { cwd: frontEndDir });
    console.log(`[copy-apps] Next.js paths fixed.`);
  } catch (err) {
    console.error(`[copy-apps] Failed to fix Next.js paths:`, err);
  }
}

main().catch((err) => {
  console.error("[copy-apps] Failed:", err);
  process.exit(1);
});
