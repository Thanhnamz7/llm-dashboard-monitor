import React, { useState } from 'react';
import { RequestRecord } from '../types';
import { X, Copy, Check, AlertTriangle, CheckCircle2, Layers } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface RequestDetailModalProps {
  request: RequestRecord | null;
  onClose: () => void;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({ request, onClose }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!request) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(request, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${request.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              {request.status === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {t.modalDetailTitle}
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {request.status.toUpperCase()}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono truncate max-w-sm">
                ID: {request.request_id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Main Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block mb-1">{t.modalProvider}</span>
              <span className="font-semibold text-slate-200 uppercase">{request.provider}</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block mb-1">{t.modalModel}</span>
              <span className="font-semibold text-indigo-400 font-mono">{request.model}</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block mb-1">{t.modalLatency}</span>
              <span className="font-semibold text-amber-400 font-mono">{request.latency_ms} ms</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 block mb-1">{t.modalCost}</span>
              <span className="font-semibold text-emerald-400 font-mono">${request.estimated_cost.toFixed(6)}</span>
            </div>
          </div>

          {/* Tokens Breakdown Card */}
          <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-purple-400" />
                {t.modalTokenDistribution}
              </span>
              <span className="font-mono text-purple-300 font-bold">
                {request.total_tokens.toLocaleString()} {t.modalTotalTokens}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800/60">
              <div className="bg-slate-900/60 p-2 rounded-lg">
                <span className="text-slate-500 text-[10px] block">{t.modalInputTokens}</span>
                <span className="font-bold text-slate-200 font-mono">{request.input_tokens.toLocaleString()}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg">
                <span className="text-slate-500 text-[10px] block">{t.modalOutputTokens}</span>
                <span className="font-bold text-slate-200 font-mono">{request.output_tokens.toLocaleString()}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg">
                <span className="text-slate-500 text-[10px] block">{t.modalSumTokens}</span>
                <span className="font-bold text-indigo-400 font-mono">{request.total_tokens.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Error Message if Error */}
          {request.status === 'error' && (
            <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-4 space-y-1">
              <div className="flex items-center space-x-2 text-rose-400 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                <span>{t.modalErrorInfo}</span>
              </div>
              <p className="text-rose-200 font-mono text-xs">
                {t.modalErrorType} <span className="font-bold">{request.error_type || 'Unknown Error'}</span>
              </p>
            </div>
          )}

          {/* Timestamp and Metadata */}
          <div className="space-y-2">
            <span className="text-slate-400 font-semibold block">{t.modalTimestamp}</span>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-slate-300">
              {new Date(request.timestamp).toLocaleString()} ({request.timestamp})
            </div>
          </div>

          {/* Raw JSON viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">{t.modalRawJson}</span>
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-[11px]"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? t.modalCopied : t.modalCopyJson}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40">
              {JSON.stringify(request, null, 2)}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition"
          >
            {t.modalClose}
          </button>
        </div>
      </div>
    </div>
  );
};
