import React from 'react';
import { RequestRecord } from '../types';
import { Eye, ChevronLeft, ChevronRight, CheckCircle2, XCircle, ArrowUpDown } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface RequestExplorerProps {
  requests: RequestRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSelectRequest: (request: RequestRecord) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (column: string) => void;
  loading: boolean;
}

export const RequestExplorer: React.FC<RequestExplorerProps> = ({
  requests,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSelectRequest,
  sortBy,
  sortOrder,
  onSortChange,
  loading,
}) => {
  const { t } = useLanguage();

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + 
        ' ' + d.toLocaleDateString([], { month: '2-digit', day: '2-digit' });
    } catch {
      return ts;
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm backdrop-blur-sm space-y-4">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-200">
            {t.explorerTitle}
          </h2>
          <p className="text-xs text-slate-400">
            {t.totalLogged(pagination.total)}
          </p>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span>{t.showPerPage}</span>
          <select
            value={pagination.pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 focus:outline-none"
          >
            <option value="10">{t.perPage(10)}</option>
            <option value="20">{t.perPage(20)}</option>
            <option value="50">{t.perPage(50)}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-medium bg-slate-950/40">
              <th className="py-2.5 px-3">{t.colRequestId}</th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-slate-200 transition"
                onClick={() => onSortChange('timestamp')}
              >
                <div className="flex items-center space-x-1">
                  <span>{t.colTime}</span>
                  <ArrowUpDown className="h-3 w-3 opacity-60" />
                </div>
              </th>
              <th className="py-2.5 px-3">{t.colProviderModel}</th>
              <th className="py-2.5 px-3 text-right">{t.colTokens}</th>
              <th
                className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-200 transition"
                onClick={() => onSortChange('latency_ms')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>{t.colLatency}</span>
                  <ArrowUpDown className="h-3 w-3 opacity-60" />
                </div>
              </th>
              <th
                className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-200 transition"
                onClick={() => onSortChange('estimated_cost')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>{t.colCost}</span>
                  <ArrowUpDown className="h-3 w-3 opacity-60" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">{t.colStatus}</th>
              <th className="py-2.5 px-3 text-right">{t.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {loading && requests.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                  {t.loadingRequests}
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                  {t.noRequestsFound}
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr
                  key={r.request_id}
                  onClick={() => onSelectRequest(r)}
                  className="hover:bg-slate-800/40 cursor-pointer transition"
                >
                  <td className="py-2.5 px-3 text-indigo-400 font-medium max-w-[160px] truncate" title={r.request_id}>
                    {r.request_id}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                    {formatTime(r.timestamp)}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {r.provider}
                      </span>
                      <span className="text-slate-200">{r.model}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    <span className="text-slate-400">{r.input_tokens}</span> +{' '}
                    <span className="text-slate-400">{r.output_tokens}</span> ={' '}
                    <span className="text-indigo-300 font-semibold">{r.total_tokens}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={
                        r.latency_ms > 1500
                          ? 'text-amber-400 font-semibold'
                          : r.latency_ms > 2500
                          ? 'text-rose-400 font-semibold'
                          : 'text-slate-300'
                      }
                    >
                      {r.latency_ms} ms
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-400">
                    ${r.estimated_cost.toFixed(6)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {r.status === 'success' ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Success</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 font-sans" title={r.error_type || 'Error'}>
                        <XCircle className="h-3 w-3" />
                        <span>{r.error_type || 'Error'}</span>
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRequest(r);
                      }}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title={t.viewDetail}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
        <div>
          {t.pageInfo(pagination.page, pagination.totalPages || 1, pagination.total)}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>{t.btnPrev}</span>
          </button>

          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <span>{t.btnNext}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
