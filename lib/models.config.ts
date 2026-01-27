export interface ModelConfig {
  /** Unique identifier used in URLs and file paths (e.g., "gpt-5.1") */
  id: string;

  /** Display name shown in the UI (e.g., "GPT-5.1") */
  name: string;

  /** CLI tool to invoke (e.g., "claude", "codex", "gemini") */
  cli: "claude" | "codex" | "gemini";

  /** Model identifier passed to the CLI tool (e.g., "opus", "gpt-5.1", "gemini-3") */
  model: string;

  /** Tailwind CSS class for the model's color indicator */
  color: string;
}

export const models: ModelConfig[] = [
  {
    id: "gpt-5",
    name: "GPT-5",
    cli: "codex",
    model: "gpt-5",
    color: "bg-emerald-500",
  },
  {
    id: "gpt-5.1",
    name: "GPT-5.1",
    cli: "codex",
    model: "gpt-5.1",
    color: "bg-teal-500",
  },
    {
    id: "gpt-5.2",
    name: "GPT-5.2",
    cli: "codex",
    model: "gpt-5.2",
    color: "bg-cyan-500",
  },
  {
    id: "opus-4.1",
    name: "Opus 4.1",
    cli: "claude",
    model: "claude-opus-4-1",
    color: "bg-amber-500",
  },
  {
    id: "opus-4.5",
    name: "Opus 4.5",
    cli: "claude",
    model: "claude-opus-4-5",
    color: "bg-orange-500",
  },
  {
    id: "sonnet-4.5",
    name: "Sonnet 4.5",
    cli: "claude",
    model: "claude-sonnet-4-5",
    color: "bg-purple-500",
  },
  {
    id: "gemini-3",
    name: "Gemini 3",
    cli: "gemini",
    model: "gemini-3-pro-preview",
    color: "bg-blue-500",
  },
  {
    id: "gemini-3-flash",
    name: "Gemini 3 Flash",
    cli: "gemini",
    model: "gemini-3-flash-preview",
    color: "bg-yellow-500",
  },
];

/** Helper to get a model by ID */
export function getModel(id: string): ModelConfig | undefined {
  return models.find((m) => m.id === id);
}

/** Get the output directory for a model's apps */
export function getModelAppsDir(modelId: string): string {
  return `public/apps/${modelId}`;
}

/** Get the output path for a specific app */
export function getAppOutputPath(modelId: string, appId: string): string {
  return `public/apps/${modelId}/${appId}/index.html`;
}
