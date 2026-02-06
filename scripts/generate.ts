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

// Set Claude max output tokens globally to avoid truncation errors
process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS = "128000";

// Max output token settings per CLI
const MAX_OUTPUT_TOKENS = {
  claude: 128000,
  codex: 100000,
  gemini: 65536, // Gemini's max - requires ~/.gemini/settings.json config
};

// Check token limit configurations on startup
function checkTokenLimits(): void {
  const warnings: string[] = [];

  // Check Claude
  const claudeTokens = process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS;
  if (!claudeTokens || parseInt(claudeTokens, 10) < 64000) {
    warnings.push(
      `  - Claude: CLAUDE_CODE_MAX_OUTPUT_TOKENS=${claudeTokens || "unset"} (recommend 128000)`
    );
  }

  // Check Gemini settings file
  const geminiSettingsPath = path.join(os.homedir(), ".gemini", "settings.json");
  try {
    if (fs.existsSync(geminiSettingsPath)) {
      const settings = JSON.parse(fs.readFileSync(geminiSettingsPath, "utf-8"));
      if (!settings.maxOutputTokens || settings.maxOutputTokens < 32000) {
        warnings.push(
          `  - Gemini: maxOutputTokens=${settings.maxOutputTokens || "unset"} in ~/.gemini/settings.json (recommend 65536)`
        );
      }
    } else {
      warnings.push(
        `  - Gemini: ~/.gemini/settings.json not found (consider setting maxOutputTokens: 65536)`
      );
    }
  } catch {
    warnings.push(`  - Gemini: Could not read ~/.gemini/settings.json`);
  }

  if (warnings.length > 0) {
    console.log("\n\x1b[33m⚠️  Token limit warnings:\x1b[0m");
    warnings.forEach((w) => console.log(w));
    console.log();
  }
}

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

function appFileExists(modelId: string, appId: string): boolean {
  const outputPath = path.join(REPO_ROOT, getAppOutputPath(modelId, appId));
  return fs.existsSync(outputPath);
}

