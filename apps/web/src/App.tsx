import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { KPICards } from './components/KPICards';
import { FilterBar } from './components/FilterBar';
import { ChartsSection } from './components/ChartsSection';
import { RequestExplorer } from './components/RequestExplorer';
import { RequestDetailModal } from './components/RequestDetailModal';
import { SimulatorModal } from './components/SimulatorModal';
import { useLanguage } from './i18n/LanguageContext';
import {
  KPIData,
  TimeSeriesPoint,
  ModelBreakdownItem,
  ErrorBreakdownItem,
  RequestRecord,
  FilterState,
} from './types';

export function App() {
  const { t } = useLanguage();
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [models, setModels] = useState<ModelBreakdownItem[]>([]);
  const [errors, setErrors] = useState<ErrorBreakdownItem[]>([]);
  const [requests, setRequests] = useState<RequestRecord[]>([]);

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });

  const [filters, setFilters] = useState<FilterState>({
    timeRange: '24h',
    provider: 'all',
    model: 'all',
    status: 'all',
    search: '',
  });

  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [selectedRequest, setSelectedRequest] = useState<RequestRecord | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(true);

  // Build query string from filters & pagination
  const buildQuery = useCallback(
    (includePagination = true) => {
      const params = new URLSearchParams();
      if (filters.timeRange) params.append('timeRange', filters.timeRange);
      if (filters.provider && filters.provider !== 'all') params.append('provider', filters.provider);
      if (filters.model && filters.model !== 'all') params.append('model', filters.model);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      if (includePagination) {
        params.append('page', String(pagination.page));
        params.append('pageSize', String(pagination.pageSize));
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
      }
      return params.toString();
    },
    [filters, pagination.page, pagination.pageSize, sortBy, sortOrder]
  );

  // Fetch all dashboard data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const queryWithoutPage = buildQuery(false);
      const queryWithPage = buildQuery(true);

      const [kpiRes, tsRes, modRes, errRes, reqRes] = await Promise.all([
        fetch(`/api/metrics?${queryWithoutPage}`),
        fetch(`/api/metrics/timeseries?${queryWithoutPage}`),
        fetch(`/api/metrics/models?${queryWithoutPage}`),
        fetch(`/api/metrics/errors?${queryWithoutPage}`),
        fetch(`/api/requests?${queryWithPage}`),
      ]);

      if (kpiRes.ok && reqRes.ok) {
        const kpiData = await kpiRes.json();
        const tsData = await tsRes.json();
        const modData = await modRes.json();
        const errData = await errRes.json();
        const reqData = await reqRes.json();

        setKpis(kpiData.data);
        setTimeSeries(tsData.data || []);
        setModels(modData.data || []);
        setErrors(errData.data || []);
        setRequests(reqData.data || []);
        if (reqData.pagination) {
          setPagination(reqData.pagination);
        }
        setOnline(true);
      } else {
        setOnline(false);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setOnline(false);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  // Initial fetch and auto-seeding if empty
  useEffect(() => {
    fetchData().then(() => {
      fetch('/api/metrics')
        .then((r) => r.json())
        .then((res) => {
          if (res.data && res.data.totalRequests === 0) {
            handleSeed();
          }
        })
        .catch(() => {});
    });
  }, []);

  // Filter or pagination change
  useEffect(() => {
    fetchData();
  }, [filters, pagination.page, pagination.pageSize, sortBy, sortOrder]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData();
    }, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const handleSortChange = (col: string) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  const handleSeed = async () => {
    try {
      setLoading(true);
      await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 180 }),
      });
      await fetchData();
    } catch (err) {
      console.error('Seed error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm(t.confirmReset)) {
      try {
        setLoading(true);
        await fetch('/api/reset', { method: 'POST' });
        await fetchData();
      } catch (err) {
        console.error('Reset error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSimulate = async (data: any) => {
    const res = await fetch('/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Simulate request failed');
    await fetchData();
  };

  const handleBatchSimulate = async (count: number) => {
    await fetch('/api/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count }),
    });
    await fetchData();
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onRefresh={fetchData}
        onSeed={handleSeed}
        onReset={handleReset}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
        loading={loading}
        online={online}
      />

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Cards (6 MVP KPIs) */}
        <KPICards kpis={kpis} loading={loading} />

        {/* Filters */}
        <FilterBar
          filters={filters}
          onChange={(newFilters) => {
            setFilters(newFilters);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          onResetFilters={() => {
            setFilters({
              timeRange: '24h',
              provider: 'all',
              model: 'all',
              status: 'all',
              search: '',
            });
            setPagination((p) => ({ ...p, page: 1 }));
          }}
        />

        {/* Interactive Charts Section */}
        <ChartsSection
          timeSeries={timeSeries}
          models={models}
          errors={errors}
          loading={loading}
        />

        {/* Request Explorer & History Table */}
        <RequestExplorer
          requests={requests}
          pagination={pagination}
          onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
          onPageSizeChange={(pageSize) => setPagination((p) => ({ ...p, pageSize, page: 1 }))}
          onSelectRequest={(req) => setSelectedRequest(req)}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          loading={loading}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            {t.footerTitle}
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>{t.footerDataSource}</span>
            <span>{t.footerStatus}</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <RequestDetailModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />

      <SimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSimulate={handleSimulate}
        onBatchSimulate={handleBatchSimulate}
      />
    </div>
  );
}

export default App;
