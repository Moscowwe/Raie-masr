import React from 'react';
import type { TournamentMatch } from '../../types/tournament';
import { useLanguage } from '../../context/LanguageContext';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface SubmitResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: TournamentMatch;
  selectedWinnerId: number | null;
  isDraw: boolean;
  notes: string;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export const SubmitResultModal: React.FC<SubmitResultModalProps> = ({
  isOpen,
  onClose,
  match,
  selectedWinnerId,
  isDraw,
  notes,
  onConfirm,
  isSubmitting,
}) => {
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  const winnerTeam = selectedWinnerId === match.team_a_id ? match.teamA : match.teamB;
  const winnerName = language === 'ar' ? winnerTeam?.name_ar : winnerTeam?.name;
  const gameName = language === 'ar' ? match.game?.name_ar : match.game?.name_en;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-[#12161F] border border-slate-700/80 p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white m-0">
              {t('submit_result_title')}
            </h3>
            <p className="text-xs text-slate-400 m-0">
              {gameName} (Station {match.game?.station_number})
            </p>
          </div>
        </div>

        {/* Decision Summary */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 my-4 text-center">
          <span className="text-xs text-slate-400 uppercase tracking-widest font-bold block mb-1">
            Selected Outcome:
          </span>
          {isDraw ? (
            <span className="text-xl font-black text-yellow-400 font-mono-esports">
              🤝 {t('draw')}
            </span>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: winnerTeam?.color }}
              />
              <span className="text-xl font-black text-emerald-400 font-mono-esports">
                🏆 {winnerName} WINS
              </span>
            </div>
          )}

          {notes && (
            <p className="text-xs text-slate-400 italic mt-3 pt-2 border-t border-slate-800 m-0">
              Note: "{notes}"
            </p>
          )}
        </div>

        {/* Notice */}
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs mb-5 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="m-0 leading-relaxed">
            {t('confirm_result_desc')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            {t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? 'Submitting...' : t('confirm_button')}
          </button>
        </div>
      </div>
    </div>
  );
};
