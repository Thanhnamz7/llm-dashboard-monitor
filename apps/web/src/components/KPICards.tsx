import React from 'react';
import { KPIData } from '../types';
import { Activity, Coins, Clock, AlertTriangle, Layers, Zap } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface KPICardsProps {
  kpis: KPIData | null;
  loading: boolean;
}

export const KPICards: React.FC<KPICardsProps> = ({ kpis, loading }) => {
  const { t } = useLanguage();

  const formatTokens = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  const cards = [
    {
      title: t.kpiTotalRequests,
      value: kpis ? kpis.totalRequests.toLocaleString() : '0',
      subtitle: kpis
        ? t.kpiTotalRequestsSub(kpis.successRequests, kpis.failedRequests)
        : t.noRequests,
      icon: Activity,
      color: 'from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/20',
      tag: 'MVP KPI 1',
    },
    {
      title: t.kpiTotalTokens,
      value: kpis ? formatTokens(kpis.totalTokens) : '0',
      subtitle: kpis
        ? t.kpiTotalTokensSub(formatTokens(kpis.inputTokens), formatTokens(kpis.outputTokens))
        : t.zeroTokens,
      icon: Layers,
      color: 'from-purple-500/20 to-fuchsia-500/10 text-purple-400 border-purple-500/20',
      tag: 'MVP KPI 2',
    },
    {
      title: t.kpiEstimatedCost,
      value: kpis ? `$${kpis.estimatedCost.toFixed(4)}` : '$0.0000',
      subtitle: t.kpiEstimatedCostSub,
      icon: Coins,
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/20',
      tag: t.kpiEstimatedCostTag,
    },
    {
      title: t.kpiAvgLatency,
      value: kpis ? `${kpis.avgLatencyMs} ms` : '0 ms',
      subtitle: t.kpiAvgLatencySub,
      icon: Clock,
      color: 'from-amber-500/20 to-yellow-500/10 text-amber-400 border-amber-500/20',
      tag: 'MVP KPI 4',
    },
    {
      title: t.kpiP95Latency,
      value: kpis ? `${kpis.p95LatencyMs} ms` : '0 ms',
      subtitle: kpis ? t.kpiP95LatencySub(kpis.p50LatencyMs, kpis.p99LatencyMs) : 'P50 / P95 / P99',
      icon: Zap,
      color: 'from-cyan-500/20 to-sky-500/10 text-cyan-400 border-cyan-500/20',
      tag: 'Percentile P95',
    },
    {
      title: t.kpiErrorRate,
      value: kpis ? `${kpis.errorRate}%` : '0%',
      subtitle: kpis
        ? t.kpiErrorRateSub(kpis.failedRequests, kpis.totalRequests)
        : t.zeroErrors,
      icon: AlertTriangle,
      color:
        (kpis?.errorRate || 0) > 5
          ? 'from-rose-500/20 to-red-500/10 text-rose-400 border-rose-500/30'
          : 'from-slate-500/20 to-slate-700/10 text-slate-400 border-slate-700/50',
      tag: 'KPI 6',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`relative rounded-xl border bg-gradient-to-b ${card.color} p-4 backdrop-blur-sm shadow-sm transition hover:shadow-md hover:border-slate-600/60`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">{card.title}</span>
              <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-700/40">
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="my-1">
              {loading && !kpis ? (
                <div className="h-8 w-24 bg-slate-800 animate-pulse rounded"></div>
              ) : (
                <div className="text-2xl font-bold tracking-tight text-white font-mono">
                  {card.value}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
              <span className="truncate pr-1">{card.subtitle}</span>
              <span className="shrink-0 px-1.5 py-0.5 rounded bg-slate-900/80 text-[10px] font-medium border border-slate-700/50">
                {card.tag}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
