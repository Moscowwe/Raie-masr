import React from 'react';
import type { TournamentMatch } from '../types/tournament';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  Gamepad2,
  Brain,
  Fish,
  Armchair,
  Swords,
  Telescope,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Edit3,
  Lock,
} from 'lucide-react';

interface MatchStationCardProps {
  match: TournamentMatch;
  onCorrectResult?: (match: TournamentMatch) => void;
  showAdminActions?: boolean;
  isLocked?: boolean;
}

export const MatchStationCard: React.FC<MatchStationCardProps> = ({
  match,
  onCorrectResult,
  showAdminActions = false,
  isLocked = false,
}) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const game = match.game;
  const teamA = match.teamA;
  const teamB = match.teamB;
  const result = match.result;

  const gameName = language === 'ar' ? game?.name_ar : game?.name_en;
  const teamAName = language === 'ar' ? teamA?.name_ar : teamA?.name;
  const teamBName = language === 'ar' ? teamB?.name_ar : teamB?.name;

  // Station Icons
  const getGameIcon = (iconName?: string) => {
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

  // Outcome
  const isCompleted = match.status === 'completed' && !!result;
  const isDraw = result?.is_draw ?? false;
  const teamAWon = isCompleted && !isDraw && result?.winner_team_id === teamA?.id;
  const teamBWon = isCompleted && !isDraw && result?.winner_team_id === teamB?.id;

  const getStatusBadge = () => {
    if (isLocked && !isCompleted) {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <Lock className="w-3.5 h-3.5" />
          {language === 'ar' ? 'الجولة مقفلة' : 'Round Locked'}
        </span>
      );
    }
    if (match.status === 'completed') {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/40">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {t('stats_completed')}
        </span>
      );
    }
    if (match.status === 'in_progress') {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/40">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          {t('stats_in_progress')}
        </span>
      );
    }
    if (match.is_ready) {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 glow-green">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {language === 'ar' ? 'جاهز (Ready) ✓' : 'Ready ✓'}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        {language === 'ar' ? 'جاري الشرح ⏳' : 'Briefing ⏳'}
      </span>
    );
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#12161F] border transition-all duration-300 shadow-xl ${
        isCompleted
          ? 'border-emerald-500/40'
          : match.status === 'in_progress'
          ? 'border-amber-500/40'
          : 'border-slate-800'
      }`}
    >
      {/* Top Banner: Station & Game Title */}
      <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
            {getGameIcon(game?.icon)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono-esports font-bold uppercase tracking-widest text-cyan-400">
                STATION {game?.station_number}
              </span>
            </div>
            <h3 className="text-sm md:text-base font-bold text-white m-0 leading-tight">
              {gameName}
            </h3>
          </div>
        </div>

        <div>{getStatusBadge()}</div>
      </div>

      {/* Competing Teams Grid */}
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3 relative">
          {/* VS Center Badge */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-[#0B0E14] border border-slate-700 text-[10px] font-black font-mono-esports text-slate-300 shadow-lg">
            VS
          </div>

          {/* Team A Card */}
          <div
            className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
              teamAWon
                ? 'bg-emerald-500/10 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                : isCompleted && !isDraw
                ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <span
              className="w-3.5 h-3.5 rounded-full mb-2 shadow"
              style={{ backgroundColor: teamA?.color }}
            />
            <span className="text-sm md:text-base font-black text-white line-clamp-1">
              {teamAName}
            </span>
            <span className="text-[10px] font-mono-esports font-bold text-slate-400 mt-0.5">
              {teamA?.code}
            </span>

            {teamAWon && (
              <span className="mt-2 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 glow-green">
                WINNER
              </span>
            )}
          </div>

          {/* Team B Card */}
          <div
            className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
              teamBWon
                ? 'bg-emerald-500/10 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                : isCompleted && !isDraw
                ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <span
              className="w-3.5 h-3.5 rounded-full mb-2 shadow"
              style={{ backgroundColor: teamB?.color }}
            />
            <span className="text-sm md:text-base font-black text-white line-clamp-1">
              {teamBName}
            </span>
            <span className="text-[10px] font-mono-esports font-bold text-slate-400 mt-0.5">
              {teamB?.code}
            </span>

            {teamBWon && (
              <span className="mt-2 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 glow-green">
                WINNER
              </span>
            )}
          </div>
        </div>

        {/* Draw Outcome Banner */}
        {isCompleted && isDraw && (
          <div className="mt-3 py-1.5 px-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
            <span className="text-xs font-black font-mono-esports text-yellow-400 uppercase tracking-widest">
              🤝 {t('draw')} (1 - 1 PTS)
            </span>
          </div>
        )}

        {/* Result Submission Metadata & Audit */}
        {isCompleted && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-cyan-400" />
                {t('submitted_by')}: <strong className="text-slate-200">{result?.submitted_by?.name || 'Operator'}</strong>
              </span>
              <span className="font-mono-esports text-slate-500">
                {result?.submitted_at ? new Date(result.submitted_at).toLocaleTimeString() : ''}
              </span>
            </div>

            {result?.operator_notes && (
              <p className="text-[11px] text-slate-300 italic bg-slate-900/60 p-2 rounded border border-slate-800/80 m-0 mt-1">
                "{result.operator_notes}"
              </p>
            )}

            {result?.is_corrected && (
              <div className="mt-1 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                <div className="flex items-center gap-1 font-bold">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  {t('corrected_badge')}: {result.corrected_by?.name || 'Admin'}
                </div>
                {result.correction_reason && (
                  <div className="text-slate-300 mt-0.5">
                    {result.correction_reason}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Admin Result Override / Correction Action */}
        {showAdminActions && isAdmin && isCompleted && onCorrectResult && (
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <button
              onClick={() => onCorrectResult(match)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {t('correct_result_btn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
