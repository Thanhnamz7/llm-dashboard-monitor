import { pgTable, bigserial, text, integer, numeric, timestamp } from 'drizzle-orm/pg-core';

export const llmRequests = pgTable('llm_requests', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  requestId: text('request_id').notNull().unique(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  inputTokens: integer('input_tokens').notNull(),
  outputTokens: integer('output_tokens').notNull(),
  totalTokens: integer('total_tokens').notNull(),
  latencyMs: integer('latency_ms').notNull(),
  status: text('status').notNull(), // 'success' | 'error'
  errorType: text('error_type'),
  estimatedCost: numeric('estimated_cost').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const modelPricing = pgTable('model_pricing', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  inputPrice: numeric('input_price').notNull(),
  outputPrice: numeric('output_price').notNull(),
  currency: text('currency').default('USD').notNull(),
  effectiveFrom: timestamp('effective_from').notNull(),
  effectiveTo: timestamp('effective_to'),
});
