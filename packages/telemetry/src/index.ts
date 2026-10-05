import { z } from 'zod';

export const TelemetryRequestSchema = z.object({
  request_id: z.string().min(1),
  timestamp: z.string().or(z.date()),
  provider: z.string().min(1),
  model: z.string().min(1),
  input_tokens: z.number().int().nonnegative(),
  output_tokens: z.number().int().nonnegative(),
  total_tokens: z.number().int().nonnegative(),
  latency_ms: z.number().int().nonnegative(),
  status: z.enum(['success', 'error']),
  error_type: z.string().nullable().optional(),
  estimated_cost: z.number().nonnegative(),
});

export type TelemetryRequest = z.infer<typeof TelemetryRequestSchema>;

// Default pricing per token (USD) for common models if not specified
export const DEFAULT_PRICING: Record<string, { inputPrice: number; outputPrice: number }> = {
  'gpt-4o': { inputPrice: 0.000005, outputPrice: 0.000015 },
  'gpt-4o-mini': { inputPrice: 0.00000015, outputPrice: 0.0000006 },
  'gpt-4-turbo': { inputPrice: 0.00001, outputPrice: 0.00003 },
  'claude-3-5-sonnet': { inputPrice: 0.000003, outputPrice: 0.000015 },
  'claude-3-haiku': { inputPrice: 0.00000025, outputPrice: 0.00000125 },
  'gemini-1.5-pro': { inputPrice: 0.0000035, outputPrice: 0.0000105 },
  'gemini-1.5-flash': { inputPrice: 0.00000035, outputPrice: 0.00000105 },
  'opencode-code-v1': { inputPrice: 0.000001, outputPrice: 0.000002 },
  'deepseek-coder': { inputPrice: 0.00000014, outputPrice: 0.00000028 },
};

export function calculateEstimatedCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  customPricing?: { inputPrice: number; outputPrice: number }
): number {
  const pricing = customPricing || DEFAULT_PRICING[model] || { inputPrice: 0.000002, outputPrice: 0.000005 };
  const cost = inputTokens * pricing.inputPrice + outputTokens * pricing.outputPrice;
  return Number(cost.toFixed(6));
}

export function normalizeTelemetry(
  raw: any,
  options?: { customPricing?: { inputPrice: number; outputPrice: number } }
): TelemetryRequest {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid telemetry payload: must be a non-null object');
  }

  // Support both snake_case and camelCase inputs
  const requestId = String(
    raw.request_id ||
    raw.requestId ||
    raw.id ||
    `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );

  let timestamp = raw.timestamp || raw.createdAt || new Date().toISOString();
  if (timestamp instanceof Date) {
    timestamp = timestamp.toISOString();
  } else if (typeof timestamp === 'number') {
    timestamp = new Date(timestamp).toISOString();
  } else {
    timestamp = new Date(timestamp).toISOString();
  }

  const provider = String(raw.provider || 'opencode').toLowerCase();
  const model = String(raw.model || 'opencode-code-v1');
  const inputTokens = Math.max(0, parseInt(raw.input_tokens ?? raw.inputTokens ?? 0, 10) || 0);
  const outputTokens = Math.max(0, parseInt(raw.output_tokens ?? raw.outputTokens ?? 0, 10) || 0);
  const totalTokens = Math.max(
    inputTokens + outputTokens,
    parseInt(raw.total_tokens ?? raw.totalTokens ?? (inputTokens + outputTokens), 10) || 0
  );
  const latencyMs = Math.max(0, parseInt(raw.latency_ms ?? raw.latencyMs ?? raw.latency ?? 0, 10) || 0);

  const rawStatus = String(raw.status || (raw.error || raw.error_type ? 'error' : 'success')).toLowerCase();
  const status: 'success' | 'error' = rawStatus === 'error' || rawStatus === 'failed' ? 'error' : 'success';

  const errorType =
    status === 'error'
      ? raw.error_type || raw.errorType || raw.error?.type || raw.error || 'general_error'
      : null;

  let estimatedCost = raw.estimated_cost ?? raw.estimatedCost;
  if (estimatedCost === undefined || estimatedCost === null || isNaN(estimatedCost)) {
    estimatedCost = calculateEstimatedCost(model, inputTokens, outputTokens, options?.customPricing);
  } else {
    estimatedCost = Number(Number(estimatedCost).toFixed(6));
  }

  return TelemetryRequestSchema.parse({
    request_id: requestId,
    timestamp,
    provider,
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: totalTokens,
    latency_ms: latencyMs,
    status,
    error_type: errorType,
    estimated_cost: estimatedCost,
  });
}
