import React, { useState } from 'react';
import { X, Sparkles, CheckCircle, Send, FastForward } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulate: (data: any) => Promise<void>;
  onBatchSimulate: (count: number) => Promise<void>;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({
  isOpen,
  onClose,
  onSimulate,
  onBatchSimulate,
}) => {
  const { t } = useLanguage();
  const [provider, setProvider] = useState('opencode');
  const [model, setModel] = useState('opencode-code-v1');
  const [status, setStatus] = useState<'success' | 'error'>('success');
  const [errorType, setErrorType] = useState('rate_limit');
  const [latencyMs, setLatencyMs] = useState(650);
  const [inputTokens, setInputTokens] = useState(850);
  const [outputTokens, setOutputTokens] = useState(240);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    try {
      await onSimulate({
        provider,
        model,
        status,
        errorType: status === 'error' ? errorType : null,
        latencyMs: Number(latencyMs),
        inputTokens: Number(inputTokens),
        outputTokens: Number(outputTokens),
      });
      setSuccessMsg(t.simSuccess(status === 'error' ? `${t.simErrorType}: ${errorType}` : 'Success'));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickError = async (type: string) => {
    setLoading(true);
    try {
      await onSimulate({
        provider: 'openai',
        model: 'gpt-4o',
        status: 'error',
        errorType: type,
        latencyMs: type === 'timeout' ? 30000 : 800,
        inputTokens: 1200,
        outputTokens: 0,
      });
      setSuccessMsg(t.simQuickSuccess(type));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{t.simTitle}</h3>
              <p className="text-xs text-slate-400">{t.simSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Demo Shortcuts */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-300 block">
              {t.simQuickDemos}
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickError('timeout')}
                className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium"
              >
                {t.simInjectTimeout}
              </button>
              <button
                type="button"
                onClick={() => handleQuickError('rate_limit')}
                className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium"
              >
                {t.simInjectRateLimit}
              </button>
              <button
                type="button"
                onClick={() => handleQuickError('context_length_exceeded')}
                className="px-2.5 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 font-medium"
              >
                {t.simInjectContext}
              </button>
            </div>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">{t.simProvider}</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              >
                <option value="opencode">OpenCode</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">{t.simModel}</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              >
                <option value="opencode-code-v1">opencode-code-v1</option>
                <option value="gpt-4o">gpt-4o</option>
                <option value="gpt-4o-mini">gpt-4o-mini</option>
                <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
                <option value="gemini-1.5-pro">gemini-1.5-pro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">{t.simStatus}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-semibold"
              >
                <option value="success">{t.statusSuccess}</option>
                <option value="error">{t.statusError}</option>
              </select>
            </div>

            {status === 'error' ? (
              <div>
                <label className="text-rose-400 block mb-1">{t.simErrorType}</label>
                <select
                  value={errorType}
                  onChange={(e) => setErrorType(e.target.value)}
                  className="w-full bg-slate-950 border border-rose-500/40 rounded-lg p-2 text-rose-300 font-mono"
                >
                  <option value="timeout">timeout</option>
                  <option value="rate_limit">rate_limit</option>
                  <option value="context_length_exceeded">context_length_exceeded</option>
                  <option value="server_error">server_error</option>
                  <option value="invalid_prompt">invalid_prompt</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="text-slate-400 block mb-1">{t.simLatency}</label>
                <input
                  type="number"
                  value={latencyMs}
                  onChange={(e) => setLatencyMs(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">{t.simInputTokens}</label>
              <input
                type="number"
                value={inputTokens}
                onChange={(e) => setInputTokens(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">{t.simOutputTokens}</label>
              <input
                type="number"
                value={outputTokens}
                onChange={(e) => setOutputTokens(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onBatchSimulate(50)}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center space-x-1.5"
            >
              <FastForward className="h-3.5 w-3.5 text-cyan-400" />
              <span>{t.simBatchBtn}</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{t.simSubmitBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
