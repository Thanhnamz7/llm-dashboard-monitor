import { DBRepository } from './index.js';
import { TelemetryRequest, calculateEstimatedCost } from '@llmops/telemetry';

const MODELS = [
  { provider: 'openai', model: 'gpt-4o', weight: 35 },
  { provider: 'openai', model: 'gpt-4o-mini', weight: 25 },
  { provider: 'anthropic', model: 'claude-3-5-sonnet', weight: 20 },
  { provider: 'google', model: 'gemini-1.5-pro', weight: 10 },
  { provider: 'opencode', model: 'opencode-code-v1', weight: 10 },
];

const ERROR_TYPES = ['timeout', 'rate_limit', 'context_length_exceeded', 'server_error', 'invalid_request'];

export function generateSampleDataset(count: number = 250): TelemetryRequest[] {
  const requests: TelemetryRequest[] = [];
  const now = Date.now();
  const timeSpanMs = 24 * 60 * 60 * 1000; // last 24 hours

  for (let i = 0; i < count; i++) {
    // Pick model based on weights
    const rand = Math.random() * 100;
    let accumulated = 0;
    let selected = MODELS[0];
    for (const m of MODELS) {
      accumulated += m.weight;
      if (rand <= accumulated) {
        selected = m;
        break;
      }
    }

    // Determine success or error (~4% error rate)
    const isError = Math.random() < 0.04;
    const status: 'success' | 'error' = isError ? 'error' : 'success';
    const errorType = isError
      ? ERROR_TYPES[Math.floor(Math.random() * ERROR_TYPES.length)]
      : null;

    // Tokens
    const inputTokens = Math.floor(Math.random() * 1500) + 120;
    const outputTokens = isError ? Math.floor(Math.random() * 30) : Math.floor(Math.random() * 800) + 40;
    const totalTokens = inputTokens + outputTokens;

    // Latency: normal distribution-like with occasional spikes
    let latencyMs = Math.floor(Math.random() * 900) + 250;
    if (Math.random() < 0.1) {
      latencyMs += Math.floor(Math.random() * 1800); // spike (for realistic P95)
    }

    const estimatedCost = calculateEstimatedCost(selected.model, inputTokens, outputTokens);
    // Timestamp spread over last 24 hours
    const reqTime = new Date(now - Math.floor(Math.random() * timeSpanMs)).toISOString();

    requests.push({
      request_id: `req_${Date.now().toString(36)}_${i.toString().padStart(4, '0')}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: reqTime,
      provider: selected.provider,
      model: selected.model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      latency_ms: latencyMs,
      status,
      error_type: errorType,
      estimated_cost: estimatedCost,
    });
  }

  // Sort by timestamp ascending
  requests.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  return requests;
}

export async function seedDatabase(count: number = 250) {
  const db = new DBRepository();
  await db.init();
  console.log(`🌱 Seeding ${count} sample LLM telemetry requests...`);
  const dataset = generateSampleDataset(count);
  let insertedCount = 0;
  for (const item of dataset) {
    const res = await db.insertRequest(item);
    if (res.inserted) insertedCount++;
  }
  console.log(`✅ Successfully seeded ${insertedCount} requests.`);
}

if (process.argv[1] && (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js'))) {
  const count = parseInt(process.argv[2] || '200', 10);
  seedDatabase(count).then(() => {
    process.exit(0);
  });
}
