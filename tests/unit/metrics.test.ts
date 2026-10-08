import { describe, it, expect } from 'vitest';
import { calculateKPIs, calculatePercentile, calculateTimeSeries } from '../../packages/metrics/src/index';

describe('Metrics Calculation Unit Tests', () => {
  // TC07: 100 requests, 10 errors -> Error rate = 10%
  it('TC07: 100 requests with 10 failures results in errorRate = 10%', () => {
    const records = Array.from({ length: 100 }, (_, i) => ({
      input_tokens: 100,
      output_tokens: 50,
      total_tokens: 150,
      latency_ms: 500,
      status: i < 10 ? 'error' : 'success',
      estimated_cost: 0.001,
    }));

    const kpis = calculateKPIs(records);
    expect(kpis.totalRequests).toBe(100);
    expect(kpis.failedRequests).toBe(10);
    expect(kpis.errorRate).toBe(10);
  });

  // TC17: P95 latency percentile calculation
  it('TC17: P95 latency matches statistical expectation', () => {
    // 100 values from 10 to 1000
    const latencies = Array.from({ length: 100 }, (_, i) => (i + 1) * 10);
    const p95 = calculatePercentile(latencies, 95);
    expect(p95).toBe(950);
  });

  // TC10: Empty records return zero KPIs
  it('TC10: Empty dataset returns zeroed metrics safely', () => {
    const kpis = calculateKPIs([]);
    expect(kpis.totalRequests).toBe(0);
    expect(kpis.totalTokens).toBe(0);
    expect(kpis.estimatedCost).toBe(0);
    expect(kpis.avgLatencyMs).toBe(0);
    expect(kpis.errorRate).toBe(0);
  });

  // TC11: Dashboard KPI calculations are exact
  it('TC11: Correct aggregation of tokens, cost, and average latency', () => {
    const records = [
      { input_tokens: 100, output_tokens: 200, total_tokens: 300, latency_ms: 400, status: 'success', estimated_cost: 0.002 },
      { input_tokens: 300, output_tokens: 400, total_tokens: 700, latency_ms: 600, status: 'success', estimated_cost: 0.005 },
    ];
    const kpis = calculateKPIs(records);
    expect(kpis.totalRequests).toBe(2);
    expect(kpis.totalTokens).toBe(1000);
    expect(kpis.avgLatencyMs).toBe(500);
    expect(kpis.estimatedCost).toBe(0.007);
    expect(kpis.errorRate).toBe(0);
  });
});
