import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { normalizeTelemetry } from '@llmops/telemetry';
import { parseOpenCodeEvent, startOpenCodeWatcher } from '@llmops/opencode-collector';
import {
  calculateKPIs,
  calculateTimeSeries,
  calculateModelBreakdown,
  calculateErrorBreakdown,
} from '@llmops/metrics';
import { dbRepository } from '@llmops/db';
import { generateSampleDataset } from '../../../packages/db/src/seed.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Database connection on start
dbRepository.init().catch((err) => {
  console.warn('DB initialization error:', err);
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'llmops-api',
  });
});

/**
 * UC-01 / US01-US04: Telemetry Ingestion Endpoint
 * Ingests request metrics, validates schema, ensures idempotency, and persists
 */
app.post('/api/telemetry', async (req: Request, res: Response) => {
  try {
    const normalized = normalizeTelemetry(req.body);
    const result = await dbRepository.insertRequest(normalized);

    res.status(201).json({
      success: true,
      request_id: normalized.request_id,
      inserted: result.inserted,
      data: normalized,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * OpenCode Ingestion Adapter Endpoint
 */
app.post('/api/collector/opencode', async (req: Request, res: Response) => {
  try {
    const normalized = parseOpenCodeEvent(req.body);
    const result = await dbRepository.insertRequest(normalized);

    res.status(201).json({
      success: true,
      request_id: normalized.request_id,
      inserted: result.inserted,
      data: normalized,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * Helper to extract filter query params
 */
function extractFilters(req: Request) {
  return {
    timeRange: req.query.timeRange as string | undefined,
    startTime: req.query.startTime as string | undefined,
    endTime: req.query.endTime as string | undefined,
    provider: req.query.provider as string | undefined,
    model: req.query.model as string | undefined,
    status: req.query.status as string | undefined,
    search: req.query.search as string | undefined,
    page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
    pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20,
    sortBy: req.query.sortBy as any,
    sortOrder: req.query.sortOrder as any,
  };
}

/**
 * UC-02 / US11-US18, US19: Get Summary KPIs
 */
app.get('/api/metrics', async (req: Request, res: Response) => {
  try {
    const filters = extractFilters(req);
    const records = await dbRepository.getAllFilteredRecords(filters);
    const kpis = calculateKPIs(records);

    res.json({
      success: true,
      data: kpis,
      filterCount: records.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * US20-US24: Time-Series Metrics for charts
 */
app.get('/api/metrics/timeseries', async (req: Request, res: Response) => {
  try {
    const filters = extractFilters(req);
    const buckets = req.query.buckets ? parseInt(req.query.buckets as string, 10) : 24;
    const records = await dbRepository.getAllFilteredRecords(filters);
    const series = calculateTimeSeries(records, buckets);

    res.json({
      success: true,
      data: series,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Model breakdown
 */
app.get('/api/metrics/models', async (req: Request, res: Response) => {
  try {
    const filters = extractFilters(req);
    const records = await dbRepository.getAllFilteredRecords(filters);
    const breakdown = calculateModelBreakdown(records);

    res.json({
      success: true,
      data: breakdown,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Error types breakdown
 */
app.get('/api/metrics/errors', async (req: Request, res: Response) => {
  try {
    const filters = extractFilters(req);
    const records = await dbRepository.getAllFilteredRecords(filters);
    const errors = calculateErrorBreakdown(records);

    res.json({
      success: true,
      data: errors,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * UC-04 / US29: Request List with Pagination & Filters
 */
app.get('/api/requests', async (req: Request, res: Response) => {
  try {
    const filters = extractFilters(req);
    const result = await dbRepository.getRequests(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * UC-03 / US30: Request Detail by ID (TC15, TC16)
 */
app.get('/api/requests/:requestId', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const request = await dbRepository.getRequestById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: `Request '${requestId}' not found`,
      });
    }

    res.json({
      success: true,
      data: request,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * US18: Model Pricing API
 */
app.get('/api/pricing', async (req: Request, res: Response) => {
  try {
    const pricing = await dbRepository.getPricing();
    res.json({ success: true, data: pricing });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/pricing', async (req: Request, res: Response) => {
  try {
    const { provider, model, inputPrice, outputPrice, currency } = req.body;
    if (!provider || !model || inputPrice === undefined || outputPrice === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required pricing fields' });
    }
    await dbRepository.upsertPricing({
      provider,
      model,
      inputPrice: Number(inputPrice),
      outputPrice: Number(outputPrice),
      currency: currency || 'USD',
      effectiveFrom: new Date().toISOString(),
    });
    res.json({ success: true, message: 'Pricing updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Demo Seed & Simulator
 */
app.post('/api/seed', async (req: Request, res: Response) => {
  try {
    const count = parseInt((req.body?.count || req.query.count || 200) as string, 10);
    const dataset = generateSampleDataset(count);
    let inserted = 0;
    for (const item of dataset) {
      const r = await dbRepository.insertRequest(item);
      if (r.inserted) inserted++;
    }
    res.json({
      success: true,
      message: `Successfully seeded ${inserted} requests`,
      count: inserted,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/reset', async (req: Request, res: Response) => {
  try {
    await dbRepository.resetData();
    res.json({ success: true, message: 'All request telemetry data reset' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Live Simulation Endpoint (For Step 7 Demo Day)
 */
app.post('/api/simulate', async (req: Request, res: Response) => {
  try {
    const { status, errorType, model, provider, latencyMs, inputTokens, outputTokens } = req.body || {};
    const norm = normalizeTelemetry({
      provider: provider || 'opencode',
      model: model || 'opencode-code-v1',
      status: status || 'success',
      error_type: status === 'error' ? (errorType || 'timeout') : null,
      latency_ms: latencyMs || 850,
      input_tokens: inputTokens || 1200,
      output_tokens: outputTokens || 350,
    });
    await dbRepository.insertRequest(norm);
    res.status(201).json({
      success: true,
      message: 'Simulated request added successfully',
      data: norm,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 LLMOps Collector & Metrics API listening on port ${PORT}`);
  // Start listening to live OpenCode commands and database
  startOpenCodeWatcher(async (req) => {
    await dbRepository.insertRequest(req);
  });
});

export default app;
