// Re-export for backwards compatibility with UI components
import { models as modelConfigs } from "./models.config";

export const MODELS = modelConfigs.map(({ id, name, color }) => ({
  id,
  name,
  color,
}));

/** Set of valid model IDs for validation */
export const MODEL_IDS = new Set(modelConfigs.map(m => m.id));
