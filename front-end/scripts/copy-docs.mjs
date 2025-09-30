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
  const gpt5Dir = path.join(repoRoot, "gpt-5-apps");
  const opus41Dir = path.join(repoRoot, "opus-4.1-apps");
  const sonnet45Dir = path.join(repoRoot, "sonnet-4.5-apps");
  const publicDir = path.join(frontEndDir, "public");

  await fs.mkdir(publicDir, { recursive: true });

  // Copy GPT-5 apps to public/gpt-5/
  if (await exists(gpt5Dir)) {
    const gpt5PublicDir = path.join(publicDir, "gpt-5");
    await rimrafDirIfExists(gpt5PublicDir);
    await fs.mkdir(gpt5PublicDir, { recursive: true });

    const gpt5Entries = await fs.readdir(gpt5Dir, { withFileTypes: true });
    for (const entry of gpt5Entries) {
      const s = path.join(gpt5Dir, entry.name);
      const d = path.join(gpt5PublicDir, entry.name);

      if (entry.isDirectory()) {
        console.log(`[copy-apps] Copying GPT-5 ${s} -> ${d}`);
        await copyDir(s, d);
      }
    }
  } else {
    console.log(`[copy-apps] No gpt-5-apps directory found at ${gpt5Dir}, skipping.`);
  }

  // Copy Opus 4.1 apps to public/opus-4.1/
  if (await exists(opus41Dir)) {
    const opus41PublicDir = path.join(publicDir, "opus-4.1");
    await rimrafDirIfExists(opus41PublicDir);
    await fs.mkdir(opus41PublicDir, { recursive: true });

    const opus41Entries = await fs.readdir(opus41Dir, { withFileTypes: true });
    for (const entry of opus41Entries) {
      const s = path.join(opus41Dir, entry.name);
      const d = path.join(opus41PublicDir, entry.name);

      if (entry.isDirectory()) {
        console.log(`[copy-apps] Copying Opus 4.1 ${s} -> ${d}`);
        await copyDir(s, d);
      }
    }
  } else {
    console.log(`[copy-apps] No opus-4.1-apps directory found at ${opus41Dir}, skipping.`);
  }

  // Copy Sonnet 4.5 apps to public/sonnet-4.5/
  if (await exists(sonnet45Dir)) {
    const sonnet45PublicDir = path.join(publicDir, "sonnet-4.5");
    await rimrafDirIfExists(sonnet45PublicDir);
    await fs.mkdir(sonnet45PublicDir, { recursive: true });

    const sonnet45Entries = await fs.readdir(sonnet45Dir, { withFileTypes: true });
    for (const entry of sonnet45Entries) {
      const s = path.join(sonnet45Dir, entry.name);
      const d = path.join(sonnet45PublicDir, entry.name);

      if (entry.isDirectory()) {
        console.log(`[copy-apps] Copying Sonnet 4.5 ${s} -> ${d}`);
        await copyDir(s, d);
      }
    }
  } else {
    console.log(`[copy-apps] No sonnet-4.5-apps directory found at ${sonnet45Dir}, skipping.`);
  }

  console.log(`[copy-apps] Done.`);
  
  // Fix Next.js paths
  console.log(`[copy-apps] Fixing Next.js paths...`);
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);
  
  try {
    await execAsync("node scripts/fix-nextjs-paths.mjs", { cwd: frontEndDir });
    await execAsync("node scripts/fix-nextjs-apps.mjs", { cwd: frontEndDir });
    console.log(`[copy-apps] Next.js paths fixed.`);
  } catch (err) {
    console.error(`[copy-apps] Failed to fix Next.js paths:`, err);
  }
}

main().catch((err) => {
  console.error("[copy-apps] Failed:", err);
  process.exit(1);
});
