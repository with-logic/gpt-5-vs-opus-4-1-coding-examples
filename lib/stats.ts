import rawStats from "./stats.data.json";
import type { StatsData, AppStats, AppModelStats, ModelAggregate } from "./stats.types";

export const stats = rawStats as unknown as StatsData;

/** Get stats for a specific app across all models */
export function getAppStats(appId: string): AppStats | undefined {
  return stats.apps[appId];
}

/** Get a specific metric value for each model on a given app */
export function getMetricByModel(
  appId: string,
  metricFn: (s: AppModelStats) => number
): Record<string, number> {
  const appStats = stats.apps[appId];
  if (!appStats) return {};
  const result: Record<string, number> = {};
  for (const [modelId, modelStats] of Object.entries(appStats.models)) {
    result[modelId] = metricFn(modelStats);
  }
  return result;
}

/** Get model aggregate stats */
export function getModelAggregate(modelId: string): ModelAggregate | undefined {
  return stats.modelAggregates[modelId];
}

/** Get all model aggregates in model config order */
export function getAllModelAggregates(): ModelAggregate[] {
  return stats.modelIds
    .map((id) => stats.modelAggregates[id])
    .filter(Boolean);
}

/** Format bytes to human-readable */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Format a number with commas */
export function formatNumber(n: number): string {
  return n.toLocaleString();
}
