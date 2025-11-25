import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixNextJsPaths(dir, prefix) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Check if it's a Next.js app (has _next folder)
      const nextDir = path.join(fullPath, "_next");
      try {
        await fs.access(nextDir);
        console.log(`Fixing Next.js paths in ${entry.name}`);
        
        // Fix HTML files
        const htmlFiles = ["index.html", "404.html"];
        for (const htmlFile of htmlFiles) {
          const htmlPath = path.join(fullPath, htmlFile);
          try {
            let content = await fs.readFile(htmlPath, "utf-8");
            
            // Replace absolute paths with relative paths
            // e.g., "/asteroid-game/_next/" -> "_next/"
            const appName = entry.name;
            content = content.replace(new RegExp(`"/${appName}/`, "g"), `"./`);
            content = content.replace(new RegExp(`'/${appName}/`, "g"), `'./`);
            
            // Also fix any /favicon.ico references
            content = content.replace('"/favicon.ico"', '"./favicon.ico"');
            content = content.replace("'/favicon.ico'", "'./favicon.ico'");
            
            await fs.writeFile(htmlPath, content);
            console.log(`  Fixed ${htmlFile}`);
          } catch (err) {
            // File doesn't exist, skip
          }
        }
        
        // Fix any JavaScript files that might have hardcoded paths
        await fixJsFiles(path.join(fullPath, "_next"), appName);
        
      } catch (err) {
        // Not a Next.js app, skip
      }
    }
  }
}

async function fixJsFiles(dir, appName) {
  try {
    const walkDir = async (currentDir) => {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          await walkDir(fullPath);
        } else if (entry.name.endsWith(".js")) {
          let content = await fs.readFile(fullPath, "utf-8");
          let modified = false;
          
          // Replace paths in JavaScript files
          const newContent = content.replace(
            new RegExp(`["']/${appName}/`, "g"),
            (match) => {
              modified = true;
              return match[0] + "./";
            }
          );
          
          if (modified) {
            await fs.writeFile(fullPath, newContent);
            console.log(`  Fixed JS: ${path.relative(dir, fullPath)}`);
          }
        }
      }
    };
    
    await walkDir(dir);
  } catch (err) {
    // Directory doesn't exist
  }
}

async function main() {
  const frontEndDir = path.resolve(__dirname, "..");
  const publicDir = path.join(frontEndDir, "public");
  
  // Fix GPT-5 apps
  const gpt5Dir = path.join(publicDir, "gpt-5");
  console.log("Fixing Next.js paths in GPT-5 apps...");
  await fixNextJsPaths(gpt5Dir, "gpt-5");

  // Fix Opus 4.1 apps
  const opus41Dir = path.join(publicDir, "opus-4.1");
  console.log("Fixing Next.js paths in Opus 4.1 apps...");
  await fixNextJsPaths(opus41Dir, "opus-4.1");

  // Fix Sonnet 4.5 apps
  const sonnet45Dir = path.join(publicDir, "sonnet-4.5");
  console.log("Fixing Next.js paths in Sonnet 4.5 apps...");
  await fixNextJsPaths(sonnet45Dir, "sonnet-4.5");

  // Fix Gemini 3 apps
  const gemini3Dir = path.join(publicDir, "gemini-3");
  console.log("Fixing Next.js paths in Gemini 3 apps...");
  await fixNextJsPaths(gemini3Dir, "gemini-3");

  console.log("Done fixing Next.js paths.");
}

main().catch((err) => {
  console.error("Failed to fix Next.js paths:", err);
  process.exit(1);
});