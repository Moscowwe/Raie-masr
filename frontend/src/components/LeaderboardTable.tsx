import React from 'react';
import type { LeaderboardEntry } from '../types/tournament';
import { useLanguage } from '../context/LanguageContext';
import { Trophy, Medal, Award, SlidersHorizontal } from 'lucide-react';

interface LeaderboardTableProps {
  leaderboard: LeaderboardEntry[];
  compact?: boolean;
  onAdjustPoints?: (teamId: number, teamDisplayName: string) => void;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  leaderboard,
  compact = false,
  onAdjustPoints,
}) => {
  const { t, language } = useLanguage();

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/50 font-bold text-xs glow-orange">
            <Trophy className="w-3.5 h-3.5 fill-amber-400" />
          </span>
        );
      case 2:
        return (
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-300/20 text-slate-200 border border-slate-300/50 font-bold text-xs">
            <Medal className="w-3.5 h-3.5 fill-slate-300" />
          </span>
        );
      case 3:
        return (
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-700/25 text-amber-600 border border-amber-700/40 font-bold text-xs">
            <Award className="w-3.5 h-3.5 fill-amber-600" />
          </span>
        );
      default:
        return (
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 text-slate-400 font-mono-esports font-bold text-xs">
            #{rank}
          </span>
        );
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-[#12161F] border border-slate-800 shadow-xl">
      <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm md:text-base font-black uppercase tracking-wider text-white m-0">
            {t('leaderboard_title')}
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 uppercase tracking-widest hidden sm:inline">
          {t('scoring_rule_notice')}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-900/60 text-slate-400 text-[11px] uppercase tracking-wider font-bold border-b border-slate-800">
              <th className="py-3 px-4 text-center w-14">{t('rank')}</th>
              <th className="py-3 px-4">{t('team')}</th>
              <th className="py-3 px-4 text-center font-bold text-cyan-400">{t('points')}</th>
              <th className="py-3 px-3 text-center">{t('wins_short')}</th>
              <th className="py-3 px-3 text-center">{t('draws_short')}</th>
              <th className="py-3 px-3 text-center">{t('losses_short')}</th>
              <th className="py-3 px-3 text-center">{t('played_short')}</th>
              {!compact && <th className="py-3 px-3 text-center hidden md:table-cell">{t('remaining_short')}</th>}
              {onAdjustPoints && <th className="py-3 px-3 text-center w-20">{language === 'ar' ? 'تعديل' : 'Adjust'}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {leaderboard.map((entry) => {
              const teamDisplayName = language === 'ar' ? entry.team_name_ar : entry.team_name;
              const isFirst = entry.rank === 1;
              const bonus = entry.bonus_points ?? 0;

              return (
                <tr
                  key={entry.team_id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    isFirst ? 'bg-amber-500/5' : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center">{getRankBadge(entry.rank)}</div>
                  </td>

                  {/* Team */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: entry.team_color }}
                      />
                      <span className="font-bold text-white text-sm md:text-base">
                        {teamDisplayName}
                      </span>
                      <span className="text-[10px] font-mono-esports font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {entry.team_code}
                      </span>
                    </div>
                  </td>

                  {/* Points */}
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/15 border border-cyan-500/30 font-mono-esports font-black text-cyan-300 text-base md:text-lg">
                      <span>{entry.total_points}</span>
                      {bonus !== 0 && (
                        <span
                          className={`text-[10px] px-1 py-0.2 rounded font-bold ${
                            bonus > 0 ? 'text-emerald-400 bg-emerald-500/20' : 'text-rose-400 bg-rose-500/20'
                          }`}
                          title={language === 'ar' ? `نقاط معدلة يدوياً: ${bonus > 0 ? `+${bonus}` : bonus}` : `Adjusted bonus: ${bonus > 0 ? `+${bonus}` : bonus}`}
                        >
                          {bonus > 0 ? `+${bonus}` : bonus}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* W / D / L */}
                  <td className="py-3 px-3 text-center font-mono-esports font-bold text-emerald-400">
                    {entry.wins}
                  </td>
                  <td className="py-3 px-3 text-center font-mono-esports font-medium text-slate-300">
                    {entry.draws}
                  </td>
                  <td className="py-3 px-3 text-center font-mono-esports font-medium text-slate-500">
                    {entry.losses}
                  </td>

                  {/* Played */}
                  <td className="py-3 px-3 text-center font-mono-esports text-slate-400">
                    {entry.matches_played}/5
                  </td>

                  {/* Remaining */}
                  {!compact && (
                    <td className="py-3 px-3 text-center font-mono-esports text-slate-500 hidden md:table-cell">
                      {entry.matches_remaining}
                    </td>
                  )}

                  {/* Manual Points Adjustment Button */}
                  {onAdjustPoints && (
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onAdjustPoints(entry.team_id, teamDisplayName)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500/20 border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-[11px] font-bold transition-all cursor-pointer"
                        title={language === 'ar' ? `إضافة أو خصم نقاط لفريق ${teamDisplayName}` : `Adjust points for ${teamDisplayName}`}
                      >
                        <SlidersHorizontal className="w-3 h-3" />
                        <span className="hidden sm:inline">{language === 'ar' ? 'تعديل' : '+/-'}</span>
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

