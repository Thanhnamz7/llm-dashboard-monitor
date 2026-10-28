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

export interface BudgetConfig {
  maxCostLimit: number;      // Ví dụ: $10.00
  maxTokenLimit: number;     // Ví dụ: 1,000,000 tokens
  warnAtPercentage: number;  // Mặc định 80% (cảnh báo vàng), 100% (cảnh báo đỏ/nguy cấp)
}

export interface BudgetAlertStatus {
  costStatus: 'SAFE' | 'WARNING' | 'CRITICAL';
  costPercentageUsed: number;
  tokenStatus: 'SAFE' | 'WARNING' | 'CRITICAL';
  tokenPercentageUsed: number;
  alertMessages: string[];
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

// Logic kiểm tra và phát cảnh báo ngân sách / hạn mức token
export function evaluateBudgetAlert(currentCost: number, currentTokens: number, config: BudgetConfig): BudgetAlertStatus {
  const costPercentageUsed = Number(((currentCost / config.maxCostLimit) * 100).toFixed(1));
  const tokenPercentageUsed = Number(((currentTokens / config.maxTokenLimit) * 100).toFixed(1));

  let costStatus: 'SAFE' | 'WARNING' | 'CRITICAL' = 'SAFE';
  let tokenStatus: 'SAFE' | 'WARNING' | 'CRITICAL' = 'SAFE';
  const alertMessages: string[] = [];

  // Đánh giá chi phí (Cost)
  if (costPercentageUsed >= 100) {
    costStatus = 'CRITICAL';
    alertMessages.push(`[NGUY CẤP] Đã VƯỢT HẠN MỨC NGÂN SÁCH! Đã dùng $${currentCost} / $${config.maxCostLimit} (${costPercentageUsed}%). Cần tạm dừng các request không ưu tiên!`);
  } else if (costPercentageUsed >= config.warnAtPercentage) {
    costStatus = 'WARNING';
    alertMessages.push(`[CẢNH BÁO SỚM] Chi phí đã đạt ${costPercentageUsed}% ngân sách ($${currentCost} / $${config.maxCostLimit}). Hãy xem xét tối ưu prompt hoặc đổi model rẻ hơn!`);
  }

  // Đánh giá lượng Token tiêu thụ
  if (tokenPercentageUsed >= 100) {
    tokenStatus = 'CRITICAL';
    alertMessages.push(`[NGUY CẤP] Đã VƯỢT HẠN MỨC TOKEN! Đã dùng ${currentTokens.toLocaleString()} / ${config.maxTokenLimit.toLocaleString()} tokens (${tokenPercentageUsed}%).`);
  } else if (tokenPercentageUsed >= config.warnAtPercentage) {
    tokenStatus = 'WARNING';
    alertMessages.push(`[CẢNH BÁO SỚM] Tiêu thụ Token đạt ${tokenPercentageUsed}% hạn mức cho phép.`);
  }

  return {
    costStatus,
    costPercentageUsed,
    tokenStatus,
    tokenPercentageUsed,
    alertMessages,
  };
}
