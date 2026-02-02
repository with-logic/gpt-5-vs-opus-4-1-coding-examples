import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function replaceInFile(filePath, searchStr, replaceStr) {
  try {
    let content = await fs.readFile(filePath, "utf-8");
    const newContent = content.split(searchStr).join(replaceStr);
    if (content !== newContent) {
      await fs.writeFile(filePath, newContent);
      return true;
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
  }
  return false;
}

async function fixAllFiles(dir, appName, modelPrefix, useRelativePaths = false) {
  const walkDir = async (currentDir) => {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walkDir(fullPath);
      } else if (entry.isFile()) {
        // Fix paths in all text files
        const ext = path.extname(entry.name).toLowerCase();
        if ([".html", ".js", ".css", ".json", ".txt"].includes(ext) || !ext) {
          let modified = false;

          if (useRelativePaths) {
            // Convert to relative paths
            modified = await replaceInFile(fullPath, `"/${appName}/`, `"./`) || modified;
            modified = await replaceInFile(fullPath, `'/${appName}/`, `'./`) || modified;
            modified = await replaceInFile(fullPath, `\`/${appName}/`, `\`./`) || modified;
            modified = await replaceInFile(fullPath, '"/favicon.ico"', '"./favicon.ico"') || modified;
            modified = await replaceInFile(fullPath, "'/favicon.ico'", "'./favicon.ico'") || modified;
          } else {
            // Replace with full paths including app name
            const targetPrefix = `/${modelPrefix}/${appName}`;
            modified = await replaceInFile(fullPath, `"/${appName}/`, `"${targetPrefix}/`) || modified;
            modified = await replaceInFile(fullPath, `'/${appName}/`, `'${targetPrefix}/`) || modified;
            modified = await replaceInFile(fullPath, `\`/${appName}/`, `\`${targetPrefix}/`) || modified;
            modified = await replaceInFile(fullPath, '"/favicon.ico"', `"${targetPrefix}/favicon.ico"`) || modified;
            modified = await replaceInFile(fullPath, "'/favicon.ico'", `'${targetPrefix}/favicon.ico'`) || modified;
          }

          if (modified) {
            console.log(`  Fixed: ${path.relative(dir, fullPath)}`);
          }
        }
      }
    }
  };

  await walkDir(dir);
}

async function main() {
  const repoDir = path.resolve(__dirname, "..");
  const appsDir = path.join(repoDir, "public", "apps");

  // Fix asteroid-game in GPT-5 directory (use full paths with app name)
  console.log("Fixing asteroid-game paths...");
  const asteroidDir = path.join(appsDir, "gpt-5", "asteroid-game");
  await fixAllFiles(asteroidDir, "asteroid-game", "apps/gpt-5", false); // false = use full paths

  // Fix espresso in GPT-5 directory (use full paths with app name)
  console.log("Fixing espresso paths...");
  const espressoDir = path.join(appsDir, "gpt-5", "espresso");
  await fixAllFiles(espressoDir, "espresso", "apps/gpt-5", false); // false = use full paths

  console.log("Done fixing Next.js app paths.");
}

main().catch((err) => {
  console.error("Failed to fix Next.js apps:", err);
  process.exit(1);
});