async function appExistsAndValid(modelId: string, appId: string, logPrefix: string): Promise<boolean> {
  const outputPath = path.join(REPO_ROOT, getAppOutputPath(modelId, appId));

  if (!fs.existsSync(outputPath)) {
    return false;
  }

  // Validate the HTML doesn't have errors
  const validation = await validateHtml(outputPath);
  if (!validation.success) {
    console.log(`${logPrefix} ⚠️  Existing file has ${validation.errors.length} error(s), will regenerate`);
    validation.errors.slice(0, 3).forEach((e) => console.log(`${logPrefix}   - ${e}`));
  }

  return validation.success;
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

Begin implementation now. DO NOT FORGET TO STORE YOUR OUTPUT IN output/index.html, otherwise it will not count!`;
}

// ============================================================================
// CLI Invocation
// ============================================================================

function buildCliCommand(
  model: ModelConfig,
  prompt: string
): { cmd: string; args: string[]; env?: Record<string, string> } {
  switch (model.cli) {
    case "claude":
      return {
        cmd: "claude",
        args: [
          "-p",
          "--model",
          model.model,
          "--max-turns",
          "50",
          "--dangerously-skip-permissions",
          "--permission-mode",
          "bypassPermissions",
          "--settings",
          JSON.stringify({ maxOutputTokens: MAX_OUTPUT_TOKENS.claude }),
          prompt,
        ],
        env: {
          CLAUDE_CODE_MAX_OUTPUT_TOKENS: String(MAX_OUTPUT_TOKENS.claude),
        },
      };

    case "codex":
      return {
        cmd: "codex",
        args: [
          "exec",
          "--model",
          model.model,
          "--full-auto",
          "-c",
          `model_max_output_tokens=${MAX_OUTPUT_TOKENS.codex}`,
          prompt,
        ],
      };

    case "gemini":
      // Note: Gemini CLI doesn't have a CLI flag for max output tokens
      // It uses ~/.gemini/settings.json - user should configure manually if needed
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

// ============================================================================
// HTML Validation with Puppeteer
// ============================================================================

interface ValidationResult {
  success: boolean;
  errors: string[];
}

let puppeteer: typeof import("puppeteer") | null = null;

async function loadPuppeteer(): Promise<typeof import("puppeteer") | null> {
  if (puppeteer !== null) return puppeteer;
  try {
    puppeteer = await import("puppeteer");
    return puppeteer;
  } catch {
    return null;
  }
}

async function validateHtml(htmlPath: string): Promise<ValidationResult> {
  const pptr = await loadPuppeteer();
  if (!pptr) {
    // Puppeteer not available, skip validation
    return { success: true, errors: [] };
  }

  const errors: string[] = [];
  let browser;

  try {
    browser = await pptr.launch({ headless: true });
    const page = await browser.newPage();

    // Collect console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(`Console error: ${msg.text()}`);
      }
    });

    // Collect page errors (uncaught exceptions)
    page.on("pageerror", (err) => {
      errors.push(`Page error: ${err instanceof Error ? err.message : String(err)}`);
    });

    // Load the HTML file
    const fileUrl = `file://${htmlPath}`;
    await page.goto(fileUrl, { waitUntil: "networkidle0", timeout: 30000 });

    // Wait a bit for any async JS to run
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await browser.close();
  } catch (err) {
    errors.push(`Validation error: ${err}`);
    if (browser) await browser.close();
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

function buildFixPrompt(spec: ExampleSpec, errors: string[]): string {
  return `The HTML file you created has JavaScript errors. Please fix them.

## Original App: ${spec.title}

## Errors found:
${errors.map((e) => `- ${e}`).join("\n")}

## Instructions:
1. Read the current output/index.html file
2. Fix the JavaScript errors listed above
3. Save the fixed version to output/index.html

Do not rewrite the entire file from scratch - just fix the errors.`;
}

async function runCliOnce(
  model: ModelConfig,
  prompt: string,
  tempDir: string,
  logPrefix: string
): Promise<void> {
  const { cmd, args, env } = buildCliCommand(model, prompt);

  await new Promise<void>((resolve, reject) => {
    console.log(`${logPrefix} Running in sandbox: ${tempDir}`);
    console.log(`${logPrefix} Command: ${cmd} ${args[0]} ...`);

    const proc = spawn(cmd, args, {
      stdio: "inherit",
      cwd: tempDir,
      env: { ...process.env, ...env },
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
}

async function runCliInSandbox(
  model: ModelConfig,
  prompt: string,
  destPath: string,
  spec: ExampleSpec,
  logPrefix: string,
  maxRetries: number = 2
): Promise<void> {
  const tempDir = createTempDir();
  const tempOutputDir = path.join(tempDir, "output");
  const tempOutputFile = path.join(tempOutputDir, "index.html");

  // Create the output directory structure in temp
  fs.mkdirSync(tempOutputDir, { recursive: true });

  try {
    // Initial generation
    await runCliOnce(model, prompt, tempDir, logPrefix);

    if (!fs.existsSync(tempOutputFile)) {
      throw new Error(`CLI completed but output/index.html was not created in sandbox`);
    }

    // Validate and retry if needed
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const validation = await validateHtml(tempOutputFile);

      if (validation.success) {
        break;
      }

      console.log(`${logPrefix} ⚠️  Validation found ${validation.errors.length} error(s), attempting fix (${attempt + 1}/${maxRetries})...`);
      validation.errors.slice(0, 5).forEach((e) => console.log(`${logPrefix}   - ${e}`));

      // Run CLI again with fix prompt
      const fixPrompt = buildFixPrompt(spec, validation.errors);
      await runCliOnce(model, fixPrompt, tempDir, logPrefix);
    }

    // Final validation (just for logging)
    const finalValidation = await validateHtml(tempOutputFile);
    if (!finalValidation.success) {
      console.log(`${logPrefix} ⚠️  Still has ${finalValidation.errors.length} error(s) after ${maxRetries} fix attempts`);
    }

    // Copy the output file to the final destination
    ensureDir(destPath);
    fs.copyFileSync(tempOutputFile, destPath);
    console.log(`${logPrefix} Copied output to: ${destPath}`);
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
  const logPrefix = `[${model.id}/${spec.id}]`;

  // Check if app exists and should be skipped
  const forceRegenerate = options.forceAll || options.force.includes(spec.id);
  if (!forceRegenerate && await appExistsAndValid(model.id, spec.id, logPrefix)) {
    return "skipped";
  }

  // Build the prompt (agents write to output/index.html in their sandbox)
  const prompt = buildPrompt(spec);

  try {
    // Run CLI in isolated temp directory, then copy result to final location
    await runCliInSandbox(model, prompt, absoluteOutputPath, spec, logPrefix);

    // Verify the file was created
    if (fs.existsSync(absoluteOutputPath)) {
      return "generated";
    } else {
      console.error(
        `${logPrefix} WARNING: CLI completed but ${outputPath} was not created`
      );
      return "failed";
    }
  } catch (error) {
    console.error(`${logPrefix} ERROR: ${error}`);
    return "failed";
  }
}

async function main(): Promise<void> {
  // Check token limits on startup
  checkTokenLimits();

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

  // Parse positional args as model IDs (matches on id or model field)
  for (const arg of args) {
    if (arg.startsWith("--")) break;
    const model = models.find(m => m.id === arg || m.model === arg);
    if (model) {
      options.modelFilter.push(model.id);
    } else {
      console.error(`Unknown model: "${arg}". Available models: ${models.map(m => m.id).join(", ")}`);
      process.exit(1);
    }
  }

  // Determine which models to generate for
  const targetModels = options.modelFilter.length > 0
    ? models.filter(m => options.modelFilter.includes(m.id))
    : models;

  // Load all examples
  const examples = loadExamples();
  console.log(`Found ${examples.length} examples`);
  console.log(`Found ${targetModels.length} model(s) to generate for (${models.length} total)`);

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
    const logPrefix = `[${model.id}/${spec.id}]`;
    console.log(`\n${logPrefix} ${spec.title}`);

    const result = await generateApp(model, spec, options);
    stats[result]++;

    switch (result) {
      case "skipped":
        console.log(`${logPrefix} Skipped (already exists)`);
        break;
      case "generated":
        console.log(`${logPrefix} ✓ Generated successfully`);
        break;
      case "failed":
        console.log(`${logPrefix} ✗ FAILED`);
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
