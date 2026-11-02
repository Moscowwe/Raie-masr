import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { RotateCcw, AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface ResetTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean | void> | void;
}

export const ResetTournamentModal: React.FC<ResetTournamentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { language } = useLanguage();
  const [isResetting, setIsResetting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsResetting(true);
    await onConfirm();
    setIsResetting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#12161F] border border-rose-500/40 p-6 shadow-2xl shadow-rose-950/40">
        <button
          onClick={onClose}
          disabled={isResetting}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-5">
          <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-lg shadow-rose-500/10">
            <RotateCcw className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-black text-white m-0">
              {language === 'ar' ? 'تصفير البطولة والبدء من جديد' : 'Reset Entire Tournament'}
            </h3>
            <p className="text-xs text-rose-400/90 font-medium m-0 mt-0.5">
              {language === 'ar'
                ? 'إعادة ضبط كل الجولات والمباريات والترتيب إلى الصفر'
                : 'Reset all rounds, matches, scores & timer back to 0'}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2 mb-5">
          <div className="flex items-center gap-2 font-bold text-rose-200">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>
              {language === 'ar'
                ? 'تنبيه إداري: هذا الإجراء لا يمكن التراجع عنه!'
                : 'Administrative Warning: This action is permanent!'}
            </span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-300 leading-relaxed text-[11px] sm:text-xs">
            <li>
              {language === 'ar'
                ? 'سيتم تصفير جميع المباريات الـ 25 وإلغاء كل النتائج المسجلة.'
                : 'All 25 matches will be reset to pending and results cleared.'}
            </li>
            <li>
              {language === 'ar'
                ? 'سيتم تصفير جدول ترتيب الفرق والنقاط لتبدأ جميع الفرق من 0 نقطة.'
                : 'All team points and rankings will return to 0 points.'}
            </li>
            <li>
              {language === 'ar'
                ? 'سيتم مسح أي نقاط أو مكافآت يدوية تم إضافتها من لوحة التحكم.'
                : 'Any manual bonus points or penalties will be cleared.'}
            </li>
            <li>
              {language === 'ar'
                ? 'ستعود الجولة 1 لتكون الجولة الوحيدة المفتوحة، وتُقفل باقي الجولات.'
                : 'Round 1 will be reactivated, and rounds 2-5 will be sequentially locked.'}
            </li>
            <li>
              {language === 'ar'
                ? 'سيعود المؤقت المركزي لوضع الاستعداد 10:00.'
                : 'Central tournament timer resets to 10:00 idle.'}
            </li>
          </ul>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-300 text-xs font-bold transition-all cursor-pointer hover:bg-slate-800"
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isResetting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 glow-rose transition-all cursor-pointer disabled:opacity-50"
          >
            <ShieldAlert className="w-4 h-4" />
            {isResetting
              ? language === 'ar'
                ? 'جارٍ التصفير...'
                : 'Resetting...'
              : language === 'ar'
              ? 'نعم، تصفير البطولة بالكامل'
              : 'Yes, Reset Entire Tournament'}
          </button>
        </div>
      </div>
    </div>
  );
};
