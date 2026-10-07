import { describe, it, expect, beforeEach } from 'vitest';
import { DBRepository } from '../../packages/db/src/index';
import { normalizeTelemetry } from '../../packages/telemetry/src/index';

describe('Database & Repository Integration Tests', () => {
  let db: DBRepository;

  beforeEach(async () => {
    db = new DBRepository();
    await db.resetData();
  });

  // TC19: Request duplicate (Idempotent check)
  it('TC19: Duplicate request_id is not inserted twice', async () => {
    const req = normalizeTelemetry({
      request_id: 'req_unique_001',
      provider: 'opencode',
      model: 'opencode-code-v1',
      input_tokens: 100,
      output_tokens: 50,
      latency_ms: 300,
      status: 'success',
    });

    const res1 = await db.insertRequest(req);
    expect(res1.inserted).toBe(true);

    const res2 = await db.insertRequest(req);
    expect(res2.inserted).toBe(false);

    const all = await db.getAllFilteredRecords();
    expect(all.length).toBe(1);
  });

  // TC13: Filter theo model
  it('TC13: Filters correctly by model', async () => {
    await db.insertRequest(normalizeTelemetry({
      request_id: 'req_model_1',
      provider: 'openai',
      model: 'gpt-4o',
      input_tokens: 100,
      output_tokens: 50,
      latency_ms: 400,
      status: 'success',
    }));
    await db.insertRequest(normalizeTelemetry({
      request_id: 'req_model_2',
      provider: 'anthropic',
      model: 'claude-3-5-sonnet',
      input_tokens: 200,
      output_tokens: 100,
      latency_ms: 500,
      status: 'success',
    }));

    const result = await db.getAllFilteredRecords({ model: 'gpt-4o' });
    expect(result.length).toBe(1);
    expect(result[0].model).toBe('gpt-4o');
  });

  // TC14: Filter theo status = error
  it('TC14: Filters correctly by status = error', async () => {
    await db.insertRequest(normalizeTelemetry({
      request_id: 'req_ok',
      provider: 'opencode',
      model: 'opencode-code-v1',
      input_tokens: 100,
      output_tokens: 50,
      latency_ms: 400,
      status: 'success',
    }));
    await db.insertRequest(normalizeTelemetry({
      request_id: 'req_err',
      provider: 'opencode',
      model: 'opencode-code-v1',
      input_tokens: 100,
      output_tokens: 0,
      latency_ms: 1200,
      status: 'error',
      error_type: 'timeout',
    }));

    const result = await db.getAllFilteredRecords({ status: 'error' });
    expect(result.length).toBe(1);
    expect(result[0].status).toBe('error');
    expect(result[0].error_type).toBe('timeout');
  });

  // TC15 & TC16: Request detail lookup
  it('TC15 & TC16: Retrieve request detail by ID and return null when not found', async () => {
    await db.insertRequest(normalizeTelemetry({
      request_id: 'req_detail_target',
      provider: 'opencode',
      model: 'opencode-code-v1',
      input_tokens: 500,
      output_tokens: 200,
      latency_ms: 600,
      status: 'success',
    }));

    const found = await db.getRequestById('req_detail_target');
    expect(found).not.toBeNull();
    expect(found?.request_id).toBe('req_detail_target');

    const notFound = await db.getRequestById('non_existent_id');
    expect(notFound).toBeNull();
  });
});
