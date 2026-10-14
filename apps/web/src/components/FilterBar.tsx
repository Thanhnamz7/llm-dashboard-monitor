import React from 'react';
import { FilterState } from '../types';
import { Calendar, Cpu, Layers, CheckCircle2, Search, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  onResetFilters,
}) => {
  const { t } = useLanguage();

  const updateFilter = (key: keyof FilterState, value: string) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const hasActiveFilters =
    filters.timeRange !== '24h' ||
    filters.provider !== 'all' ||
    filters.model !== 'all' ||
    filters.status !== 'all' ||
    filters.search !== '';

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Filters Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range Filter (US25) */}
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium mr-1">{t.filterTimeLabel}</span>
            <select
              value={filters.timeRange}
              onChange={(e) => updateFilter('timeRange', e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
            >
              <option value="1h" className="bg-slate-900">{t.time1h}</option>
              <option value="24h" className="bg-slate-900">{t.time24h}</option>
              <option value="7d" className="bg-slate-900">{t.time7d}</option>
              <option value="30d" className="bg-slate-900">{t.time30d}</option>
              <option value="all" className="bg-slate-900">{t.timeAll}</option>
            </select>
          </div>

          {/* Provider Filter (US26) */}
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium mr-1">{t.filterProviderLabel}</span>
            <select
              value={filters.provider}
              onChange={(e) => updateFilter('provider', e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
            >
              <option value="all" className="bg-slate-900">{t.allProviders}</option>
              <option value="opencode" className="bg-slate-900">OpenCode</option>
              <option value="openai" className="bg-slate-900">OpenAI</option>
              <option value="anthropic" className="bg-slate-900">Anthropic</option>
              <option value="google" className="bg-slate-900">Google</option>
            </select>
          </div>

          {/* Model Filter (US27) */}
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
            <Cpu className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium mr-1">{t.filterModelLabel}</span>
            <select
              value={filters.model}
              onChange={(e) => updateFilter('model', e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
            >
              <option value="all" className="bg-slate-900">{t.allModels}</option>
              <option value="opencode-code-v1" className="bg-slate-900">opencode-code-v1</option>
              <option value="gpt-4o" className="bg-slate-900">gpt-4o</option>
              <option value="gpt-4o-mini" className="bg-slate-900">gpt-4o-mini</option>
              <option value="claude-3-5-sonnet" className="bg-slate-900">claude-3-5-sonnet</option>
              <option value="gemini-1.5-pro" className="bg-slate-900">gemini-1.5-pro</option>
              <option value="deepseek-coder" className="bg-slate-900">deepseek-coder</option>
            </select>
          </div>

          {/* Status Filter (US28) */}
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium mr-1">{t.filterStatusLabel}</span>
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
            >
              <option value="all" className="bg-slate-900">{t.allStatuses}</option>
              <option value="success" className="bg-slate-900">{t.statusSuccess}</option>
              <option value="error" className="bg-slate-900">{t.statusError}</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 px-2 py-1.5 rounded-lg hover:bg-rose-500/10 transition"
              title={t.clearFilters}
            >
              <X className="h-3.5 w-3.5" />
              <span>{t.clearFilters}</span>
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
