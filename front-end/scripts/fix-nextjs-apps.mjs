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

async function fixAllFiles(dir, appName, targetPrefix) {
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
          // Replace absolute paths
          let modified = await replaceInFile(fullPath, `"/${appName}/`, `"${targetPrefix}/`);
          modified = await replaceInFile(fullPath, `'/${appName}/`, `'${targetPrefix}/`) || modified;
          modified = await replaceInFile(fullPath, `\`/${appName}/`, `\`${targetPrefix}/`) || modified;
          
          // Also replace in URL constructions
          modified = await replaceInFile(fullPath, `"/${appName}/_next/`, `"${targetPrefix}/_next/`) || modified;
          modified = await replaceInFile(fullPath, `'/${appName}/_next/`, `'${targetPrefix}/_next/`) || modified;
          
          // Fix favicon references
          modified = await replaceInFile(fullPath, '"/favicon.ico"', `"${targetPrefix}/favicon.ico"`) || modified;
          modified = await replaceInFile(fullPath, "'/favicon.ico'", `'${targetPrefix}/favicon.ico'`) || modified;
          
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
  const frontEndDir = path.resolve(__dirname, "..");
  const publicDir = path.join(frontEndDir, "public");
  
  // Fix asteroid-game in OpenAI directory
  console.log("Fixing asteroid-game paths...");
  const asteroidDir = path.join(publicDir, "openai", "asteroid-game");
  await fixAllFiles(asteroidDir, "asteroid-game", "/openai/asteroid-game");
  
  // Fix espresso in OpenAI directory  
  console.log("Fixing espresso paths...");
  const espressoDir = path.join(publicDir, "openai", "espresso");
  await fixAllFiles(espressoDir, "espresso", "/openai/espresso");
  
  console.log("Done fixing Next.js app paths.");
}

main().catch((err) => {
  console.error("Failed to fix Next.js apps:", err);
  process.exit(1);
});