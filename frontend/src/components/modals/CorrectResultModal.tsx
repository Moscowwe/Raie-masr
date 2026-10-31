import React, { useState } from 'react';
import type { TournamentMatch } from '../../types/tournament';
import { useLanguage } from '../../context/LanguageContext';
import { Edit3, X, Check } from 'lucide-react';

interface CorrectResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: TournamentMatch;
  onConfirm: (winnerTeamId: number | null, isDraw: boolean, reason: string, notes?: string) => Promise<boolean>;
}

export const CorrectResultModal: React.FC<CorrectResultModalProps> = ({
  isOpen,
  onClose,
  match,
  onConfirm,
}) => {
  const { t, language } = useLanguage();

  const [selectedWinnerId, setSelectedWinnerId] = useState<number | null>(
    match.result?.winner_team_id ?? null
  );
  const [isDraw, setIsDraw] = useState<boolean>(match.result?.is_draw ?? false);
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>(match.result?.operator_notes ?? '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const gameName = language === 'ar' ? match.game?.name_ar : match.game?.name_en;
  const teamAName = language === 'ar' ? match.teamA?.name_ar : match.teamA?.name;
  const teamBName = language === 'ar' ? match.teamB?.name_ar : match.teamB?.name;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError(t('correction_reason'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const success = await onConfirm(selectedWinnerId, isDraw, reason.trim(), notes.trim() || undefined);
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#12161F] border border-cyan-500/30 p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Edit3 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white m-0">
              {t('correct_modal_title')}
            </h3>
            <p className="text-xs text-slate-400 m-0">
              {gameName} (Station {match.game?.station_number}) • Round {match.round?.round_number}
            </p>
          </div>
        </div>

        {/* Selection Options */}
        <div className="my-5 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
            Select Corrected Outcome:
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {/* Team A */}
            <button
              type="button"
              onClick={() => {
                setSelectedWinnerId(match.team_a_id);
                setIsDraw(false);
              }}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                !isDraw && selectedWinnerId === match.team_a_id
                  ? 'bg-blue-600/25 border-blue-500 text-white shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-xs font-bold line-clamp-1">{teamAName}</span>
              <span className="text-[10px] font-black uppercase text-cyan-400 mt-1">WINS</span>
            </button>

            {/* Draw */}
            <button
              type="button"
              onClick={() => {
                setSelectedWinnerId(null);
                setIsDraw(true);
              }}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                isDraw
                  ? 'bg-yellow-500/25 border-yellow-500 text-yellow-300 shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-xs font-bold">{t('draw')}</span>
              <span className="text-[10px] font-black uppercase text-yellow-400 mt-1">0 - 0 PTS</span>
            </button>

            {/* Team B */}
            <button
              type="button"
              onClick={() => {
                setSelectedWinnerId(match.team_b_id);
                setIsDraw(false);
              }}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                !isDraw && selectedWinnerId === match.team_b_id
                  ? 'bg-blue-600/25 border-blue-500 text-white shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-xs font-bold line-clamp-1">{teamBName}</span>
              <span className="text-[10px] font-black uppercase text-cyan-400 mt-1">WINS</span>
            </button>
          </div>
        </div>

        {/* Reason for Correction */}
        <div className="mb-4">
          <label className="text-xs font-bold text-slate-300 block mb-1">
            {t('correction_reason')} <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('correction_reason_placeholder')}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500"
          />
          {error && <p className="text-rose-400 text-xs mt-1">{error}</p>}
        </div>

        {/* Additional Notes */}
        <div className="mb-5">
          <label className="text-xs font-medium text-slate-400 block mb-1">
            {t('optional_notes')}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : 'Save & Overwrite Result'}
          </button>
        </div>
      </div>
    </div>
  );
};
