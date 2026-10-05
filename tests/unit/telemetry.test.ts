import { describe, it, expect } from 'vitest';
import { normalizeTelemetry, calculateEstimatedCost, DEFAULT_PRICING } from '../../packages/telemetry/src/index';

describe('Telemetry & Collector Unit Tests', () => {
  // TC01: Collector nhận request hợp lệ
  it('TC01: Valid request is successfully normalized', () => {
    const raw = {
      request_id: 'req_test_001',
      timestamp: '2026-10-05T10:00:00Z',
      provider: 'openai',
      model: 'gpt-4o',
      input_tokens: 1000,
      output_tokens: 500,
      latency_ms: 820,
      status: 'success',
    };
    const norm = normalizeTelemetry(raw);
    expect(norm.request_id).toBe('req_test_001');
    expect(norm.provider).toBe('openai');
    expect(norm.model).toBe('gpt-4o');
    expect(norm.status).toBe('success');
  });

  // TC02: Thiếu request_id -> Tự động sinh request_id hợp lệ
  it('TC02: Auto generates unique request_id if missing', () => {
    const raw = {
      timestamp: '2026-10-05T10:00:00Z',
      provider: 'openai',
      model: 'gpt-4o',
      input_tokens: 100,
      output_tokens: 50,
      latency_ms: 300,
      status: 'success',
    };
    const norm = normalizeTelemetry(raw);
    expect(norm.request_id).toBeDefined();
    expect(norm.request_id.length).toBeGreaterThan(5);
  });

  // TC03 & TC08: Input = 1000, Output = 500 -> Total = 1500
  it('TC03 & TC08: Total tokens equals input_tokens + output_tokens', () => {
    const raw = {
      request_id: 'req_003',
      provider: 'openai',
      model: 'gpt-4o',
      input_tokens: 1000,
      output_tokens: 500,
      latency_ms: 450,
      status: 'success',
    };
    const norm = normalizeTelemetry(raw);
    expect(norm.total_tokens).toBe(1500);
  });

  // TC04: Request success -> status = 'success'
  it('TC04: Status remains success for normal requests', () => {
    const raw = {
      request_id: 'req_004',
      provider: 'opencode',
      model: 'opencode-code-v1',
      input_tokens: 200,
      output_tokens: 100,
      latency_ms: 400,
      status: 'success',
    };
    const norm = normalizeTelemetry(raw);
    expect(norm.status).toBe('success');
    expect(norm.error_type).toBeNull();
  });

  // TC05: Request error -> status = 'error' and preserves error_type
  it('TC05: Status set to error with error_type captured', () => {
    const raw = {
      request_id: 'req_005',
      provider: 'opencode',
      model: 'opencode-code-v1',
      input_tokens: 200,
      output_tokens: 0,
      latency_ms: 1200,
      status: 'error',
      error_type: 'timeout',
    };
    const norm = normalizeTelemetry(raw);
    expect(norm.status).toBe('error');
    expect(norm.error_type).toBe('timeout');
  });

  // TC06: Latency recorded correctly
  it('TC06: Latency 800 ms is preserved accurately', () => {
    const raw = {
      request_id: 'req_006',
      provider: 'opencode',
      model: 'opencode-code-v1',
      input_tokens: 150,
      output_tokens: 50,
      latency_ms: 800,
      status: 'success',
    };
    const norm = normalizeTelemetry(raw);
    expect(norm.latency_ms).toBe(800);
  });

  // TC09: Cost calculation matches pricing model
  it('TC09: Estimated cost formula calculation', () => {
    const pricing = DEFAULT_PRICING['gpt-4o'];
    const inputTokens = 1000;
    const outputTokens = 500;
    const expectedCost = inputTokens * pricing.inputPrice + outputTokens * pricing.outputPrice;
    const calculated = calculateEstimatedCost('gpt-4o', inputTokens, outputTokens);
    expect(calculated).toBeCloseTo(expectedCost, 5);
  });
});
