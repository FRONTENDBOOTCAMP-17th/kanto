"use client";

import { useReportWebVitals } from "next/web-vitals";

const THRESHOLDS = {
  LCP:  { good: 2500, poor: 4000 },
  INP:  { good: 200,  poor: 500  },
  CLS:  { good: 0.1,  poor: 0.25 },
  FCP:  { good: 1800, poor: 3000 },
  TTFB: { good: 800,  poor: 1800 },
  FID:  { good: 100,  poor: 300  },
} as const;

type MetricName = keyof typeof THRESHOLDS;

function getRating(name: MetricName, value: number): string {
  const t = THRESHOLDS[name];
  if (value <= t.good) return "✅ good";
  if (value <= t.poor) return "⚠️ needs improvement";
  return "❌ poor";
}

function formatValue(name: string, value: number): string {
  if (name === "CLS") return value.toFixed(3);
  return `${Math.round(value)}ms`;
}

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV !== "development") return;

    const name = metric.name as MetricName;
    const rating = name in THRESHOLDS ? getRating(name, metric.value) : "";
    const val = formatValue(metric.name, metric.value);

    console.log(`[CWV] ${metric.name.padEnd(5)} ${val.padStart(10)}  ${rating}`);
  });

  return null;
}
