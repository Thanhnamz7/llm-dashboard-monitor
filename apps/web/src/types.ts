export interface KPIData {
  totalRequests: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRate: number;
  successRequests: number;
  failedRequests: number;
}

export interface TimeSeriesPoint {
  timestamp: string;
  label: string;
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

export interface RequestRecord {
  request_id: string;
  timestamp: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  latency_ms: number;
  status: 'success' | 'error';
  error_type: string | null;
  estimated_cost: number;
}

export interface FilterState {
  timeRange: string;
  provider: string;
  model: string;
  status: string;
  search: string;
}
