export interface KPIMetrics {
  totalRequests: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  errorRate: number; // percentage (0 - 100)
}

export function calculatePercentile(latencies: number[], percentile: number): number {
  if (latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

export function calculateKPIs(records: Array<{
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
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
      p95LatencyMs: 0,
      errorRate: 0,
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
    inputTokens += r.input_tokens;
    outputTokens += r.output_tokens;
    totalTokens += r.total_tokens;
    totalLatency += r.latency_ms;
    estimatedCost += r.estimated_cost;
    latencies.push(r.latency_ms);
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
    p95LatencyMs: calculatePercentile(latencies, 95),
    errorRate: Number(((failedRequests / totalRequests) * 100).toFixed(2)),
  };
}
