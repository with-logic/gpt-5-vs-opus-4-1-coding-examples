/** Per-model stats for a single app */
export interface AppModelStats {
  /** Raw file size in bytes */
  sizeBytes: number;
  /** Gzipped file size in bytes */
  gzipBytes: number;
  /** Gzip ratio (gzipBytes / sizeBytes) — lower = more compressible */
  gzipRatio: number;

  /** Line counts */
  lines: {
    total: number;
    html: number;
    css: number;
    js: number;
    blank: number;
  };

  /** Comment counts */
  comments: {
    html: number;
    css: number;
    js: number;
    total: number;
  };

  /** DOM metrics */
  dom: {
    tagCount: number;
    uniqueTags: number;
    maxNestingDepth: number;
  };

  /** External dependencies */
  externalDeps: {
    scripts: number;
    stylesheets: number;
    fonts: number;
    total: number;
  };

  /** Fun / extra metrics */
  extras: {
    cssVariables: number;
    uniqueColors: number;
    mediaQueries: number;
    animations: number;
    svgCount: number;
    canvasCount: number;
  };
}

/** Stats for one app across all models */
export interface AppStats {
  appId: string;
  models: Record<string, AppModelStats>;
}

/** Spread stats (min / max / stdDev) for a single metric */
export interface MetricSpread {
  avg: number;
  min: number;
  max: number;
  stdDev: number;
}

/** Aggregate stats for a single model across all apps */
export interface ModelAggregate {
  modelId: string;
  totalApps: number;
  sizeBytes: MetricSpread;
  gzipBytes: MetricSpread;
  gzipRatio: MetricSpread;
  lines: MetricSpread;
  cssLines: MetricSpread;
  jsLines: MetricSpread;
  htmlLines: MetricSpread;
  comments: MetricSpread;
  domTags: MetricSpread;
  uniqueTags: MetricSpread;
  nestingDepth: MetricSpread;
}

/** Top-level stats data shape (the JSON file) */
export interface StatsData {
  generatedAt: string;
  modelIds: string[];
  appIds: string[];
  apps: Record<string, AppStats>;
  modelAggregates: Record<string, ModelAggregate>;
}
