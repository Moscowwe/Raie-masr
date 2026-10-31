import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { useLanguage } from '../../context/LanguageContext';
import { Clock, X, Check } from 'lucide-react';

interface SetDurationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetDurationModal: React.FC<SetDurationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentTimer, setTimerDuration } = useTournament();
  const { t } = useLanguage();

  const currentMinutes = Math.round((currentTimer?.duration_seconds ?? 600) / 60);
  const [minutes, setMinutes] = useState<number>(currentMinutes);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const presets = [5, 8, 10, 12, 15, 20];

  const handleSave = async () => {
    if (minutes < 1 || minutes > 120) return;
    setIsSubmitting(true);
    const success = await setTimerDuration(minutes * 60);
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#12161F] border border-slate-700 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white m-0">
              {t('set_duration')}
            </h3>
            <p className="text-xs text-slate-400 m-0">
              {t('central_timer')}
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="my-4">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-2">
            Presets:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setMinutes(p)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  minutes === p
                    ? 'bg-blue-600 border-cyan-400 text-white shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {p} Min
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input */}
        <div className="my-4">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
            {t('duration_minutes')}:
          </label>
          <input
            type="number"
            min={1}
            max={120}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono-esports text-lg text-center font-bold focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 text-white transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : 'Set Timer'}
          </button>
        </div>
      </div>
    </div>
  );
};
