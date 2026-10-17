import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TimeSeriesPoint, ModelBreakdownItem, ErrorBreakdownItem } from '../types';
import { BarChart3, TrendingUp, Layers, AlertOctagon } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface ChartsSectionProps {
  timeSeries: TimeSeriesPoint[];
  models: ModelBreakdownItem[];
  errors: ErrorBreakdownItem[];
  loading: boolean;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  timeSeries,
  models,
  errors,
  loading,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'tokens' | 'cost' | 'latency' | 'errors'>('overview');

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 shadow-xl text-xs space-y-1">
          <p className="font-semibold text-slate-300">{label}</p>
          {payload.map((item: any, idx: number) => (
            <p key={idx} style={{ color: item.color }} className="font-mono">
              {item.name}: {typeof item.value === 'number' ? (item.value % 1 !== 0 ? item.value.toFixed(4) : item.value.toLocaleString()) : item.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm backdrop-blur-sm space-y-5">
      {/* Header and Chart Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-4 w-4 text-indigo-400" />
          <h2 className="text-base font-semibold text-slate-200">{t.chartsTitle}</h2>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.tabOverview}
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'tokens'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.tabTokens}
          </button>
          <button
            onClick={() => setActiveTab('cost')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'cost'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.tabCost}
          </button>
          <button
            onClick={() => setActiveTab('latency')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'latency'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.tabLatency}
          </button>
          <button
            onClick={() => setActiveTab('errors')}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'errors'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.tabErrors}
          </button>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="h-72 w-full">
        {loading && timeSeries.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            {t.loadingCharts}
          </div>
        ) : timeSeries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
            <BarChart3 className="h-8 w-8 mb-2 opacity-50" />
            <p>{t.noChartData}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'overview' ? (
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="requests" name={t.chartTotalRequests} stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRequests)" />
                <Area type="monotone" dataKey="errorCount" name={t.chartFailedRequests} stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorErrors)" />
              </AreaChart>
            ) : activeTab === 'tokens' ? (
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorOutTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="inputTokens" name={t.chartInputTokens} stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorInTokens)" />
                <Area type="monotone" dataKey="outputTokens" name={t.chartOutputTokens} stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorOutTokens)" />
              </AreaChart>
            ) : activeTab === 'cost' ? (
              <LineChart data={timeSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="estimatedCost" name={t.chartEstimatedCost} stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 6 }} />
              </LineChart>
            ) : activeTab === 'latency' ? (
              <LineChart data={timeSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}ms`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="avgLatencyMs" name={t.chartAvgLatency} stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="p95LatencyMs" name={t.chartP95Latency} stroke="#06b6d4" strokeWidth={2.5} strokeDasharray="4 4" dot={false} />
              </LineChart>
            ) : (
              <LineChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="errorRate" name={t.chartErrorRate} stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Secondary Row: Model Breakdown & Error Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
        {/* Model Breakdown */}
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              {t.modelBreakdownTitle}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">{t.modelCount(models.length)}</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {models.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">{t.noModelData}</p>
            ) : (
              models.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/40 text-xs hover:border-slate-700 transition">
                  <div className="space-y-0.5">
                    <span className="font-medium text-slate-200 font-mono">{m.model}</span>
                    <span className="text-[10px] text-slate-500 block uppercase">{m.provider}</span>
                  </div>
                  <div className="text-right space-y-0.5 font-mono">
                    <div className="text-emerald-400 font-semibold">${m.estimatedCost.toFixed(4)}</div>
                    <div className="text-[10px] text-slate-400">{t.reqsSummary(m.requests, m.avgLatencyMs)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Error Types Breakdown */}
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/60">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
              {t.errorBreakdownTitle}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">{t.errorTypeCount(errors.length)}</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {errors.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">{t.systemHealthy}</p>
            ) : (
              errors.map((e, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/40 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                    <span className="font-mono text-slate-300">{e.errorType}</span>
                  </div>
                  <div className="flex items-center space-x-3 font-mono">
                    <span className="text-rose-400 font-medium">{e.count} {t.errorTimes}</span>
                    <span className="text-slate-500 text-[11px] w-12 text-right">({e.percentage}%)</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
