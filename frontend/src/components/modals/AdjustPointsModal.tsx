import React, { useState, useEffect } from 'react';
import type { Team } from '../../types/tournament';
import { useLanguage } from '../../context/LanguageContext';
import { X, Award, ShieldAlert, Check } from 'lucide-react';

interface AdjustPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  initialTeamId?: number | null;
  onConfirm: (teamId: number, delta: number, reason: string) => Promise<void> | void;
}

export const AdjustPointsModal: React.FC<AdjustPointsModalProps> = ({
  isOpen,
  onClose,
  teams,
  initialTeamId,
  onConfirm,
}) => {
  const { t, language } = useLanguage();
  const [selectedTeamId, setSelectedTeamId] = useState<number>(initialTeamId || (teams[0]?.id ?? 1));
  const [delta, setDelta] = useState<number>(1);
  const [customDelta, setCustomDelta] = useState<string>('1');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTeamId) {
      setSelectedTeamId(initialTeamId);
    }
  }, [initialTeamId]);

  if (!isOpen) return null;

  const quickPills = [
    { label: '+3', value: 3, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    { label: '+2', value: 2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    { label: '+1', value: 1, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    { label: '-1', value: -1, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
    { label: '-2', value: -2, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
    { label: '-3', value: -3, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  ];

  const presetReasons = [
    { ar: 'مكافأة سلوك رياضي ولعب نظيف', en: 'Fair Play & Sportsmanship Bonus' },
    { ar: 'قرار تحكيمي إداري خاص', en: 'Official Administrative Decision' },
    { ar: 'خصم نقطة بسبب مخالفة أو تأخير', en: 'Penalty Deduction for Rule Breach' },
    { ar: 'تصحيح نتيجة حسابية سابقة', en: 'Correction of Previous Result' },
  ];

  const handlePillClick = (val: number) => {
    setDelta(val);
    setCustomDelta(String(val));
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomDelta(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      setDelta(parsed);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason.trim() || (language === 'ar' ? 'تعديل إداري مباشر للنقاط' : 'Administrative score adjustment');
    if (delta === 0) {
      setError(language === 'ar' ? 'يجب أن تكون قيمة النقاط غير صفر' : 'Points delta cannot be zero.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    await onConfirm(selectedTeamId, delta, finalReason);
    setIsSubmitting(false);
    onClose();
  };

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const teamDisplayName = language === 'ar' ? selectedTeam?.name_ar : selectedTeam?.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#12161F] border border-slate-700/80 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white m-0">
              {t('adjust_points_title')}
            </h3>
            <p className="text-xs text-slate-400 m-0">
              {language === 'ar' ? 'تعديل رصيد أي فريق بالزيادة أو الخصم مع التوثيق المباشر' : 'Add bonus points or apply penalty deductions with audit log'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Team Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              {language === 'ar' ? 'اختر الفريق:' : 'Select Team:'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-900/80 rounded-xl border border-slate-800">
              {teams.map((tm) => {
                const isCurrent = tm.id === selectedTeamId;
                const tmName = language === 'ar' ? tm.name_ar : tm.name;
                return (
                  <button
                    type="button"
                    key={tm.id}
                    onClick={() => setSelectedTeamId(tm.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                        : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700/60'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full mb-1"
                      style={{ backgroundColor: tm.color }}
                    />
                    <span className="text-[11px] truncate max-w-full">{tmName}</span>
                    <span className="text-[9px] font-mono-esports opacity-75">{tm.code}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Points Adjustment Amount */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              {language === 'ar' ? 'قيمة النقاط (+ إضافة / - خصم):' : 'Points Amount (+ Add / - Deduct):'}
            </label>

            {/* Quick Pills */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {quickPills.map((pill) => (
                <button
                  type="button"
                  key={pill.value}
                  onClick={() => handlePillClick(pill.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black font-mono-esports border transition-all cursor-pointer ${
                    delta === pill.value
                      ? 'ring-2 ring-cyan-400 font-bold scale-105 ' + pill.color
                      : pill.color + ' opacity-75 hover:opacity-100'
                  }`}
                >
                  {pill.label} PTS
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={customDelta}
                onChange={handleCustomChange}
                placeholder="+1 or -1"
                className="w-32 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono-esports font-bold text-white text-sm focus:outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-slate-400">
                {delta > 0
                  ? `(إضافة ${delta} نقاط لـ ${teamDisplayName})`
                  : delta < 0
                  ? `(خصم ${Math.abs(delta)} نقاط من ${teamDisplayName})`
                  : '(لا يوجد تغيير)'}
              </span>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              {language === 'ar' ? 'سبب التعديل (اختياري):' : 'Reason for Adjustment (Optional):'}
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {presetReasons.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setReason(language === 'ar' ? p.ar : p.en)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium border border-slate-700/80 cursor-pointer"
                >
                  {language === 'ar' ? p.ar : p.en}
                </button>
              ))}
            </div>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={language === 'ar' ? 'اكتب سبب التعديل بالتفصيل...' : 'Detailed reason...'}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer glow-blue"
            >
              {isSubmitting ? (
                <span>{language === 'ar' ? 'جارٍ الحفظ...' : 'Saving...'}</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{language === 'ar' ? 'تطبيق التعديل على الفور' : 'Apply Points Now'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
