export interface KPIMetrics {
  totalRequests: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRate: number; // percentage (0 - 100)
  successRequests: number;
  failedRequests: number;
}

export interface TimeSeriesPoint {
  timestamp: string; // ISO string bucket
  label: string; // Formatted date/time for chart
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  errorRate: number;
  successCount: number;
  errorCount: number;
}

export interface ModelBreakdownItem {
  model: string;
  provider: string;
  requests: number;
  totalTokens: number;
  estimatedCost: number;
  avgLatencyMs: number;
  errorRate: number;
}

export interface ErrorBreakdownItem {
  errorType: string;
  count: number;
  percentage: number;
}

export function calculatePercentile(latencies: number[], percentile: number): number {
  if (latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}

export function calculateKPIs(records: Array<{
  input_tokens: number;
  output_tokens: number;
  total_tokens?: number;
  latency_ms: number;
  status: string;
  estimated_cost: number;
}>): KPIMetrics {
  const totalRequests = records.length;
  if (totalRequests === 0) {
    return {
      totalRequests: 0,
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0,
      avgLatencyMs: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
      errorRate: 0,
      successRequests: 0,
      failedRequests: 0,
    };
  }

  let inputTokens = 0;
  let outputTokens = 0;
  let totalTokens = 0;
  let totalLatency = 0;
  let failedRequests = 0;
  let estimatedCost = 0;
  const latencies: number[] = [];

  for (const r of records) {
    const inp = Number(r.input_tokens) || 0;
    const out = Number(r.output_tokens) || 0;
    const tot = Number(r.total_tokens ?? (inp + out)) || 0;
    const lat = Number(r.latency_ms) || 0;
    const cost = Number(r.estimated_cost) || 0;

    inputTokens += inp;
    outputTokens += out;
    totalTokens += tot;
    totalLatency += lat;
    estimatedCost += cost;
    latencies.push(lat);

    if (r.status === 'error') {
      failedRequests++;
    }
  }

  return {
    totalRequests,
    totalTokens,
    inputTokens,
    outputTokens,
    estimatedCost: Number(estimatedCost.toFixed(4)),
    avgLatencyMs: Math.round(totalLatency / totalRequests),
    p50LatencyMs: calculatePercentile(latencies, 50),
    p95LatencyMs: calculatePercentile(latencies, 95),
    p99LatencyMs: calculatePercentile(latencies, 99),
    errorRate: Number(((failedRequests / totalRequests) * 100).toFixed(2)),
    successRequests: totalRequests - failedRequests,
    failedRequests,
  };
}

export function calculateTimeSeries(
  records: Array<{
    timestamp: string | Date;
    input_tokens: number;
    output_tokens: number;
    total_tokens?: number;
    latency_ms: number;
    status: string;
    estimated_cost: number;
  }>,
  bucketCount: number = 24
): TimeSeriesPoint[] {
  if (records.length === 0) return [];

  // Sort chronologically
  const sorted = [...records].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const minTime = new Date(sorted[0].timestamp).getTime();
  const maxTime = new Date(sorted[sorted.length - 1].timestamp).getTime();
  const span = Math.max(1, maxTime - minTime);
  const interval = Math.max(60000, Math.ceil(span / bucketCount)); // at least 1 min per bucket

  const buckets: Map<number, typeof records> = new Map();

  for (const r of sorted) {
    const time = new Date(r.timestamp).getTime();
    const bucketIndex = Math.min(bucketCount - 1, Math.floor((time - minTime) / interval));
    const bucketTime = minTime + bucketIndex * interval;

    if (!buckets.has(bucketTime)) {
      buckets.set(bucketTime, []);
    }
    buckets.get(bucketTime)!.push(r);
  }

  const result: TimeSeriesPoint[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const bucketTime = minTime + i * interval;
    const bucketRecords = buckets.get(bucketTime) || [];
    const date = new Date(bucketTime);
    const label = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

    if (bucketRecords.length === 0) {
      result.push({
        timestamp: date.toISOString(),
        label,
        requests: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
        avgLatencyMs: 0,
        p95LatencyMs: 0,
        errorRate: 0,
        successCount: 0,
        errorCount: 0,
      });
      continue;
    }

    const kpis = calculateKPIs(bucketRecords);
    result.push({
      timestamp: date.toISOString(),
      label,
      requests: kpis.totalRequests,
      inputTokens: kpis.inputTokens,
      outputTokens: kpis.outputTokens,
      totalTokens: kpis.totalTokens,
      estimatedCost: kpis.estimatedCost,
      avgLatencyMs: kpis.avgLatencyMs,
      p95LatencyMs: kpis.p95LatencyMs,
      errorRate: kpis.errorRate,
      successCount: kpis.successRequests,
      errorCount: kpis.failedRequests,
    });
  }

  return result;
}

export function calculateModelBreakdown(
  records: Array<{
    model: string;
    provider: string;
    input_tokens: number;
    output_tokens: number;
    total_tokens?: number;
    latency_ms: number;
    status: string;
    estimated_cost: number;
  }>
): ModelBreakdownItem[] {
  const groups: Record<string, typeof records> = {};

  for (const r of records) {
    const key = `${r.provider}::${r.model}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  }

  return Object.entries(groups).map(([key, groupRecords]) => {
    const [provider, model] = key.split('::');
    const kpis = calculateKPIs(groupRecords);
    return {
      model,
      provider,
      requests: kpis.totalRequests,
      totalTokens: kpis.totalTokens,
      estimatedCost: kpis.estimatedCost,
      avgLatencyMs: kpis.avgLatencyMs,
      errorRate: kpis.errorRate,
    };
  }).sort((a, b) => b.requests - a.requests);
}

export function calculateErrorBreakdown(
  records: Array<{
    status: string;
    error_type?: string | null;
  }>
): ErrorBreakdownItem[] {
  const errorCounts: Record<string, number> = {};
  let totalErrors = 0;

  for (const r of records) {
    if (r.status === 'error') {
      const type = r.error_type || 'Unknown';
      errorCounts[type] = (errorCounts[type] || 0) + 1;
      totalErrors++;
    }
  }

  if (totalErrors === 0) return [];

  return Object.entries(errorCounts).map(([errorType, count]) => ({
    errorType,
    count,
    percentage: Number(((count / totalErrors) * 100).toFixed(1)),
  })).sort((a, b) => b.count - a.count);
}
