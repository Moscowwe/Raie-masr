import React from 'react';
import { useTournament } from '../context/TournamentContext';
import { useLanguage } from '../context/LanguageContext';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useTournament();
  const { isRtl } = useLanguage();

  if (toasts.length === 0) return null;

  return (
    <div
      className={`fixed bottom-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none ${
        isRtl ? 'left-5' : 'right-5'
      }`}
    >
      {toasts.map((toast) => {
        const getIcon = () => {
          switch (toast.type) {
            case 'success':
              return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
            case 'warning':
              return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
            case 'error':
              return <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
            default:
              return <Info className="w-5 h-5 text-cyan-400 shrink-0" />;
          }
        };

        const getBorder = () => {
          switch (toast.type) {
            case 'success':
              return 'border-emerald-500/50 bg-[#12161F]/95 shadow-emerald-500/10';
            case 'warning':
              return 'border-amber-500/50 bg-[#12161F]/95 shadow-amber-500/10';
            case 'error':
              return 'border-rose-500/50 bg-[#12161F]/95 shadow-rose-500/10';
            default:
              return 'border-cyan-500/50 bg-[#12161F]/95 shadow-cyan-500/10';
          }
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all animate-slideUp ${getBorder()}`}
          >
            {getIcon()}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white m-0 leading-tight">
                {toast.title}
              </h4>
              <p className="text-xs text-slate-300 mt-1 m-0 leading-relaxed">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
