import React from 'react';
import { useTournament } from '../context/TournamentContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Play, Pause, RotateCcw, StopCircle, Settings, Lock } from 'lucide-react';

interface CentralTimerCardProps {
  onOpenDurationModal?: () => void;
  showAdminControls?: boolean;
}

export const CentralTimerCard: React.FC<CentralTimerCardProps> = ({
  onOpenDurationModal,
  showAdminControls = false,
}) => {
  const { currentTimer, snapshot, startRound, pauseRound, resumeRound, expireRound, resetTimer } = useTournament();
  const { t } = useLanguage();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';
  const roundNumber = snapshot?.current_round ?? 1;

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
                onClick={status === 'paused' ? resumeRound : startRound}
                disabled={isRoundLocked}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all transform ${
                  isRoundLocked
                    ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/25 active:scale-95 cursor-pointer glow-blue'
                }`}
                title={isRoundLocked ? t('cannot_start_locked_round') : undefined}
              >
                {isRoundLocked ? (
                  <Lock className="w-4 h-4 text-amber-400" />
                ) : (
                  <Play className="w-4 h-4 fill-white" />
                )}
                {isRoundLocked
                  ? t('round_locked')
                  : status === 'paused'
                  ? t('resume_timer')
                  : t('start_round')}
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
    </div>
  );
};
