import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { SubmitResultModal } from '../components/modals/SubmitResultModal';
import {
  Gamepad2,
  Clock,
  CheckCircle2,
  Lock,
  UserCheck,
  Brain,
  Fish,
  Armchair,
  Swords,
  Telescope,
} from 'lucide-react';

export const OperatorView: React.FC = () => {
  const { snapshot, currentTimer, submitResult, toggleMatchReady } = useTournament();
  const { t, language } = useLanguage();
  const { user, quickSwitch } = useAuth();

  // If user is operator, filter by user.game_id; otherwise allow station selector for testing
  const assignedStation = user?.game_id ?? 1;
  const [selectedStation, setSelectedStation] = useState<number>(assignedStation);

  const activeStationNumber = user?.role === 'operator' ? (user.game_id ?? 1) : selectedStation;

  // Find match for this station in current round
  const currentRoundNum = snapshot?.current_round ?? 1;
  const currentRoundMatches = snapshot?.current_round_matches ?? [];
  const activeMatch = currentRoundMatches.find(
    (m) => m.game?.station_number === activeStationNumber
  );

  const [selectedWinnerId, setSelectedWinnerId] = useState<number | null>(null);
  const [isDraw, setIsDraw] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const game = activeMatch?.game;
  const teamA = activeMatch?.teamA;
  const teamB = activeMatch?.teamB;
  const result = activeMatch?.result;
  const isCompleted = activeMatch?.status === 'completed' && !!result;

  // Auto-clear operator form when tournament or match is reset
  React.useEffect(() => {
    if (!activeMatch?.result) {
      setSelectedWinnerId(null);
      setIsDraw(false);
      setNotes('');
      setIsConfirmModalOpen(false);
    }
  }, [activeMatch?.id, activeMatch?.result, activeMatch?.status]);

  // Strict check: Is this round locked because previous rounds have incomplete matches?
  const isRoundLocked = activeMatch && activeMatch.round_id > 1
    ? snapshot?.all_matches.some((m) => m.round_id < activeMatch.round_id && m.status !== 'completed') ?? false
    : false;

  const gameName = language === 'ar' ? game?.name_ar : game?.name_en;
  const teamAName = language === 'ar' ? teamA?.name_ar : teamA?.name;
  const teamBName = language === 'ar' ? teamB?.name_ar : teamB?.name;

  // Format Central Timer
  const remaining = currentTimer?.remaining_seconds ?? 600;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timerDisplay = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const timerStatus = currentTimer?.status ?? 'idle';

  const getStationIcon = (station: number) => {
    switch (station) {
      case 1:
        return <Brain className="w-5 h-5 text-cyan-400" />;
      case 2:
        return <Fish className="w-5 h-5 text-blue-400" />;
      case 3:
        return <Armchair className="w-5 h-5 text-purple-400" />;
      case 4:
        return <Swords className="w-5 h-5 text-rose-400" />;
      case 5:
        return <Telescope className="w-5 h-5 text-amber-400" />;
      default:
        return <Gamepad2 className="w-5 h-5 text-cyan-400" />;
    }
  };

  const handleSelectOutcome = (winnerId: number | null, drawOutcome: boolean) => {
    if (isCompleted || isRoundLocked) return;
    setSelectedWinnerId(winnerId);
    setIsDraw(drawOutcome);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!activeMatch) return;
    setIsSubmitting(true);
    const success = await submitResult(activeMatch.id, selectedWinnerId, isDraw, notes);
    setIsSubmitting(false);
    if (success) {
      setIsConfirmModalOpen(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
      {/* Quick Station Switcher for Demonstrators / Admin */}
      {user?.role !== 'operator' && (
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-slate-400 shrink-0">
            Station View:
          </span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setSelectedStation(st);
                  quickSwitch('operator', st);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeStationNumber === st
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Station {st}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Synced Central Timer Header Banner */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#12161F] border border-slate-800 shadow-lg">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-xs uppercase font-bold text-slate-400">
            {t('central_timer')} ({t('round')} {currentRoundNum})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`font-mono-esports text-2xl font-black ${
              timerStatus === 'expired'
                ? 'text-rose-400 animate-pulse'
                : timerStatus === 'running' && remaining <= 60
                ? 'text-amber-400'
                : 'text-cyan-400'
            }`}
          >
            {timerDisplay}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              timerStatus === 'running'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : timerStatus === 'expired'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {timerStatus === 'running'
              ? 'ACTIVE'
              : timerStatus === 'expired'
              ? 'EXPIRED'
              : 'IDLE'}
          </span>
        </div>
      </div>

      {/* Game Station Header */}
      <div className="p-6 rounded-2xl bg-[#12161F] border border-slate-800/80 shadow-xl text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/15 text-cyan-400 border border-cyan-500/30 mb-2">
          {getStationIcon(activeStationNumber)}
          <span>Station {activeStationNumber}</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white m-0 tracking-wide">
          {gameName}
        </h2>

        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          {language === 'ar' ? game?.description_ar : game?.description_en}
        </p>

        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
          <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            {t('logged_in_as')}: <strong className="text-white">{user?.name || `Operator ${activeStationNumber}`}</strong>
          </span>
        </div>
      </div>

      {/* ALREADY SUBMITTED LOCKED STATE */}
      {isCompleted ? (
        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-center shadow-xl space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 glow-green">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-1">
              {t('result_submitted_badge')}
            </span>
            <div className="text-2xl md:text-3xl font-black text-white font-mono-esports">
              {result.is_draw ? (
                <span className="text-yellow-400">🤝 {t('draw')} (0 - 0 PTS)</span>
              ) : result.winner_team_id === teamA?.id ? (
                <span className="text-emerald-400">🏆 {teamAName} WINS</span>
              ) : (
                <span className="text-emerald-400">🏆 {teamBName} WINS</span>
              )}
            </div>
          </div>

          {/* Submission Info */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{t('submitted_by')}:</span>
              <strong className="text-white">{result.submitted_by?.name || user?.name}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{t('submitted_at')}:</span>
              <span className="font-mono-esports text-cyan-400">
                {new Date(result.submitted_at).toLocaleTimeString()}
              </span>
            </div>
            {result.operator_notes && (
              <div className="pt-2 border-t border-slate-800 text-left mt-2">
                <span className="text-[11px] text-slate-400 block mb-0.5">Notes:</span>
                <p className="text-xs italic text-slate-200 m-0">"{result.operator_notes}"</p>
              </div>
            )}
          </div>

          {/* Locked Notice */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>{t('locked_operator_note')}</span>
          </div>
        </div>
      ) : (
        /* ACTIVE SELECTION INTERFACE (MOBILE-FIRST GIANT TOUCH CARDS) */
        <div className="space-y-5">
          {/* Pre-Round Ready & Briefing Status */}
          {timerStatus === 'idle' && (
            !activeMatch?.is_ready ? (
              <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-b from-[#181E2C] to-[#121620] border-2 border-amber-500/40 shadow-xl space-y-4 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                      {t('briefing_phase_title')}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {t('station_explaining')}
                  </span>
                </div>

                <div className="text-right">
                  <h3 className="text-base md:text-lg font-black text-white m-0">
                    📢 وقت الشرح واستعداد الفريقين
                  </h3>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    {t('briefing_phase_desc')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => activeMatch && toggleMatchReady(activeMatch.id, true)}
                  disabled={isRoundLocked}
                  className={`w-full py-4 px-6 rounded-xl font-black text-base md:text-lg shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer border ${
                    isRoundLocked
                      ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/25 active:scale-95 border-emerald-400/40 glow-green'
                  }`}
                >
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <span>{t('mark_as_ready')}</span>
                </button>
              </div>
            ) : (
              <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-b from-emerald-950/30 to-[#121620] border-2 border-emerald-500/50 shadow-xl space-y-3 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                      {t('ready_confirmed_title')}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    READY ✓
                  </span>
                </div>

                <div className="text-right">
                  <h3 className="text-base md:text-lg font-black text-white m-0 flex items-center justify-end gap-2">
                    <span>تم إبلاغ غرفة التحكم بجاهزية محطتك!</span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {t('ready_confirmed_desc')}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-400 text-[11px]">
                    {activeMatch?.ready_at ? `جاهز منذ: ${new Date(activeMatch.ready_at).toLocaleTimeString()}` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => activeMatch && toggleMatchReady(activeMatch.id, false)}
                    className="text-amber-400 hover:text-amber-300 hover:underline text-xs font-bold transition-all cursor-pointer"
                  >
                    {t('mark_as_not_ready')}
                  </button>
                </div>
              </div>
            )
          )}

          {timerStatus === 'running' && (
            <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs text-amber-300 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span>{t('round_in_progress_banner')}</span>
              </div>
              <span className="font-mono-esports text-sm font-black text-amber-400">
                {timerDisplay}
              </span>
            </div>
          )}

          {/* Two Large Team Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Team A Touch Card */}
            <div className="p-5 md:p-6 rounded-2xl bg-[#12161F] border border-slate-700/80 flex flex-col items-center justify-center text-center shadow-xl">
              <span className="text-[10px] font-mono-esports font-black uppercase tracking-widest text-cyan-400 mb-2">
                TEAM A
              </span>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg mb-3"
                style={{ backgroundColor: teamA?.color }}
              >
                <span className="font-black text-white text-lg font-mono-esports">
                  {teamA?.code}
                </span>
              </div>
              <h3 className="text-base md:text-xl font-black text-white m-0 line-clamp-2">
                {teamAName}
              </h3>
            </div>

            {/* Team B Touch Card */}
            <div className="p-5 md:p-6 rounded-2xl bg-[#12161F] border border-slate-700/80 flex flex-col items-center justify-center text-center shadow-xl">
              <span className="text-[10px] font-mono-esports font-black uppercase tracking-widest text-cyan-400 mb-2">
                TEAM B
              </span>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg mb-3"
                style={{ backgroundColor: teamB?.color }}
              >
                <span className="font-black text-white text-lg font-mono-esports">
                  {teamB?.code}
                </span>
              </div>
              <h3 className="text-base md:text-xl font-black text-white m-0 line-clamp-2">
                {teamBName}
              </h3>
            </div>
          </div>

          {/* LOCKED ROUND WARNING BANNER */}
          {isRoundLocked && (
            <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-center shadow-xl space-y-2 animate-fadeIn">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mb-1">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-amber-300 m-0 uppercase tracking-wide">
                {language === 'ar' ? `الجولة ${activeMatch?.round_id} مقفلة حالياً` : `Round ${activeMatch?.round_id} is Currently Locked`}
              </h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed m-0">
                {language === 'ar'
                  ? `لا يمكن بدء اللعب أو اختيار أي فائز في الجولة ${activeMatch?.round_id} حتى تكتمل جميع مباريات الجولة السابقة (الجولة ${Number(activeMatch?.round_id) - 1}) وتعتمد رسمياً.`
                  : `Cannot play or submit results for Round ${activeMatch?.round_id} until all matches in Round ${Number(activeMatch?.round_id) - 1} are completed and approved.`}
              </p>
            </div>
          )}

          {/* Optional Notes Input */}
          <div className="p-4 rounded-xl bg-[#12161F] border border-slate-800">
            <label className="text-xs font-bold text-slate-300 block mb-1">
              {t('optional_notes')}
            </label>
            <input
              type="text"
              value={notes}
              disabled={isRoundLocked}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('notes_placeholder')}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 ${
                isRoundLocked ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
          </div>

          {/* THREE EXTREMELY LARGE WINNER BUTTONS */}
          <div className="space-y-3">
            {/* 1. TEAM A WINS */}
            <button
              onClick={() => handleSelectOutcome(teamA?.id ?? null, false)}
              disabled={isRoundLocked}
              className={`w-full py-5 px-6 rounded-2xl font-black text-lg md:text-xl uppercase tracking-wider transition-all flex items-center justify-between ${
                isRoundLocked
                  ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-xl shadow-emerald-500/20 active:scale-[0.98] cursor-pointer glow-green'
              }`}
            >
              <span className="flex items-center gap-2">
                {isRoundLocked && <Lock className="w-5 h-5 text-amber-400 shrink-0" />}
                <span>{teamAName} {t('wins_short')}</span>
              </span>
              <span className="text-sm font-mono-esports bg-black/30 px-3 py-1 rounded-xl">
                {isRoundLocked ? 'LOCKED' : '+3 PTS'}
              </span>
            </button>

            {/* 2. TEAM B WINS */}
            <button
              onClick={() => handleSelectOutcome(teamB?.id ?? null, false)}
              disabled={isRoundLocked}
              className={`w-full py-5 px-6 rounded-2xl font-black text-lg md:text-xl uppercase tracking-wider transition-all flex items-center justify-between ${
                isRoundLocked
                  ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-xl shadow-blue-500/20 active:scale-[0.98] cursor-pointer glow-blue'
              }`}
            >
              <span className="flex items-center gap-2">
                {isRoundLocked && <Lock className="w-5 h-5 text-amber-400 shrink-0" />}
                <span>{teamBName} {t('wins_short')}</span>
              </span>
              <span className="text-sm font-mono-esports bg-black/30 px-3 py-1 rounded-xl">
                {isRoundLocked ? 'LOCKED' : '+3 PTS'}
              </span>
            </button>

            {/* 3. DRAW */}
            <button
              onClick={() => handleSelectOutcome(null, true)}
              disabled={isRoundLocked}
              className={`w-full py-4 px-6 rounded-2xl font-black text-base md:text-lg uppercase tracking-wider transition-all flex items-center justify-between ${
                isRoundLocked
                  ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  : 'bg-slate-800 hover:bg-slate-700 text-yellow-400 border border-yellow-500/30 shadow-lg active:scale-[0.98] cursor-pointer'
              }`}
            >
              <span className="flex items-center gap-2">
                {isRoundLocked && <Lock className="w-4 h-4 text-amber-400 shrink-0" />}
                <span>🤝 {t('draw')}</span>
              </span>
              <span className="text-xs font-mono-esports bg-black/40 px-2.5 py-1 rounded-lg text-yellow-300">
                {isRoundLocked ? 'LOCKED' : '+1 PT (1 - 1)'}
              </span>
            </button>
          </div>

          <p className="text-center text-xs text-slate-400 pt-1">
            {isRoundLocked
              ? (language === 'ar' ? '⚠️ هذه الجولة مقفلة ولا يمكن التعديل عليها حتى إنهاء الجولة السابقة.' : '⚠️ This round is locked until previous round completes.')
              : 'Note: Results can be submitted anytime before, at, or after the 10-minute timer expires.'}
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      {activeMatch && (
        <SubmitResultModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          match={activeMatch}
          selectedWinnerId={selectedWinnerId}
          isDraw={isDraw}
          notes={notes}
          onConfirm={handleConfirmSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};
