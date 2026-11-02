import React, { useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useLanguage } from '../context/LanguageContext';
import { LeaderboardTable } from '../components/LeaderboardTable';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Gamepad2,
  Brain,
  Fish,
  Armchair,
  Swords,
  Telescope,
  CheckCircle2,
  Tv,
} from 'lucide-react';

export const PublicView: React.FC = () => {
  const { snapshot, currentTimer } = useTournament();
  const { t, language } = useLanguage();

  const currentRoundNum = snapshot?.current_round ?? 1;
  const matches = snapshot?.current_round_matches ?? [];
  const leaderboard = snapshot?.leaderboard ?? [];
  const activeRound = snapshot?.active_round;

  const remaining = currentTimer?.remaining_seconds ?? 600;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timerStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const timerStatus = currentTimer?.status ?? 'idle';

  // Champion celebration if round 5 completed
  const isTournamentCompleted =
    currentRoundNum === 5 && activeRound?.status === 'completed';

  useEffect(() => {
    if (isTournamentCompleted) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [isTournamentCompleted]);

  const getStationIcon = (iconName?: string) => {
    switch (iconName) {
      case 'circle-dot':
      case 'brain':
        return <Brain className="w-5 h-5 text-cyan-400" />;
      case 'fish':
        return <Fish className="w-5 h-5 text-blue-400" />;
      case 'armchair':
        return <Armchair className="w-5 h-5 text-purple-400" />;
      case 'swords':
        return <Swords className="w-5 h-5 text-rose-400" />;
      case 'zap':
      case 'telescope':
        return <Telescope className="w-5 h-5 text-amber-400" />;
      default:
        return <Gamepad2 className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ARENA JUMBOTRON HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#161B26] to-[#0E121A] border-2 border-cyan-500/40 p-6 md:p-10 shadow-2xl text-center">
        {/* Ambient Top Glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 rounded-full blur-3xl opacity-30 pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-blue-500/20 text-cyan-300 border border-cyan-400/40 mb-3 glow-cyan">
            <Tv className="w-4 h-4 animate-pulse" />
            <span>ARENA BROADCAST • {t('round')} {currentRoundNum} OF 5</span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-wider m-0 leading-tight">
            {language === 'ar' ? snapshot?.tournament_name_ar : snapshot?.tournament_name}
          </h1>

          {/* GIANT CENTRAL CLOCK */}
          <div className="my-6">
            <div
              className={`font-mono-esports text-7xl md:text-9xl font-black tracking-tight drop-shadow-[0_0_40px_rgba(0,210,255,0.4)] ${
                timerStatus === 'expired'
                  ? 'text-rose-500 animate-pulse drop-shadow-[0_0_50px_rgba(244,63,94,0.7)]'
                  : timerStatus === 'running' && remaining <= 60
                  ? 'text-amber-400 animate-pulse'
                  : 'text-cyan-400'
              }`}
            >
              {timerStr}
            </div>

            <span
              className={`inline-block px-5 py-1.5 rounded-full text-xs md:text-sm font-black uppercase tracking-widest mt-2 border ${
                timerStatus === 'expired'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 glow-red'
                  : timerStatus === 'running'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 glow-orange'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {timerStatus === 'expired'
                ? t('time_expired') + ' • ' + t('awaiting_results')
                : timerStatus === 'running'
                ? t('round_active')
                : t('timer_idle')}
            </span>
          </div>
        </div>
      </div>

      {/* 2-COLUMN ARENA LAYOUT: 5 LIVE STATIONS & LIVE LEADERBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: 5 STATIONS (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-cyan-400" />
              <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-wider m-0">
                Live Match Stations
              </h2>
            </div>
            <span className="text-xs font-mono-esports font-bold text-slate-400">
              Round {currentRoundNum} Assignments
            </span>
          </div>

          <div className="space-y-3.5">
            {matches.map((match) => {
              const game = match.game;
              const teamA = match.teamA;
              const teamB = match.teamB;
              const result = match.result;

              const isCompleted = match.status === 'completed' && !!result;
              const isDraw = result?.is_draw ?? false;
              const teamAWon = isCompleted && !isDraw && result?.winner_team_id === teamA?.id;
              const teamBWon = isCompleted && !isDraw && result?.winner_team_id === teamB?.id;

              const gameName = language === 'ar' ? game?.name_ar : game?.name_en;
              const teamAName = language === 'ar' ? teamA?.name_ar : teamA?.name;
              const teamBName = language === 'ar' ? teamB?.name_ar : teamB?.name;

              return (
                <div
                  key={match.id}
                  className={`overflow-hidden rounded-2xl bg-[#12161F] border p-4 transition-all shadow-lg ${
                    isCompleted
                      ? 'border-emerald-500/40 bg-gradient-to-r from-[#12161F] to-emerald-950/20'
                      : match.status === 'in_progress'
                      ? 'border-amber-500/40'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-lg bg-slate-800 text-slate-300">
                        {getStationIcon(game?.icon)}
                      </span>
                      <strong className="text-white text-sm">{gameName}</strong>
                      <span className="text-[10px] font-mono-esports text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-blue-500/15">
                        STATION {game?.station_number}
                      </span>
                    </div>

                    {isCompleted ? (
                      <span className="flex items-center gap-1 font-bold text-emerald-400 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        COMPLETED
                      </span>
                    ) : match.status === 'in_progress' ? (
                      <span className="flex items-center gap-1 font-bold text-amber-400 text-xs">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-slate-500 font-bold text-xs">PENDING</span>
                    )}
                  </div>

                  {/* Competing Teams Banner */}
                  <div className="grid grid-cols-2 gap-3 items-center">
                    {/* Team A */}
                    <div
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        teamAWon
                          ? 'bg-emerald-500/20 border-emerald-500 text-white font-black shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: teamA?.color }}
                        />
                        <span className="font-bold text-sm truncate">{teamAName}</span>
                      </div>
                      {teamAWon && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500 text-slate-950">
                          WINNER
                        </span>
                      )}
                    </div>

                    {/* Team B */}
                    <div
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        teamBWon
                          ? 'bg-emerald-500/20 border-emerald-500 text-white font-black shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: teamB?.color }}
                        />
                        <span className="font-bold text-sm truncate">{teamBName}</span>
                      </div>
                      {teamBWon && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500 text-slate-950">
                          WINNER
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Draw banner */}
                  {isCompleted && isDraw && (
                    <div className="mt-2 text-center text-xs font-bold text-yellow-400 font-mono-esports bg-yellow-500/10 py-1 rounded">
                      🤝 DRAW (0 - 0 PTS)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: OVERALL LEADERBOARD (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-wider m-0">
                Tournament Standings
              </h2>
            </div>
            <span className="text-xs font-mono-esports font-bold text-cyan-400">
              Live Scores
            </span>
          </div>

          <LeaderboardTable leaderboard={leaderboard} compact={true} />
        </div>
      </div>
    </div>
  );
};
