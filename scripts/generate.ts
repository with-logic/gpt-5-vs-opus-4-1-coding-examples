import { spawn } from "child_process";
import * as fs from "fs";
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

function buildPrompt(spec: ExampleSpec, outputPath: string): string {
  return `You are implementing a single self-contained HTML file.

## App: ${spec.title}

## Specification:
${spec.prompt}

## Requirements:
- Create a single index.html file with ALL CSS and JavaScript inlined
- The file must be fully self-contained
- You may use CDN links for libraries (e.g., Tailwind CSS, React, Three.js) if needed
- Place the file at: ${outputPath}
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
          prompt,
        ],
      };

    case "codex":
      return {
        cmd: "codex",
        args: ["exec", "--model", model.model, prompt],
      };

    case "gemini":
      return {
        cmd: "gemini",
        args: ["--model", model.model, "--approval-mode", "yolo", prompt],
      };

    default:
      throw new Error(`Unknown CLI type: ${(model as ModelConfig).cli}`);
  }
}

async function runCli(model: ModelConfig, prompt: string): Promise<void> {
  const { cmd, args } = buildCliCommand(model, prompt);

  return new Promise((resolve, reject) => {
    console.log(`    Running: ${cmd} ${args[0]} ...`);

    const proc = spawn(cmd, args, {
      stdio: "inherit",
      cwd: REPO_ROOT,
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
  const forceRegenerate = options.force.includes(spec.id);
  if (appExists(model.id, spec.id) && !forceRegenerate) {
    return "skipped";
  }

  // Ensure output directory exists
  ensureDir(absoluteOutputPath);

  // Build and run the prompt
  const prompt = buildPrompt(spec, outputPath);

  try {
    await runCli(model, prompt);

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
  };

  // Parse --force flag
  const forceIndex = args.indexOf("--force");
  if (forceIndex !== -1) {
    // Collect all args after --force until the next flag or end
    for (let i = forceIndex + 1; i < args.length; i++) {
      if (args[i].startsWith("--")) break;
      options.force.push(args[i]);
    }
  }

  // Load all examples
  const examples = loadExamples();
  console.log(`Found ${examples.length} examples`);
  console.log(`Found ${models.length} models`);
  console.log(`Total combinations: ${examples.length * models.length}`);
  console.log();

  if (options.force.length > 0) {
    console.log(`Force regenerating: ${options.force.join(", ")}`);
    console.log();
  }

  // Track stats
  const stats = {
    skipped: 0,
    generated: 0,
    failed: 0,
  };

  // Generate apps sequentially
  for (const model of models) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Model: ${model.name} (${model.id})`);
    console.log(`${"=".repeat(60)}`);

    for (const spec of examples) {
      console.log(`\n  [${spec.id}] ${spec.title}`);

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
    }
  }

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
