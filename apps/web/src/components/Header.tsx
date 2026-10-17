import React from 'react';
import { Activity, RefreshCw, Sparkles, Database, Trash2, Globe } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface HeaderProps {
  onRefresh: () => void;
  onSeed: () => void;
  onReset: () => void;
  onOpenSimulator: () => void;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  loading: boolean;
  online: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  onSeed,
  onReset,
  onOpenSimulator,
  autoRefresh,
  onToggleAutoRefresh,
  loading,
  online,
}) => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand & Slogan */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                {t.title}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {t.badge}
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 italic">
              {t.slogan}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Status badge */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                online ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className={online ? 'text-slate-300' : 'text-rose-400 font-medium'}>
              {online ? t.online : t.offline}
            </span>
          </div>

          {/* Language Switcher Button */}
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            title="Switch Language / Đổi ngôn ngữ"
          >
            <Globe className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-semibold">{language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}</span>
          </button>

          {/* Auto Refresh toggle */}
          <button
            onClick={onToggleAutoRefresh}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
              autoRefresh
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span>{t.autoRefresh}</span>
          </button>

          {/* Manual Refresh button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700 hover:bg-slate-700 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t.refresh}</span>
          </button>

          {/* Simulator button */}
          <button
            onClick={onOpenSimulator}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t.simulate}</span>
          </button>

          {/* Seed button */}
          <button
            onClick={onSeed}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition active:scale-95"
          >
            <Database className="h-3.5 w-3.5 text-cyan-400" />
            <span>{t.sampleData}</span>
          </button>

          {/* Reset button */}
          <button
            onClick={onReset}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 hover:text-rose-400 text-slate-400 border border-slate-700/80 transition"
            title={t.resetTooltip}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
