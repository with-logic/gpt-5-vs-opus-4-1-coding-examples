"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { MODELS } from "@/lib/models";
import { getAllModelAggregates, formatBytes, formatNumber } from "@/lib/stats";
import { getModelHex } from "./stats-mini-chart";
import type { ModelAggregate, MetricSpread } from "@/lib/stats.types";

interface ChartDatum {
  name: string;
  value: number;
  min: number;
  max: number;
  stdDev: number;
  /** max value is used to set the Y domain so range lines are always visible */
  rangeMax: number;
  color: string;
}

interface MetricChartProps {
  title: string;
  data: ChartDatum[];
  formatter: (v: number) => string;
}

/* Custom bar shape: solid avg bar + translucent range band + whisker caps */
function BarWithRange(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  payload?: ChartDatum;
  background?: { x: number; y: number; width: number; height: number };
}) {
  const { x = 0, y = 0, width = 0, height = 0, fill = "#888", payload, background } = props;
  if (!payload || !background) return <rect x={x} y={y} width={width} height={height} fill={fill} rx={3} />;

  const chartBottom = background.y + background.height;
  const chartHeight = background.height;
  const maxDomain = payload.rangeMax;
  if (maxDomain === 0) return null;

  const scale = (v: number) => chartBottom - (v / maxDomain) * chartHeight;

  const minY = scale(payload.min);
  const maxY = scale(payload.max);
  const cx = x + width / 2;
  const capW = 6;

  return (
    <g>
      {/* Translucent range band */}
      <rect
        x={x + width * 0.2}
        y={maxY}
        width={width * 0.6}
        height={Math.max(0, minY - maxY)}
        fill={fill}
        opacity={0.12}
        rx={2}
      />
      {/* Solid avg bar */}
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={3} />
      {/* Vertical whisker line */}
      <line x1={cx} y1={maxY} x2={cx} y2={minY} stroke="#404040" strokeWidth={1} opacity={0.5} />
      {/* Max cap */}
      <line x1={cx - capW} y1={maxY} x2={cx + capW} y2={maxY} stroke="#404040" strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
      {/* Min cap */}
      <line x1={cx - capW} y1={minY} x2={cx + capW} y2={minY} stroke="#404040" strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
    </g>
  );
}

function MetricChart({ title, data, formatter }: MetricChartProps) {
  const yMax = data.length > 0 ? data[0].rangeMax : 0;

  return (
    <div className="bg-white p-5">
      <h3 className="text-sm font-medium text-neutral-900 mb-3">{title}</h3>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
            barCategoryGap="20%"
          >
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#737373" }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={50}
            />
            <YAxis hide domain={[0, yMax]} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as ChartDatum;
                return (
                  <div
                    style={{
                      fontSize: 11,
                      background: "#fff",
                      border: "1px solid #e5e5e5",
                      padding: "6px 10px",
                    }}
                  >
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>{label}</div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <span>Avg <strong>{formatter(d.value)}</strong></span>
                    </div>
                    <div style={{ color: "#737373", marginTop: 2 }}>
                      Min {formatter(d.min)} &mdash; Max {formatter(d.max)}
                    </div>
                    <div style={{ color: "#a3a3a3", marginTop: 1 }}>
                      &sigma; {formatter(d.stdDev)}
                    </div>
                  </div>
                );
              }}
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
            />
            <Bar
              dataKey="value"
              shape={<BarWithRange />}
              background={{ fill: "transparent" }}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function StatsModelDashboard() {
  const charts = useMemo(() => {
    const aggregates = getAllModelAggregates();
    if (aggregates.length === 0) return [];

    const toData = (
      spreadFn: (a: ModelAggregate) => MetricSpread
    ): ChartDatum[] => {
      const globalMax = Math.max(...aggregates.map((a) => spreadFn(a).max));
      const rangeMax = globalMax * 1.08; // 8% headroom so caps aren't clipped
      return aggregates.map((agg) => {
        const model = MODELS.find((m) => m.id === agg.modelId);
        const s = spreadFn(agg);
        return {
          name: model?.name ?? agg.modelId,
          value: s.avg,
          min: s.min,
          max: s.max,
          stdDev: s.stdDev,
          rangeMax,
          color: model ? getModelHex(model.color) : "#6b7280",
        };
      });
    };

    return [
      {
        title: "Avg Lines of Code",
        data: toData((a) => a.lines),
        formatter: (v: number) => formatNumber(Math.round(v)),
      },
      {
        title: "Avg File Size",
        data: toData((a) => a.sizeBytes),
        formatter: (v: number) => formatBytes(Math.round(v)),
      },
      {
        title: "Avg Gzip Size",
        data: toData((a) => a.gzipBytes),
        formatter: (v: number) => formatBytes(Math.round(v)),
      },
      {
        title: "Avg Gzip Ratio",
        data: toData((a) => a.gzipRatio),
        formatter: (v: number) => `${(v * 100).toFixed(1)}%`,
      },
      {
        title: "Avg DOM Tags",
        data: toData((a) => a.domTags),
        formatter: (v: number) => formatNumber(Math.round(v)),
      },
      {
        title: "Avg Nesting Depth",
        data: toData((a) => a.nestingDepth),
        formatter: (v: number) => v.toFixed(1),
      },
      {
        title: "Avg Comments",
        data: toData((a) => a.comments),
        formatter: (v: number) => formatNumber(Math.round(v)),
      },
      {
        title: "Avg Unique Tags",
        data: toData((a) => a.uniqueTags),
        formatter: (v: number) => formatNumber(Math.round(v)),
      },
      {
        title: "Avg CSS Lines",
        data: toData((a) => a.cssLines),
        formatter: (v: number) => formatNumber(Math.round(v)),
      },
      {
        title: "Avg JS Lines",
        data: toData((a) => a.jsLines),
        formatter: (v: number) => formatNumber(Math.round(v)),
      },
    ];
  }, []);

  if (charts.length === 0) {
    return (
      <div className="text-center text-neutral-400 py-12">
        No model stats available.
      </div>
    );
  }

  return (
    <div className="grid gap-px bg-neutral-200 grid-cols-1 border border-neutral-200 overflow-hidden">
      {charts.map((chart) => (
        <MetricChart
          key={chart.title}
          title={chart.title}
          data={chart.data}
          formatter={chart.formatter}
        />
      ))}
    </div>
  );
}
