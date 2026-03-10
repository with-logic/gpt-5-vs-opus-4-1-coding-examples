"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { MODELS as BASE_MODELS } from "@/lib/models";
import { getAppStats, formatBytes, formatNumber } from "@/lib/stats";
import { getModelHex } from "./stats-mini-chart";

const MODELS = BASE_MODELS.map((m) => ({
  ...m,
  hex: getModelHex(m.color),
}));

interface StatsComparisonPanelProps {
  appId: string;
  selectedModels: string[];
}

export function StatsComparisonPanel({
  appId,
  selectedModels,
}: StatsComparisonPanelProps) {
  const appStats = useMemo(() => getAppStats(appId), [appId]);

  const activeModels = useMemo(
    () => MODELS.filter((m) => selectedModels.includes(m.id)),
    [selectedModels]
  );

  if (!appStats) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-400">
        No stats available
      </div>
    );
  }

  const linesData = activeModels
    .filter((m) => appStats.models[m.id])
    .map((m) => {
      const s = appStats.models[m.id];
      return {
        name: m.name,
        HTML: s.lines.html,
        CSS: s.lines.css,
        JS: s.lines.js,
      };
    });

  const sizeData = activeModels
    .filter((m) => appStats.models[m.id])
    .map((m) => {
      const s = appStats.models[m.id];
      return {
        name: m.name,
        Raw: Math.round(s.sizeBytes / 1024),
        Gzip: Math.round(s.gzipBytes / 1024),
      };
    });

  const radarMetrics = [
    "Nesting",
    "Tags",
    "CSS Vars",
    "Animations",
    "Colors",
  ];
  const radarData = radarMetrics.map((metric) => {
    const row: Record<string, string | number> = { metric };
    const values = activeModels
      .filter((m) => appStats.models[m.id])
      .map((m) => {
        const s = appStats.models[m.id];
        switch (metric) {
          case "Nesting":
            return s.dom.maxNestingDepth;
          case "Tags":
            return s.dom.tagCount;
          case "CSS Vars":
            return s.extras.cssVariables;
          case "Animations":
            return s.extras.animations;
          case "Colors":
            return s.extras.uniqueColors;
          default:
            return 0;
        }
      });
    const maxVal = Math.max(...values, 1);
    activeModels
      .filter((m) => appStats.models[m.id])
      .forEach((m, i) => {
        row[m.id] = Math.round((values[i] / maxVal) * 100);
      });
    return row;
  });

  const tooltipStyle = {
    fontSize: 11,
    background: "#fff",
    border: "1px solid #e5e5e5",
    borderRadius: 0,
    padding: "6px 8px",
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-8">
        {/* Lines of Code */}
        <section>
          <h3 className="text-xs font-medium text-neutral-900 mb-3">
            Lines of Code
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={linesData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number, n: string) => [
                    `${formatNumber(v)} lines`,
                    n,
                  ]}
                />
                <Bar dataKey="HTML" stackId="lines" fill="#a3a3a3" />
                <Bar dataKey="CSS" stackId="lines" fill="#6366f1" />
                <Bar
                  dataKey="JS"
                  stackId="lines"
                  fill="#f59e0b"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* File Size */}
        <section>
          <h3 className="text-xs font-medium text-neutral-900 mb-3">
            File Size (KB)
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sizeData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number, n: string) => [`${v} KB`, n]}
                />
                <Bar dataKey="Raw" fill="#a3a3a3" />
                <Bar dataKey="Gzip" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Complexity Radar */}
        {activeModels.length >= 2 && (
          <section>
            <h3 className="text-xs font-medium text-neutral-900 mb-3">
              Complexity Radar
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e5e5" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis
                    tick={false}
                    axisLine={false}
                    domain={[0, 100]}
                  />
                  {activeModels
                    .filter((m) => appStats.models[m.id])
                    .map((m) => (
                      <Radar
                        key={m.id}
                        name={m.name}
                        dataKey={m.id}
                        stroke={m.hex}
                        fill={m.hex}
                        fillOpacity={0.15}
                      />
                    ))}
                  <Tooltip contentStyle={tooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Quick stats table */}
        <section>
          <h3 className="text-xs font-medium text-neutral-900 mb-3">
            Summary
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-2 pr-4 font-medium text-neutral-500">
                    Metric
                  </th>
                  {activeModels
                    .filter((m) => appStats.models[m.id])
                    .map((m) => (
                      <th
                        key={m.id}
                        className="text-right py-2 px-2 font-medium text-neutral-500"
                      >
                        {m.name}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    label: "Total Lines",
                    fn: (s: typeof appStats.models[string]) =>
                      formatNumber(s.lines.total),
                  },
                  {
                    label: "File Size",
                    fn: (s: typeof appStats.models[string]) =>
                      formatBytes(s.sizeBytes),
                  },
                  {
                    label: "Gzipped",
                    fn: (s: typeof appStats.models[string]) =>
                      formatBytes(s.gzipBytes),
                  },
                  {
                    label: "DOM Tags",
                    fn: (s: typeof appStats.models[string]) =>
                      formatNumber(s.dom.tagCount),
                  },
                  {
                    label: "Comments",
                    fn: (s: typeof appStats.models[string]) =>
                      formatNumber(s.comments.total),
                  },
                  {
                    label: "Ext. Deps",
                    fn: (s: typeof appStats.models[string]) =>
                      formatNumber(s.externalDeps.total),
                  },
                ].map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-neutral-100"
                  >
                    <td className="py-1.5 pr-4 text-neutral-700">
                      {row.label}
                    </td>
                    {activeModels
                      .filter((m) => appStats.models[m.id])
                      .map((m) => (
                        <td
                          key={m.id}
                          className="py-1.5 px-2 text-right text-neutral-600 tabular-nums"
                        >
                          {row.fn(appStats.models[m.id])}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
