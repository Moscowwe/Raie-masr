import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { CentralTimerCard } from '../components/CentralTimerCard';
import { MatchStationCard } from '../components/MatchStationCard';
import { LeaderboardTable } from '../components/LeaderboardTable';
import { SetDurationModal } from '../components/modals/SetDurationModal';
import { CorrectResultModal } from '../components/modals/CorrectResultModal';
import type { TournamentMatch } from '../types/tournament';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const { snapshot, selectRound, completeRound, correctResult } = useTournament();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'matches' | 'leaderboard' | 'activity'>('matches');
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);
  const [selectedMatchForCorrection, setSelectedMatchForCorrection] = useState<TournamentMatch | null>(null);
  const [isAdvancingRound, setIsAdvancingRound] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  const currentRoundNum = snapshot?.current_round ?? 1;
  const activeRound = snapshot?.active_round;
  const matches = snapshot?.current_round_matches ?? [];
  const stats = snapshot?.stats;
  const rounds = snapshot?.rounds ?? [];
  const leaderboard = snapshot?.leaderboard ?? [];
  const recentActivities = snapshot?.recent_activities ?? [];

  const completedCount = matches.filter((m) => m.status === 'completed' || m.status === 'cancelled').length;
  const allMatchesDone = matches.length > 0 && completedCount === matches.length;

  const handleCompleteRound = async () => {
    if (!allMatchesDone) {
      setAdvanceError(t('pending_matches_warning'));
      return;
    }
    setAdvanceError(null);
    setIsAdvancingRound(true);
    await completeRound(currentRoundNum);
    setIsAdvancingRound(false);
  };

  return (
    <div className="space-y-6">
      {/* Admin Notice if user is not logged in as Admin */}
      {user?.role !== 'admin' && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300 m-0">
              You are currently viewing the Control Room in preview mode. Switch to <strong>Main Administrator</strong> account to trigger timer controls and round advancement.
            </p>
          </div>
        </div>
      )}

      {/* Prominent Central Timer */}
      <CentralTimerCard
        showAdminControls={true}
        onOpenDurationModal={() => setIsDurationModalOpen(true)}
      />

      {/* Tournament Statistics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-3.5 rounded-xl bg-[#12161F] border border-slate-800 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            {t('stats_teams')}
          </span>
          <span className="text-xl font-black font-mono-esports text-white mt-1 block">
            {stats?.total_teams ?? 10}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12161F] border border-slate-800 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            {t('stats_games')}
          </span>
          <span className="text-xl font-black font-mono-esports text-cyan-400 mt-1 block">
            {stats?.total_games ?? 5}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12161F] border border-slate-800 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            {t('stats_rounds')}
          </span>
          <span className="text-xl font-black font-mono-esports text-white mt-1 block">
            {stats?.total_rounds ?? 5}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12161F] border border-slate-800 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            {t('stats_current_round')}
          </span>
          <span className="text-xl font-black font-mono-esports text-blue-400 mt-1 block">
            {currentRoundNum} / 5
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12161F] border border-slate-800 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
            {t('stats_completed')}
          </span>
          <span className="text-xl font-black font-mono-esports text-emerald-400 mt-1 block">
            {stats?.completed_matches ?? 0}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12161F] border border-slate-800 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
            {t('stats_in_progress')}
          </span>
          <span className="text-xl font-black font-mono-esports text-amber-400 mt-1 block">
            {stats?.in_progress_matches ?? 0}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12161F] border border-slate-800 text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            {t('stats_pending')}
          </span>
          <span className="text-xl font-black font-mono-esports text-slate-400 mt-1 block">
            {stats?.pending_matches ?? 0}
          </span>
        </div>
      </div>

      {/* Round Switcher & Actions Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#12161F] border border-slate-800">
        {/* Round Tabs 1 to 5 */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {rounds.map((r) => {
            const isSelected = r.round_number === currentRoundNum;
            const isCompletedRound = r.status === 'completed';
            const isActiveRound = r.status === 'active';
            const isRoundLocked = r.round_number > 1 && (
              snapshot?.all_matches.some(
                (m) => m.round_id < r.round_number && m.status !== 'completed'
              ) ||
              snapshot?.rounds.find((prevR) => prevR.round_number === r.round_number - 1)?.status !== 'completed'
            );

            return (
              <button
                key={r.id}
                onClick={() => {
                  if (isRoundLocked) {
                    setAdvanceError(
                      language === 'ar'
                        ? `الجولة ${r.round_number} مغلقة! لا يمكن فتحها حتى تكتمل جميع مباريات الجولة ${r.round_number - 1}.`
                        : `Round ${r.round_number} is locked! Complete all matches in Round ${r.round_number - 1} first.`
                    );
                    return;
                  }
                  setAdvanceError(null);
                  selectRound(r.round_number);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isRoundLocked
                    ? 'bg-slate-950/60 border border-slate-800/50 text-slate-500 cursor-not-allowed opacity-60'
                    : isSelected
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 glow-blue cursor-pointer'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer'
                }`}
                title={isRoundLocked ? `Round ${r.round_number} is locked` : undefined}
              >
                <span>
                  {t('round')} {r.round_number}
                </span>
                {isRoundLocked && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                {isCompletedRound && !isRoundLocked && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                {isActiveRound && !isRoundLocked && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>
            );
          })}
        </div>

        {/* View Mode Tabs (Matches / Leaderboard / Audit Log) */}
        <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'matches'
                ? 'bg-slate-800 text-cyan-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            5 Stations Grid
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-slate-800 text-cyan-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'activity'
                ? 'bg-slate-800 text-cyan-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Activity Audit
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      {activeTab === 'matches' && (
        <div className="space-y-6">
          {/* Section Header with Round Completion Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-wider m-0">
                  {t('round')} {currentRoundNum} • 5 Live Game Stations
                </h2>
                {currentRoundNum > 1 && (snapshot?.all_matches.some((m) => m.round_id < currentRoundNum && m.status !== 'completed') ||
                  snapshot?.rounds.find((prevR) => prevR.round_number === currentRoundNum - 1)?.status !== 'completed') && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <Lock className="w-3 h-3 text-amber-400" />
                    {language === 'ar' ? 'الجولة مقفلة' : 'Round Locked'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 m-0 mt-0.5">
                Results recorded: {completedCount} of 5 completed
              </p>
            </div>

            {/* Complete Round Action Button */}
            {user?.role === 'admin' && activeRound?.status !== 'completed' && (
              <button
                onClick={handleCompleteRound}
                disabled={isAdvancingRound || !allMatchesDone}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  allMatchesDone
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25 glow-green'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-75'
                }`}
                title={allMatchesDone ? 'Complete Round' : t('pending_matches_warning')}
              >
                <CheckCircle2 className="w-4 h-4" />
                {t('approve_round')}
              </button>
            )}
          </div>

          {advanceError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{advanceError}</span>
            </div>
          )}

          {/* Grid of the 5 Games */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {matches.map((match) => {
              const isMatchLocked = match.round_id > 1 && (
                snapshot?.all_matches.some((m) => m.round_id < match.round_id && m.status !== 'completed') ||
                snapshot?.rounds.find((prevR) => prevR.round_number === match.round_id - 1)?.status !== 'completed'
              );

              return (
                <MatchStationCard
                  key={match.id}
                  match={match}
                  isLocked={isMatchLocked}
                  showAdminActions={true}
                  onCorrectResult={(m) => setSelectedMatchForCorrection(m)}
                />
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <LeaderboardTable leaderboard={leaderboard} />
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="rounded-2xl bg-[#12161F] border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white m-0">
              {t('audit_feed')}
            </h3>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto pr-2">
            {recentActivities.map((act) => (
              <div key={act.id} className="py-3 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{act.user_name}</span>
                    <span className="text-[10px] font-mono-esports font-bold uppercase px-2 py-0.5 rounded bg-blue-500/15 text-cyan-400 border border-cyan-500/20">
                      {act.action}
                    </span>
                  </div>
                  {act.details && (
                    <p className="text-xs text-slate-400 mt-1 m-0">
                      {typeof act.details === 'string'
                        ? act.details
                        : JSON.stringify(act.details)}
                    </p>
                  )}
                </div>
                <span className="text-[10px] font-mono-esports text-slate-500 shrink-0">
                  {new Date(act.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <SetDurationModal
        isOpen={isDurationModalOpen}
        onClose={() => setIsDurationModalOpen(false)}
      />

      {selectedMatchForCorrection && (
        <CorrectResultModal
          isOpen={true}
          match={selectedMatchForCorrection}
          onClose={() => setSelectedMatchForCorrection(null)}
          onConfirm={async (winnerTeamId, isDraw, reason, notes) => {
            return await correctResult(selectedMatchForCorrection.id, winnerTeamId, isDraw, reason, notes);
          }}
        />
      )}
    </div>
  );
};
