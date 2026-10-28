import http from 'http';
import { normalizeTelemetry } from '../../packages/telemetry/src/index';
import { calculateKPIs, evaluateBudgetAlert, BudgetConfig } from '../../packages/metrics/src/index';

const inMemoryRequests: any[] = [];

// Cấu hình hạn mức mặc định (Có thể tùy chỉnh qua API hoặc giao diện)
let currentBudgetConfig: BudgetConfig = {
  maxCostLimit: 10.0,       // Giới hạn ngân sách $10 USD
  maxTokenLimit: 1000000,   // Giới hạn 1 triệu Tokens
  warnAtPercentage: 80,     // Cảnh báo vàng khi chạm 80%
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Collector endpoint: POST /api/telemetry (Nhận telemetry từ app AI)
  if (req.method === 'POST' && req.url === '/api/telemetry') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const raw = JSON.parse(body);
        const normalized = normalizeTelemetry(raw);
        inMemoryRequests.push(normalized);

        // Tính toán lại metrics và kiểm tra hạn mức ngay lập tức
        const kpis = calculateKPIs(inMemoryRequests);
        const alertStatus = evaluateBudgetAlert(kpis.estimatedCost, kpis.totalTokens, currentBudgetConfig);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          request_id: normalized.request_id,
          alerts: alertStatus.alertMessages,
          budget_status: alertStatus.costStatus,
        }));
      } catch (err: any) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 2. Query endpoint: GET /api/requests (Lấy lịch sử request)
  if (req.method === 'GET' && req.url?.startsWith('/api/requests')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: inMemoryRequests }));
    return;
  }

  // 3. KPI & Budget Alert endpoint: GET /api/metrics (Lấy KPI & Trạng thái cảnh báo hạn mức)
  if (req.method === 'GET' && req.url === '/api/metrics') {
    const kpis = calculateKPIs(inMemoryRequests);
    const alertStatus = evaluateBudgetAlert(kpis.estimatedCost, kpis.totalTokens, currentBudgetConfig);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      metrics: kpis,
      budgetConfig: currentBudgetConfig,
      alertStatus: alertStatus,
    }));
    return;
  }

  // 4. Update Budget Config endpoint: POST /api/budget/config (Thiết lập ngân sách và ngưỡng token)
  if (req.method === 'POST' && req.url === '/api/budget/config') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        if (payload.maxCostLimit !== undefined) currentBudgetConfig.maxCostLimit = Number(payload.maxCostLimit);
        if (payload.maxTokenLimit !== undefined) currentBudgetConfig.maxTokenLimit = Number(payload.maxTokenLimit);
        if (payload.warnAtPercentage !== undefined) currentBudgetConfig.warnAtPercentage = Number(payload.warnAtPercentage);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Cập nhật cấu hình hạn mức thành công!',
          config: currentBudgetConfig,
        }));
      } catch (err: any) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Not found' }));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Collector & Metrics API running on http://localhost:${PORT}`);
  console.log(`🛡️ Budget & Quota Alert Service is ACTIVE!`);
});
