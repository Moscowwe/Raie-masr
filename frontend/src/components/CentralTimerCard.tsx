import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Play, Pause, RotateCcw, StopCircle, Settings, Lock, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface CentralTimerCardProps {
  onOpenDurationModal?: () => void;
  showAdminControls?: boolean;
}

export const CentralTimerCard: React.FC<CentralTimerCardProps> = ({
  onOpenDurationModal,
  showAdminControls = false,
}) => {
  const { currentTimer, snapshot, startRound, pauseRound, resumeRound, expireRound, resetTimer } = useTournament();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [showNotReadyModal, setShowNotReadyModal] = useState(false);

  const isAdmin = user?.role === 'admin';
  const roundNumber = snapshot?.current_round ?? 1;

  const currentRoundMatches = snapshot?.current_round_matches ?? [];
  const totalStationCount = currentRoundMatches.length || 5;
  const readyStationCount = currentRoundMatches.filter((m) => m.is_ready).length;
  const allStationsReady = totalStationCount > 0 && readyStationCount === totalStationCount;
  const unreadyMatches = currentRoundMatches.filter((m) => !m.is_ready);

  const isRoundLocked = roundNumber > 1 && (
    snapshot?.all_matches.some((m) => m.round_id < roundNumber && m.status !== 'completed') ||
    snapshot?.rounds.find((prevR) => prevR.round_number === roundNumber - 1)?.status !== 'completed'
  );

  const remainingSeconds = currentTimer?.remaining_seconds ?? 600;
  const durationSeconds = currentTimer?.duration_seconds ?? 600;
  const status = currentTimer?.status ?? 'idle';

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPercent = durationSeconds > 0 ? (remainingSeconds / durationSeconds) * 100 : 0;

  // Status Styling
  const getStatusBadge = () => {
    if (isRoundLocked) {
      return {
        label: `${t('round_locked')} • ${t('round')} ${roundNumber - 1} ${t('awaiting_results')}`,
        bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        dot: 'bg-amber-400',
      };
    }
    switch (status) {
      case 'running':
        return {
          label: t('round_active'),
          bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40 glow-orange',
          dot: 'bg-amber-400 animate-ping',
        };
      case 'paused':
        return {
          label: t('round_paused'),
          bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
          dot: 'bg-yellow-400',
        };
      case 'expired':
        return {
          label: `${t('time_expired')} • ${t('awaiting_results')}`,
          bg: 'bg-rose-500/25 text-rose-300 border-rose-500/40 glow-red',
          dot: 'bg-rose-400 animate-pulse',
        };
      default:
        return {
          label: t('timer_idle'),
          bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          dot: 'bg-blue-400',
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#12161F] border border-slate-800/80 p-6 md:p-8 shadow-2xl">
      {/* Background ambient glow */}
      <div
        className={`absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-36 rounded-full blur-3xl opacity-30 pointer-events-none ${
          status === 'running'
            ? 'bg-amber-500'
            : status === 'expired'
            ? 'bg-rose-600'
            : 'bg-blue-600'
        }`}
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Round & Status Header */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
          <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800/80 text-slate-300 border border-slate-700/60">
            {t('round')} {roundNumber}
          </span>
          <span
            className={`inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs font-bold border transition-all duration-300 ${statusBadge.bg}`}
          >
            <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
            {statusBadge.label}
          </span>

          {status === 'idle' && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all duration-300 ${
                allStationsReady
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 glow-green'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}
            >
              {allStationsReady ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
              <span>
                {language === 'ar'
                  ? `جاهزية المحطات: ${readyStationCount} من ${totalStationCount} جاهز`
                  : `Stations Ready: ${readyStationCount}/${totalStationCount}`}
              </span>
            </span>
          )}
        </div>

        {/* Big Esports Digital Countdown */}
        <div className="my-2">
          <div
            className={`font-mono-esports text-6xl md:text-8xl font-black tracking-tight select-none transition-colors duration-300 ${
              status === 'expired'
                ? 'text-rose-500 drop-shadow-[0_0_35px_rgba(244,63,94,0.6)]'
                : status === 'running' && remainingSeconds <= 60
                ? 'text-amber-400 drop-shadow-[0_0_30px_rgba(251,191,36,0.6)] animate-pulse'
                : status === 'running'
                ? 'text-blue-400 drop-shadow-[0_0_30px_rgba(96,165,250,0.5)]'
                : 'text-white'
            }`}
          >
            {formattedTime}
          </div>
          <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">
            {t('central_timer')}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xl h-2 bg-slate-800/80 rounded-full overflow-hidden my-4 p-[1px]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              status === 'expired'
                ? 'bg-rose-500'
                : status === 'running' && remainingSeconds <= 60
                ? 'bg-amber-400'
                : 'bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Admin Controls */}
        {showAdminControls && isAdmin && (
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
            {status !== 'running' ? (
              <button
                onClick={() => {
                  if (status === 'paused') {
                    resumeRound();
                  } else if (status === 'idle' && !allStationsReady) {
                    setShowNotReadyModal(true);
                  } else {
                    startRound();
                  }
                }}
                disabled={isRoundLocked}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all transform ${
                  isRoundLocked
                    ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                    : status === 'idle' && allStationsReady
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/30 active:scale-95 cursor-pointer glow-green animate-pulse'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/25 active:scale-95 cursor-pointer glow-blue'
                }`}
                title={isRoundLocked ? t('cannot_start_locked_round') : undefined}
              >
                {isRoundLocked ? (
                  <Lock className="w-4 h-4 text-amber-400" />
                ) : status === 'idle' && allStationsReady ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                ) : (
                  <Play className="w-4 h-4 fill-white" />
                )}
                {isRoundLocked
                  ? t('round_locked')
                  : status === 'paused'
                  ? t('resume_timer')
                  : allStationsReady
                  ? (language === 'ar' ? 'بدء الجولة (الكل جاهز 5/5) ⚡' : 'START ROUND (All Ready 5/5)')
                  : (language === 'ar' ? `بدء الجولة (${readyStationCount}/${totalStationCount} جاهز)` : `START ROUND (${readyStationCount}/${totalStationCount})`)}
              </button>
            ) : (
              <button
                onClick={pauseRound}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all cursor-pointer"
              >
                <Pause className="w-4 h-4 fill-amber-300" />
                {t('pause_timer')}
              </button>
            )}

            {status !== 'expired' && status !== 'idle' && (
              <button
                onClick={expireRound}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all cursor-pointer"
                title="Conclude timer early without altering results"
              >
                <StopCircle className="w-4 h-4" />
                {t('end_round_timer')}
              </button>
            )}

            <button
              onClick={resetTimer}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              {t('reset_timer')}
            </button>

            {onOpenDurationModal && status !== 'running' && (
              <button
                onClick={onOpenDurationModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-all cursor-pointer"
              >
                <Settings className="w-4 h-4 text-cyan-400" />
                {t('set_duration')} ({Math.round(durationSeconds / 60)}m)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Warning Modal when Admin starts round before all stations are ready */}
      {showNotReadyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-[#161B26] border border-amber-500/40 p-6 shadow-2xl text-right space-y-4">
            <button
              onClick={() => setShowNotReadyModal(false)}
              className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white m-0">
                  {language === 'ar' ? 'تنبيه: محطات لم تؤكد الجاهزية بعد' : 'Stations Not Ready Yet'}
                </h3>
                <span className="text-xs text-amber-300">
                  {language === 'ar'
                    ? `جاهزية ${readyStationCount} من أصل ${totalStationCount} محطات فقط`
                    : `Only ${readyStationCount} of ${totalStationCount} stations ready`}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed m-0">
              {language === 'ar'
                ? 'المحطات التالية لا تزال في مرحلة شرح قواعد اللعبة للفرق:'
                : 'The following stations are still briefing rules to teams:'}
            </p>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {unreadyMatches.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs"
                >
                  <span className="text-amber-300 font-bold">
                    ⏳ {language === 'ar' ? 'جاري الشرح' : 'Briefing'}
                  </span>
                  <span className="text-white font-medium">
                    {language === 'ar' ? m.game?.name_ar : m.game?.name_en} (محطة {m.game?.station_number})
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 m-0">
              {language === 'ar'
                ? 'هل ترغب في بدء مؤقت الجولة (10 دقائق) على أي حال؟'
                : 'Do you want to start the 10-minute round timer anyway?'}
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowNotReadyModal(false);
                  startRound();
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
              >
                {language === 'ar' ? 'بدء الجولة على أي حال' : 'Start Round Anyway'}
              </button>
              <button
                type="button"
                onClick={() => setShowNotReadyModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                {language === 'ar' ? 'انتظار اكتمال الجاهزية' : 'Wait for Ready'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
