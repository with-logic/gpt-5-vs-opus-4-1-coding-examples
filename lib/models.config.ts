export type Provider = "openai" | "anthropic" | "google" | "moonshot";

export interface ProviderConfig {
  id: Provider;
  name: string;
}

export const providers: ProviderConfig[] = [
  { id: "openai", name: "OpenAI" },
  { id: "anthropic", name: "Anthropic" },
  { id: "google", name: "Google" },
  { id: "moonshot", name: "Moonshot AI" },
];

export interface ModelConfig {
  /** Unique identifier used in URLs and file paths (e.g., "gpt-5.1") */
  id: string;

  /** Display name shown in the UI (e.g., "GPT-5.1") */
  name: string;

  /** CLI tool to invoke (e.g., "claude", "codex", "gemini", "anthropic-proxy") */
  cli: "claude" | "codex" | "gemini" | "anthropic-proxy";

  /** Model identifier passed to the CLI tool (e.g., "opus", "gpt-5.1", "gemini-3") */
  model: string;

  /** Tailwind CSS class for the model's color indicator */
  color: string;

  /** Provider that owns this model */
  provider: Provider;
}

export const models: ModelConfig[] = [
  {
    id: "gpt-5",
    name: "GPT-5",
    cli: "codex",
    model: "gpt-5",
    color: "bg-emerald-500",
    provider: "openai",
  },
  {
    id: "gpt-5.1",
    name: "GPT-5.1",
    cli: "codex",
    model: "gpt-5.1",
    color: "bg-teal-500",
    provider: "openai",
  },
    {
    id: "gpt-5.2",
    name: "GPT-5.2",
    cli: "codex",
    model: "gpt-5.2",
    color: "bg-cyan-500",
    provider: "openai",
  },
  {
    id: "gpt-5.3-codex",
    name: "GPT-5.3 Codex",
    cli: "codex",
    model: "gpt-5.3-codex",
    color: "bg-indigo-500",
    provider: "openai",
  },
  {
    id: "gpt-5.4",
    name: "GPT-5.4",
    cli: "codex",
    model: "gpt-5.4",
    color: "bg-sky-500",
    provider: "openai",
  },
  {
    id: "opus-4.1",
    name: "Opus 4.1",
    cli: "claude",
    model: "claude-opus-4-1",
    color: "bg-amber-500",
    provider: "anthropic",
  },
  {
    id: "opus-4.5",
    name: "Opus 4.5",
    cli: "claude",
    model: "claude-opus-4-5",
    color: "bg-orange-500",
    provider: "anthropic",
  },
  {
    id: "opus-4.6",
    name: "Opus 4.6",
    cli: "claude",
    model: "claude-opus-4-6",
    color: "bg-red-500",
    provider: "anthropic",
  },
  {
    id: "opus-4.7",
    name: "Opus 4.7",
    cli: "claude",
    model: "claude-opus-4-7",
    color: "bg-pink-500",
    provider: "anthropic",
  },
  {
    id: "sonnet-4.5",
    name: "Sonnet 4.5",
    cli: "claude",
    model: "claude-sonnet-4-5",
    color: "bg-purple-500",
    provider: "anthropic",
  },
  {
    id: "sonnet-4.6",
    name: "Sonnet 4.6",
    cli: "claude",
    model: "claude-sonnet-4-6",
    color: "bg-violet-500",
    provider: "anthropic",
  },
  {
    id: "haiku-4.5",
    name: "Haiku 4.5",
    cli: "claude",
    model: "claude-haiku-4-5",
    color: "bg-rose-500",
    provider: "anthropic",
  },
  {
    id: "gemini-3",
    name: "Gemini 3",
    cli: "gemini",
    model: "gemini-3-pro-preview",
    color: "bg-blue-500",
    provider: "google",
  },
  {
    id: "gemini-3-flash",
    name: "Gemini 3 Flash",
    cli: "gemini",
    model: "gemini-3-flash-preview",
    color: "bg-yellow-500",
    provider: "google",
  },
  {
    id: "kimi-k2.6",
    name: "Kimi K2.6",
    cli: "anthropic-proxy",
    model: "accounts/fireworks/models/kimi-k2p6",
    color: "bg-fuchsia-500",
    provider: "moonshot",
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
