import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { llmRequests, modelPricing } from './schema.js';
import { TelemetryRequest, DEFAULT_PRICING, calculateEstimatedCost } from '@llmops/telemetry';

export * from './schema.js';

export interface RequestFilter {
  timeRange?: string; // '1h' | '24h' | '7d' | '30d' | 'all'
  startTime?: string | Date;
  endTime?: string | Date;
  provider?: string;
  model?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'timestamp' | 'latency_ms' | 'estimated_cost' | 'total_tokens';
  sortOrder?: 'asc' | 'desc';
}

export interface ModelPricingItem {
  id?: number;
  provider: string;
  model: string;
  inputPrice: number;
  outputPrice: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

const LOCAL_DATA_DIR = path.resolve(process.cwd(), 'data');
const LOCAL_STORE_FILE = path.join(LOCAL_DATA_DIR, 'llmops_store.json');

interface LocalStore {
  requests: TelemetryRequest[];
  pricing: ModelPricingItem[];
}

export class DBRepository {
  private pool: Pool | null = null;
  private db: any = null;
  private isPostgresAvailable = false;
  private localStore: LocalStore = { requests: [], pricing: [] };

  constructor() {
    this.initLocalStore();
  }

  private initLocalStore() {
    try {
      if (!fs.existsSync(LOCAL_DATA_DIR)) {
        fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(LOCAL_STORE_FILE)) {
        const raw = fs.readFileSync(LOCAL_STORE_FILE, 'utf-8');
        this.localStore = JSON.parse(raw);
      } else {
        this.localStore = {
          requests: [],
          pricing: Object.entries(DEFAULT_PRICING).map(([model, p], idx) => ({
            id: idx + 1,
            provider: model.includes('opencode') ? 'opencode' : model.startsWith('claude') ? 'anthropic' : model.startsWith('gemini') ? 'google' : 'openai',
            model,
            inputPrice: p.inputPrice,
            outputPrice: p.outputPrice,
            currency: 'USD',
            effectiveFrom: new Date('2026-01-01').toISOString(),
            effectiveTo: null,
          })),
        };
        this.saveLocalStore();
      }
    } catch (err) {
      console.warn('⚠️ Warning initializing local store:', err);
    }
  }

  private saveLocalStore() {
    try {
      fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(this.localStore, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save local store:', err);
    }
  }

  async init(connectionString?: string) {
    const dbUrl = connectionString || process.env.DATABASE_URL;
    if (dbUrl) {
      try {
        const pool = new Pool({
          connectionString: dbUrl,
          connectionTimeoutMillis: 2000,
        });
        await pool.query('SELECT 1');
        this.pool = pool;
        this.db = drizzle(pool);
        this.isPostgresAvailable = true;
        console.log('✅ Connected to PostgreSQL database');
        await this.autoMigratePg();
      } catch (err: any) {
        console.warn(`ℹ️ PostgreSQL connection unavailable (${err.message}). Using local embedded storage.`);
        this.isPostgresAvailable = false;
      }
    } else {
      console.log('ℹ️ DATABASE_URL not set. Using local embedded storage.');
    }
  }

  private async autoMigratePg() {
    if (!this.pool) return;
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS llm_requests (
          id BIGSERIAL PRIMARY KEY,
          request_id TEXT NOT NULL UNIQUE,
          timestamp TIMESTAMPTZ NOT NULL,
          provider TEXT NOT NULL,
          model TEXT NOT NULL,
          input_tokens INTEGER NOT NULL,
          output_tokens INTEGER NOT NULL,
          total_tokens INTEGER NOT NULL,
          latency_ms INTEGER NOT NULL,
          status TEXT NOT NULL,
          error_type TEXT,
          estimated_cost NUMERIC NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS model_pricing (
          id BIGSERIAL PRIMARY KEY,
          provider TEXT NOT NULL,
          model TEXT NOT NULL,
          input_price NUMERIC NOT NULL,
          output_price NUMERIC NOT NULL,
          currency TEXT NOT NULL DEFAULT 'USD',
          effective_from TIMESTAMPTZ NOT NULL,
          effective_to TIMESTAMPTZ
        );

        CREATE INDEX IF NOT EXISTS idx_requests_timestamp ON llm_requests(timestamp);
        CREATE INDEX IF NOT EXISTS idx_requests_provider_model ON llm_requests(provider, model);
        CREATE INDEX IF NOT EXISTS idx_requests_status ON llm_requests(status);
      `);
    } catch (err) {
      console.warn('Auto migration error:', err);
    }
  }

  /**
   * Insert Telemetry Request (Idempotent - TC19 / US03)
   */
  async insertRequest(req: TelemetryRequest): Promise<{ inserted: boolean; request: TelemetryRequest }> {
    if (this.isPostgresAvailable && this.pool) {
      try {
        const res = await this.pool.query(
          `INSERT INTO llm_requests 
           (request_id, timestamp, provider, model, input_tokens, output_tokens, total_tokens, latency_ms, status, error_type, estimated_cost)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (request_id) DO NOTHING
           RETURNING *;`,
          [
            req.request_id,
            new Date(req.timestamp),
            req.provider,
            req.model,
            req.input_tokens,
            req.output_tokens,
            req.total_tokens,
            req.latency_ms,
            req.status,
            req.error_type,
            req.estimated_cost,
          ]
        );
        const inserted = (res.rowCount ?? 0) > 0;
        return { inserted, request: req };
      } catch (err) {
        console.error('Postgres insert error, saving to local fallback:', err);
      }
    }

    // Local embedded store fallback
    const exists = this.localStore.requests.some((r) => r.request_id === req.request_id);
    if (exists) {
      return { inserted: false, request: req };
    }

    this.localStore.requests.push(req);
    this.saveLocalStore();
    return { inserted: true, request: req };
  }

  /**
   * Filter and retrieve requests
   */
  async getRequests(filters: RequestFilter = {}) {
    const all = await this.getAllFilteredRecords(filters);

    const sortBy = filters.sortBy || 'timestamp';
    const sortOrder = filters.sortOrder || 'desc';

    all.sort((a, b) => {
      let valA: any = a[sortBy as keyof TelemetryRequest];
      let valB: any = b[sortBy as keyof TelemetryRequest];

      if (sortBy === 'timestamp') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (sortOrder === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });

    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.max(1, Math.min(100, filters.pageSize || 20));
    const total = all.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIdx = (page - 1) * pageSize;
    const paginated = all.slice(startIdx, startIdx + pageSize);

    return {
      data: paginated,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get single request detail by request_id
   */
  async getRequestById(requestId: string): Promise<TelemetryRequest | null> {
    if (this.isPostgresAvailable && this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT request_id, timestamp, provider, model, input_tokens, output_tokens, total_tokens, latency_ms, status, error_type, estimated_cost
           FROM llm_requests WHERE request_id = $1 LIMIT 1`,
          [requestId]
        );
        if (res.rows.length > 0) {
          const row = res.rows[0];
          return {
            request_id: row.request_id,
            timestamp: new Date(row.timestamp).toISOString(),
            provider: row.provider,
            model: row.model,
            input_tokens: Number(row.input_tokens),
            output_tokens: Number(row.output_tokens),
            total_tokens: Number(row.total_tokens),
            latency_ms: Number(row.latency_ms),
            status: row.status,
            error_type: row.error_type,
            estimated_cost: Number(row.estimated_cost),
          };
        }
      } catch (err) {
        console.error('Postgres getRequestById error:', err);
      }
    }

