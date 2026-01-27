import { execSync, spawn } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as yaml from "yaml";
import {
  models,
  getAppOutputPath,
  type ModelConfig,
} from "../lib/models.config";

// ============================================================================
// Types
// ============================================================================

interface ExampleSpec {
  id: string;
  title: string;
  prompt: string;
  tags?: string[];
}

interface GenerateOptions {
  force: string[]; // App IDs to force regenerate
  forceAll: boolean; // Force regenerate all apps
  modelFilter: string[]; // Model IDs to generate for (empty = all)
  concurrency: number; // Number of parallel generations
}

// ============================================================================
// Configuration
// ============================================================================

const REPO_ROOT = path.resolve(__dirname, "..");
const EXAMPLES_DIR = path.join(REPO_ROOT, "examples");

// ============================================================================
// Helpers
// ============================================================================

function loadExamples(): ExampleSpec[] {
  const files = fs.readdirSync(EXAMPLES_DIR).filter((f) => f.endsWith(".yaml"));
  return files.map((file) => {
    const content = fs.readFileSync(path.join(EXAMPLES_DIR, file), "utf-8");
    return yaml.parse(content) as ExampleSpec;
  });
}

function appExists(modelId: string, appId: string): boolean {
  const outputPath = path.join(REPO_ROOT, getAppOutputPath(modelId, appId));
  return fs.existsSync(outputPath);
}

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function buildPrompt(spec: ExampleSpec): string {
  return `You are implementing a single self-contained HTML file.

## App: ${spec.title}

## Specification:
${spec.prompt}

## Requirements:
- Create a single index.html file with ALL CSS and JavaScript inlined
- The file must be fully self-contained
- You may use CDN links for libraries (e.g., Tailwind CSS, React, Three.js) if needed
- Place the file at: output/index.html
- Do NOT create any other files

## Important:
This is a non-interactive session, so you will not be able to ask clarifying questions. Use your best judgment.

This implementation will be displayed in a competition alongside other AI models' implementations of the same specification. Your implementation should be the highest quality, most polished, and most impressive version possible. Put your best foot forward.

Begin implementation now.`;
}

// ============================================================================
// CLI Invocation
// ============================================================================

function buildCliCommand(
  model: ModelConfig,
  prompt: string
): { cmd: string; args: string[] } {
  switch (model.cli) {
    case "claude":
      return {
        cmd: "claude",
        args: [
          "-p",
          "--model",
          model.model,
          "--dangerously-skip-permissions",
          "--permission-mode",
          "bypassPermissions",
          prompt,
        ],
      };

    case "codex":
      return {
        cmd: "codex",
        args: [
          "exec",
          "--model",
          model.model,
          "--full-auto",
          prompt,
        ],
      };

    case "gemini":
      return {
        cmd: "gemini",
        args: [
          "--model",
          model.model,
          "--approval-mode",
          "yolo",
          prompt,
        ],
      };

    default:
      throw new Error(`Unknown CLI type: ${(model as ModelConfig).cli}`);
  }
}

function createTempDir(): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "arena-gen-"));
  // Initialize a git repo so CLI tools don't complain
  execSync("git init", { cwd: tempDir, stdio: "ignore" });
  return tempDir;
}

function cleanupTempDir(tempDir: string): void {
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

async function runCliInSandbox(
  model: ModelConfig,
  prompt: string,
  destPath: string
): Promise<void> {
  const tempDir = createTempDir();
  const tempOutputDir = path.join(tempDir, "output");
  const tempOutputFile = path.join(tempOutputDir, "index.html");

  // Create the output directory structure in temp
  fs.mkdirSync(tempOutputDir, { recursive: true });

  const { cmd, args } = buildCliCommand(model, prompt);

  try {
    await new Promise<void>((resolve, reject) => {
      console.log(`    Running in sandbox: ${tempDir}`);
      console.log(`    Command: ${cmd} ${args[0]} ...`);

      const proc = spawn(cmd, args, {
        stdio: "inherit",
        cwd: tempDir,
      });

      proc.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`CLI exited with code ${code}`));
        }
      });

      proc.on("error", (err) => {
        reject(err);
      });
    });

    // Copy the output file to the final destination
    if (fs.existsSync(tempOutputFile)) {
      ensureDir(destPath);
      fs.copyFileSync(tempOutputFile, destPath);
      console.log(`    Copied output to: ${destPath}`);
    } else {
      throw new Error(`CLI completed but output/index.html was not created in sandbox`);
    }
  } finally {
    cleanupTempDir(tempDir);
  }
}

// ============================================================================
// Main Generation Loop
// ============================================================================

