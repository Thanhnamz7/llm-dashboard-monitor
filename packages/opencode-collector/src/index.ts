import fs from 'fs';
import path from 'path';
import { normalizeTelemetry, TelemetryRequest } from '@llmops/telemetry';

export interface OpenCodeRawEvent {
  id?: string;
  session_id?: string;
  time?: any;
  time_created?: number;
  time_updated?: number;
  timestamp?: string | number | Date;
  provider?: string;
  providerID?: string;
  model?: string;
  modelID?: string;
  tokens?: {
    prompt?: number;
    completion?: number;
    total?: number;
    input?: number;
    output?: number;
  };
  prompt_tokens?: number;
  completion_tokens?: number;
  input_tokens?: number;
  output_tokens?: number;
  duration_ms?: number;
  latency_ms?: number;
  status?: string;
  finish?: string;
  error?: string | { type?: string; message?: string };
}

/**
 * OpenCode Collector Adapter
 * Maps events emitted from OpenCode / AI IDE into standard LLMOps Telemetry format
 */
export function parseOpenCodeEvent(raw: OpenCodeRawEvent): TelemetryRequest {
  const cacheRead = (raw.tokens as any)?.cache?.read || 0;
  const reasoning = (raw.tokens as any)?.reasoning || 0;

  const rawInput =
    raw.input_tokens ??
    raw.tokens?.input ??
    raw.prompt_tokens ??
    raw.tokens?.prompt ??
    0;
  const inputTokens = rawInput + (raw.input_tokens !== undefined ? 0 : cacheRead);

  const rawOutput =
    raw.output_tokens ??
    raw.tokens?.output ??
    raw.completion_tokens ??
    raw.tokens?.completion ??
    0;
  const outputTokens = rawOutput + (raw.output_tokens !== undefined ? 0 : reasoning);

  const totalTokens =
    raw.tokens?.total ??
    raw.total_tokens ??
    (inputTokens + outputTokens);

  let latencyMs = raw.latency_ms ?? raw.duration_ms ?? 0;
  if (!latencyMs && raw.time && typeof raw.time === 'object') {
    if (raw.time.created && raw.time.completed) {
      latencyMs = Math.max(0, raw.time.completed - raw.time.created);
    }
  }

  let timestamp = raw.timestamp;
  if (!timestamp) {
    if (raw.time && typeof raw.time === 'object' && raw.time.created) {
      timestamp = new Date(raw.time.created).toISOString();
    } else if (raw.time_created) {
      timestamp = new Date(raw.time_created).toISOString();
    } else if (typeof raw.time === 'number') {
      timestamp = new Date(raw.time).toISOString();
    } else {
      timestamp = new Date().toISOString();
    }
  }

  let errorType: string | null = null;
  let status: 'success' | 'error' = 'success';

  if (
    raw.status === 'error' ||
    raw.status === 'failed' ||
    raw.finish === 'error' ||
    raw.error
  ) {
    status = 'error';
    if (typeof raw.error === 'string') {
      errorType = raw.error;
    } else if (raw.error && typeof raw.error === 'object') {
      errorType = raw.error.type || raw.error.message || 'opencode_error';
    } else {
      errorType = 'opencode_error';
    }
  }

  return normalizeTelemetry({
    request_id: raw.id || raw.session_id,
    timestamp,
    provider: raw.provider || raw.providerID || 'opencode',
    model: raw.model || raw.modelID || 'opencode-code-v1',
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: totalTokens,
    latency_ms: latencyMs,
    status,
    error_type: errorType,
  });
}

/**
 * Live OpenCode Database Watcher
 * Directly watches OpenCode's local database and ingests new messages automatically!
 */
export function startOpenCodeWatcher(onNewRequest: (req: TelemetryRequest) => Promise<void>) {
  const userProfile = process.env.USERPROFILE || process.env.HOME || '';
  const opencodeDbPath = path.join(userProfile, '.local', 'share', 'opencode', 'opencode.db');

  if (!fs.existsSync(opencodeDbPath)) {
    console.log(`ℹ️ OpenCode database not found at ${opencodeDbPath}. Waiting for OpenCode...`);
    return;
  }

  console.log(`📡 OpenCode Live Collector connected to: ${opencodeDbPath}`);

  let lastCheckedTime = Date.now() - 24 * 60 * 60 * 1000; // start by checking last 24 hours
  const processedTokens = new Map<string, number>();

  const pollOpenCode = async () => {
    try {
      // Use native node:sqlite (supported in Node 22+)
      // @ts-ignore
      const { DatabaseSync } = await import('node:sqlite');
      const db = new DatabaseSync(opencodeDbPath, { open: true, readOnly: true });

      const query = `
        SELECT id, time_created, time_updated, data 
        FROM message 
        WHERE (time_created >= ? OR time_updated >= ?)
          AND json_extract(data, '$.role') = 'assistant'
        ORDER BY time_created ASC
      `;
      const stmt = db.prepare(query);
      const rows = stmt.all(lastCheckedTime, lastCheckedTime) as Array<{
        id: string;
        time_created: number;
        time_updated: number;
        data: string;
      }>;

      for (const row of rows) {
        try {
          const parsedData = JSON.parse(row.data);
          const eventPayload: OpenCodeRawEvent = {
            id: row.id,
            time_created: row.time_created,
            time_updated: row.time_updated,
            ...parsedData,
          };
          const normalized = parseOpenCodeEvent(eventPayload);

          const prevTokens = processedTokens.get(row.id);
          // Ingest if not seen, or if previous had 0 tokens and now tokens/latency are available
          if (
            prevTokens === undefined ||
            (prevTokens === 0 && normalized.total_tokens > 0) ||
            (normalized.latency_ms > 0 && prevTokens === 0)
          ) {
            processedTokens.set(row.id, normalized.total_tokens);
            await onNewRequest(normalized);
            console.log(
              `📥 [OpenCode Live] Captured request ${row.id} (${normalized.model}, in: ${normalized.input_tokens}, out: ${normalized.output_tokens}, total: ${normalized.total_tokens}, ${normalized.latency_ms}ms)`
            );
          }
        } catch (e: any) {
          console.warn(`Warning parsing opencode message ${row.id}:`, e.message);
        }

        const maxRowTime = Math.max(row.time_created || 0, row.time_updated || 0);
        if (maxRowTime > lastCheckedTime) {
          lastCheckedTime = maxRowTime - 10000; // 10s overlap window for safety
        }
      }

      db.close();
    } catch (err: any) {
      // Ignore busy locks during active OpenCode writes
      if (!err.message?.includes('busy')) {
        // quiet poll
      }
    }
  };

  // Run initial poll then check every 3 seconds
  pollOpenCode();
  setInterval(pollOpenCode, 3000);
}
