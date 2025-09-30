import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixNextJsApp(appDir, appName) {
  console.log(`Fixing ${appName} to use absolute paths...`);
  
  // Walk through all files
  const walkDir = async (currentDir) => {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await walkDir(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        
        // Process HTML, JS, CSS files
        if ([".html", ".js", ".css", ".json", ".txt"].includes(ext) || !ext) {
          try {
            let content = await fs.readFile(fullPath, "utf-8");
            let modified = false;
            
            // Convert relative paths to absolute paths
            const replacements = [
              // Convert relative _next paths to absolute
              [`"./_next/`, `"/gpt-5/${appName}/_next/`],
              [`'./_next/`, `'/gpt-5/${appName}/_next/'`],
              [`\`./_next/`, `\`/gpt-5/${appName}/_next/`],

              // Convert any existing paths that need the app name
              [`"/${appName}/_next/`, `"/gpt-5/${appName}/_next/`],
              [`'/${appName}/_next/`, `'/gpt-5/${appName}/_next/'`],
              [`\`/${appName}/_next/`, `\`/gpt-5/${appName}/_next/`],
              [`"/${appName}/`, `"/gpt-5/${appName}/`],
              [`'/${appName}/`, `'/gpt-5/${appName}/'`],
              [`\`/${appName}/`, `\`/gpt-5/${appName}/`],

              // Fix favicon - both relative and absolute
              [`"./favicon.ico"`, `"/gpt-5/${appName}/favicon.ico"`],
              [`'./favicon.ico'`, `'/gpt-5/${appName}/favicon.ico'`],
              [`"/favicon.ico"`, `"/gpt-5/${appName}/favicon.ico"`],
              [`'/favicon.ico'`, `'/gpt-5/${appName}/favicon.ico'`],

              // Fix any paths that might be using /gpt-5/ without app name
              [`"/gpt-5/_next/`, `"/gpt-5/${appName}/_next/`],
              [`'/gpt-5/_next/`, `'/gpt-5/${appName}/_next/'`],
              [`\`/gpt-5/_next/`, `\`/gpt-5/${appName}/_next/`],
            ];
            
            for (const [search, replace] of replacements) {
              const newContent = content.split(search).join(replace);
              if (newContent !== content) {
                content = newContent;
                modified = true;
              }
            }
            
            if (modified) {
              await fs.writeFile(fullPath, content);
              console.log(`  Fixed: ${path.relative(appDir, fullPath)}`);
            }
          } catch (err) {
            console.error(`  Error processing ${fullPath}:`, err.message);
          }
        }
      }
    }
  };
  
  await walkDir(appDir);
}

async function main() {
  const frontEndDir = path.resolve(__dirname, "..");
  const outDir = path.join(frontEndDir, "out");
  
  // Fix asteroid-game
  const asteroidDir = path.join(outDir, "gpt-5", "asteroid-game");
  await fixNextJsApp(asteroidDir, "asteroid-game");

  // Fix espresso
  const espressoDir = path.join(outDir, "gpt-5", "espresso");
  await fixNextJsApp(espressoDir, "espresso");
  
  console.log("Done fixing Next.js apps with absolute paths.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});