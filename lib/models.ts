// Re-export for backwards compatibility with UI components
import { models as modelConfigs, providers as providerConfigs } from "./models.config";
import type { Provider } from "./models.config";

export const MODELS = modelConfigs.map(({ id, name, color, provider }) => ({
  id,
  name,
  color,
  provider,
}));

export const PROVIDERS = providerConfigs;

/** Models grouped by provider, in provider display order */
export const MODELS_BY_PROVIDER = providerConfigs.map((p) => ({
  ...p,
  models: MODELS.filter((m) => m.provider === p.id),
}));

/** Set of valid model IDs for validation */
export const MODEL_IDS = new Set(modelConfigs.map(m => m.id));

export type { Provider };
