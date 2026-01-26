// Re-export for backwards compatibility with UI components
import { models as modelConfigs } from "./models.config";

export const MODELS = modelConfigs.map(({ id, name, color }) => ({
  id,
  name,
  color,
}));