async function generateApp(
  model: ModelConfig,
  spec: ExampleSpec,
  options: GenerateOptions
): Promise<"skipped" | "generated" | "failed"> {
  const outputPath = getAppOutputPath(model.id, spec.id);
  const absoluteOutputPath = path.join(REPO_ROOT, outputPath);

  // Check if app exists and should be skipped
  const forceRegenerate = options.forceAll || options.force.includes(spec.id);
  if (appExists(model.id, spec.id) && !forceRegenerate) {
    return "skipped";
  }

  // Build the prompt (agents write to output/index.html in their sandbox)
  const prompt = buildPrompt(spec);

  try {
    // Run CLI in isolated temp directory, then copy result to final location
    await runCliInSandbox(model, prompt, absoluteOutputPath);

    // Verify the file was created
    if (fs.existsSync(absoluteOutputPath)) {
      return "generated";
    } else {
      console.error(
        `    WARNING: CLI completed but ${outputPath} was not created`
      );
      return "failed";
    }
  } catch (error) {
    console.error(`    ERROR: ${error}`);
    return "failed";
  }
}

async function main(): Promise<void> {
  // Parse CLI arguments
  const args = process.argv.slice(2);
  const options: GenerateOptions = {
    force: [],
    forceAll: false,
    modelFilter: [],
    concurrency: 1,
  };

  // Parse --force-all flag
  if (args.includes("--force-all")) {
    options.forceAll = true;
  }

  // Parse --concurrency flag
  const concurrencyIndex = args.indexOf("--concurrency");
  if (concurrencyIndex !== -1 && args[concurrencyIndex + 1]) {
    const n = parseInt(args[concurrencyIndex + 1], 10);
    if (n > 0) options.concurrency = n;
  }

  // Parse --force flag
  const forceIndex = args.indexOf("--force");
  if (forceIndex !== -1) {
    // Collect all args after --force until the next flag or end
    for (let i = forceIndex + 1; i < args.length; i++) {
      if (args[i].startsWith("--")) break;
      options.force.push(args[i]);
    }
  }

  // Parse positional args as model IDs (before any flags)
  for (const arg of args) {
    if (arg.startsWith("--")) break;
    const model = models.find(m => m.id === arg);
    if (model) {
      options.modelFilter.push(arg);
    }
  }

  // Determine which models to generate for
  const targetModels = options.modelFilter.length > 0
    ? models.filter(m => options.modelFilter.includes(m.id))
    : models;

  // Load all examples
  const examples = loadExamples();
  console.log(`Found ${examples.length} examples`);
  console.log(`Found ${models.length} models`);

  if (options.modelFilter.length > 0) {
    console.log(`Generating for: ${options.modelFilter.join(", ")}`);
  } else {
    console.log(`Generating for: all models`);
  }

  console.log(`Total combinations: ${examples.length * targetModels.length}`);
  console.log(`Concurrency: ${options.concurrency}`);
  console.log();

  if (options.forceAll) {
    console.log(`Force regenerating: ALL apps`);
    console.log();
  } else if (options.force.length > 0) {
    console.log(`Force regenerating: ${options.force.join(", ")}`);
    console.log();
  }

  // Track stats
  const stats = {
    skipped: 0,
    generated: 0,
    failed: 0,
  };

  // Build list of all tasks
  const tasks: Array<{ model: ModelConfig; spec: ExampleSpec }> = [];
  for (const model of targetModels) {
    for (const spec of examples) {
      tasks.push({ model, spec });
    }
  }

  // Process tasks with concurrency limit
  const runTask = async (task: { model: ModelConfig; spec: ExampleSpec }) => {
    const { model, spec } = task;
    console.log(`\n  [${model.id}/${spec.id}] ${spec.title}`);

    const result = await generateApp(model, spec, options);
    stats[result]++;

    switch (result) {
      case "skipped":
        console.log(`    Skipped (already exists)`);
        break;
      case "generated":
        console.log(`    Generated successfully`);
        break;
      case "failed":
        console.log(`    FAILED`);
        break;
    }
  };

  // Simple concurrency pool
  const pool: Promise<void>[] = [];
  for (const task of tasks) {
    const promise = runTask(task).then(() => {
      pool.splice(pool.indexOf(promise), 1);
    });
    pool.push(promise);

    if (pool.length >= options.concurrency) {
      await Promise.race(pool);
    }
  }
  await Promise.all(pool);

  // Print summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("SUMMARY");
  console.log(`${"=".repeat(60)}`);
  console.log(`  Generated: ${stats.generated}`);
  console.log(`  Skipped:   ${stats.skipped}`);
  console.log(`  Failed:    ${stats.failed}`);
  console.log();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