    const found = this.localStore.requests.find((r) => r.request_id === requestId);
    return found || null;
  }

  /**
   * Get all filtered records (for calculating KPI and Time-series)
   */
  async getAllFilteredRecords(filters: RequestFilter = {}): Promise<TelemetryRequest[]> {
    let records: TelemetryRequest[] = [];

    if (this.isPostgresAvailable && this.pool) {
      try {
        const res = await this.pool.query(
          `SELECT request_id, timestamp, provider, model, input_tokens, output_tokens, total_tokens, latency_ms, status, error_type, estimated_cost
           FROM llm_requests ORDER BY timestamp DESC`
        );
        records = res.rows.map((row: any) => ({
          request_id: row.request_id,
          timestamp: new Date(row.timestamp).toISOString(),
          provider: row.provider,
          model: row.model,
          input_tokens: Number(row.input_tokens),
          output_tokens: Number(row.output_tokens),
          total_tokens: Number(row.total_tokens),
          latency_ms: Number(row.latency_ms),
          status: row.status,
          error_type: row.error_type,
          estimated_cost: Number(row.estimated_cost),
        }));
      } catch (err) {
        console.error('Postgres getAllFilteredRecords error, falling back to local store:', err);
        records = [...this.localStore.requests];
      }
    } else {
      records = [...this.localStore.requests];
    }

    // Filter by time
    let minTime: number | null = null;
    let maxTime: number | null = null;

    const now = Date.now();
    if (filters.timeRange === '1h') {
      minTime = now - 60 * 60 * 1000;
    } else if (filters.timeRange === '24h') {
      minTime = now - 24 * 60 * 60 * 1000;
    } else if (filters.timeRange === '7d') {
      minTime = now - 7 * 24 * 60 * 60 * 1000;
    } else if (filters.timeRange === '30d') {
      minTime = now - 30 * 24 * 60 * 60 * 1000;
    }

    if (filters.startTime) {
      minTime = new Date(filters.startTime).getTime();
    }
    if (filters.endTime) {
      maxTime = new Date(filters.endTime).getTime();
    }

    return records.filter((r) => {
      const t = new Date(r.timestamp).getTime();
      if (minTime !== null && t < minTime) return false;
      if (maxTime !== null && t > maxTime) return false;

      if (filters.provider && filters.provider !== 'all') {
        if (r.provider.toLowerCase() !== filters.provider.toLowerCase()) return false;
      }

      if (filters.model && filters.model !== 'all') {
        if (r.model.toLowerCase() !== filters.model.toLowerCase()) return false;
      }

      if (filters.status && filters.status !== 'all') {
        if (r.status.toLowerCase() !== filters.status.toLowerCase()) return false;
      }

      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matches =
          r.request_id.toLowerCase().includes(q) ||
          r.model.toLowerCase().includes(q) ||
          r.provider.toLowerCase().includes(q) ||
          (r.error_type && r.error_type.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }

  /**
   * Pricing methods
   */
  async getPricing(): Promise<ModelPricingItem[]> {
    return this.localStore.pricing;
  }

  async upsertPricing(item: ModelPricingItem) {
    const idx = this.localStore.pricing.findIndex(
      (p) => p.model === item.model && p.provider === item.provider
    );
    if (idx >= 0) {
      this.localStore.pricing[idx] = { ...this.localStore.pricing[idx], ...item };
    } else {
      this.localStore.pricing.push({
        ...item,
        id: this.localStore.pricing.length + 1,
      });
    }
    this.saveLocalStore();
  }

  /**
   * Reset all request records
   */
  async resetData() {
    if (this.isPostgresAvailable && this.pool) {
      try {
        await this.pool.query('TRUNCATE TABLE llm_requests RESTART IDENTITY');
      } catch (err) {
        console.error('Postgres truncate error:', err);
      }
    }
    this.localStore.requests = [];
    this.saveLocalStore();
  }
}

export const dbRepository = new DBRepository();
