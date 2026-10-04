import { z } from 'zod';

export const TelemetryRequestSchema = z.object({
  request_id: z.string().min(1),
  timestamp: z.string().datetime().or(z.date()),
  provider: z.string().min(1),
  model: z.string().min(1),
  input_tokens: z.number().int().nonnegative(),
  output_tokens: z.number().int().nonnegative(),
  total_tokens: z.number().int().nonnegative().optional(),
  latency_ms: z.number().int().nonnegative(),
  status: z.enum(['success', 'error']),
  error_type: z.string().nullable().optional(),
  estimated_cost: z.number().nonnegative().optional(),
});

export type TelemetryRequest = z.infer<typeof TelemetryRequestSchema>;

export function normalizeTelemetry(raw: any): TelemetryRequest {
  const totalTokens = raw.total_tokens ?? (raw.input_tokens + raw.output_tokens);
  return TelemetryRequestSchema.parse({
    ...raw,
    total_tokens: totalTokens,
  });
}
