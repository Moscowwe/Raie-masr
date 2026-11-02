import type {
  TournamentSnapshot,
  TournamentMatch,
  Team,
  Game,
  Round,
  RoundTimer,
  LeaderboardEntry,
  ActivityLog,
  TournamentStats,
} from '../types/tournament';

const STORAGE_KEY = 'ccc_tournament_state_v6';

export function isRoundLocked(
  roundNumber: number,
  allMatches: TournamentMatch[]
): boolean {
  if (roundNumber <= 1) return false;
  // Round N is locked ONLY if any match in previous rounds (1 to N-1) is not completed
  return allMatches.some((m) => m.round_id < roundNumber && m.status !== 'completed');
}

export const INITIAL_TEAMS: Team[] = [
  { id: 1, name: 'Team 1', name_ar: 'الفريق 1', code: 'T1', color: '#00D2FF' },
  { id: 2, name: 'Team 2', name_ar: 'الفريق 2', code: 'T2', color: '#3B82F6' },
  { id: 3, name: 'Team 3', name_ar: 'الفريق 3', code: 'T3', color: '#6366F1' },
  { id: 4, name: 'Team 4', name_ar: 'الفريق 4', code: 'T4', color: '#8B5CF6' },
  { id: 5, name: 'Team 5', name_ar: 'الفريق 5', code: 'T5', color: '#EC4899' },
  { id: 6, name: 'Team 6', name_ar: 'الفريق 6', code: 'T6', color: '#EF4444' },
  { id: 7, name: 'Team 7', name_ar: 'الفريق 7', code: 'T7', color: '#F97316' },
  { id: 8, name: 'Team 8', name_ar: 'الفريق 8', code: 'T8', color: '#EAB308' },
  { id: 9, name: 'Team 9', name_ar: 'الفريق 9', code: 'T9', color: '#10B981' },
  { id: 10, name: 'Team 10', name_ar: 'الفريق 10', code: 'T10', color: '#06B6D4' },
];

export const INITIAL_GAMES: Game[] = [
  {
    id: 1,
    station_number: 1,
    name_en: 'Brain Ball',
    name_ar: 'برين بول',
    description_en: 'Fast-paced ball precision, agility, and mental battle',
    description_ar: 'تحدي الدقة والرشاقة والتحكم والتركيز الذهني بالكرة',
    icon: 'brain',
  },
  {
    id: 2,
    station_number: 2,
    name_en: 'Fish Hunters',
    name_ar: 'صيادين السمك',
    description_en: 'Speed and reaction team catching contest',
    description_ar: 'سباق السرعة وردود الأفعال والصيد الجماعي',
    icon: 'fish',
  },
  {
    id: 3,
    station_number: 3,
    name_en: 'Chair & Ball',
    name_ar: 'كرسي و الكرة',
    description_en: 'Strategic balance and tactical possession match',
    description_ar: 'تحدي التوازن الاستراتيجي والاستحواذ التكتيكي',
    icon: 'armchair',
  },
  {
    id: 4,
    station_number: 4,
    name_en: 'Human Collision',
    name_ar: 'التصادم البشري',
    description_en: 'High energy physical clash and ring dominance',
    description_ar: 'مواجهة بدنية عالية الطاقة والسيطرة على الحلبة',
    icon: 'swords',
  },
  {
    id: 5,
    station_number: 5,
    name_en: 'Telescope',
    name_ar: 'تليسكوب',
    description_en: 'High-stakes visual precision, speed, and tactical reflex showdown',
    description_ar: 'المواجهة الكبرى لدقة الرؤية وسرعة البديهة والتركيز العالي',
    icon: 'telescope',
  },
];

const SCHEDULE_MAP: Record<number, Record<number, [number, number]>> = {
  1: { 1: [1, 6], 2: [2, 10], 3: [3, 9], 4: [4, 8], 5: [5, 7] },
  2: { 1: [2, 7], 2: [3, 6], 3: [4, 10], 4: [5, 9], 5: [1, 8] },
  3: { 1: [3, 8], 2: [4, 7], 3: [5, 6], 4: [1, 10], 5: [2, 9] },
  4: { 1: [4, 9], 2: [5, 8], 3: [1, 7], 4: [2, 6], 5: [3, 10] },
  5: { 1: [5, 10], 2: [1, 9], 3: [2, 8], 4: [3, 7], 5: [4, 6] },
};

export function computeLeaderboard(
  matches: TournamentMatch[],
  pointAdjustments: Record<number, number> = {}
): LeaderboardEntry[] {
  const table: Record<number, { wins: number; draws: number; losses: number; played: number }> = {};
  for (const team of INITIAL_TEAMS) {
    table[team.id] = { wins: 0, draws: 0, losses: 0, played: 0 };
  }

  for (const match of matches) {
    if (match.status === 'completed' && match.result) {
      const res = match.result;
      const tA = match.team_a_id;
      const tB = match.team_b_id;

      table[tA].played += 1;
      table[tB].played += 1;

      if (res.is_draw) {
        table[tA].draws += 1;
        table[tB].draws += 1;
      } else if (res.winner_team_id === tA) {
        table[tA].wins += 1;
        table[tB].losses += 1;
      } else if (res.winner_team_id === tB) {
        table[tB].wins += 1;
        table[tA].losses += 1;
      }
    }
  }

  const entries: LeaderboardEntry[] = INITIAL_TEAMS.map((team) => {
    const stat = table[team.id];
    // Win = 3 points, Draw = 1 point, Loss = 0 points
    const match_points = (stat.wins * 3) + (stat.draws * 1);
    const bonus_points = pointAdjustments[team.id] || 0;
    const total_points = match_points + bonus_points;

    return {
      rank: 1,
      team_id: team.id,
      team_name: team.name,
      team_name_ar: team.name_ar,
      team_code: team.code,
      team_color: team.color,
      total_points,
      match_points,
      bonus_points,
      wins: stat.wins,
      draws: stat.draws,
      losses: stat.losses,
      matches_played: stat.played,
      matches_remaining: Math.max(0, 5 - stat.played),
    };
  });

  // Sort descending by total_points, then wins, then draws
  entries.sort((a, b) => {
    if (b.total_points !== a.total_points) {
      return b.total_points - a.total_points;
    }
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    return b.draws - a.draws;
  });

  return entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

export function computeStats(matches: TournamentMatch[]): TournamentStats {
  const completed = matches.filter((m) => m.status === 'completed').length;
  const in_progress = matches.filter((m) => m.status === 'in_progress').length;
  const pending = matches.filter((m) => m.status === 'pending').length;

  return {
    total_teams: 10,
    total_games: 5,
    total_rounds: 5,
    total_matches: 25,
    completed_matches: completed,
    in_progress_matches: in_progress,
    pending_matches: pending,
    cancelled_matches: 0,
  };
}

export function createInitialSnapshot(): TournamentSnapshot {
  const rounds: Round[] = [1, 2, 3, 4, 5].map((num) => ({
    id: num,
    round_number: num,
    status: num === 1 ? 'active' : 'pending',
    started_at: num === 1 ? new Date().toISOString() : null,
    completed_at: null,
  }));

  const all_matches: TournamentMatch[] = [];
  let matchCounter = 1;

  for (let r = 1; r <= 5; r++) {
    const roundObj = rounds.find((rd) => rd.round_number === r)!;
    for (let g = 1; g <= 5; g++) {
      const [tA, tB] = SCHEDULE_MAP[r][g];
      const gameObj = INITIAL_GAMES.find((gm) => gm.id === g)!;
      const teamA = INITIAL_TEAMS.find((tm) => tm.id === tA)!;
      const teamB = INITIAL_TEAMS.find((tm) => tm.id === tB)!;

      all_matches.push({
        id: matchCounter++,
        round_id: roundObj.id,
        game_id: gameObj.id,
        team_a_id: tA,
        team_b_id: tB,
        status: 'pending',
        is_ready: false,
        ready_at: null,
        round: roundObj,
        game: gameObj,
        teamA,
        teamB,
        result: null,
      });
    }
  }

  const initialTimer: RoundTimer = {
    round_id: 1,
    round_number: 1,
    duration_seconds: 600,
    remaining_seconds: 600,
    status: 'idle',
    started_at: null,
    expires_at: null,
    paused_at: null,
    server_timestamp: Date.now(),
  };

  const initialActivities: ActivityLog[] = [
    {
      id: 1,
      user_name: 'System',
      action: 'TOURNAMENT_INITIALIZED',
      details: 'Competition Control Center running in high-availability Cloud Standalone Mode with Supabase Realtime.',
      created_at: new Date().toISOString(),
    },
  ];

  const currentRoundMatches = all_matches.filter((m) => m.round_id === 1);

  return {
    tournament_name: 'COMPETITION CONTROL CENTER',
    tournament_name_ar: 'مركز التحكم في المنافسات',
    total_teams: 10,
    total_games: 5,
    total_rounds: 5,
    current_round: 1,
    active_round: rounds[0],
    timer: initialTimer,
    stats: computeStats(all_matches),
    games: INITIAL_GAMES,
    teams: INITIAL_TEAMS,
    rounds,
    current_round_matches: currentRoundMatches,
    all_matches,
    leaderboard: computeLeaderboard(all_matches, {}),
    recent_activities: initialActivities,
    point_adjustments: {},
    server_time: new Date().toISOString(),
  };
}

export function loadStandaloneSnapshot(): TournamentSnapshot {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Check for older cached versions to migrate
      for (const oldKey of ['ccc_tournament_state_v5', 'ccc_tournament_state_v4', 'ccc_tournament_state_v3', 'ccc_tournament_state_v2', 'ccc_tournament_state_v1']) {
        const oldRaw = localStorage.getItem(oldKey);
        if (oldRaw) {
          raw = oldRaw;
          break;
        }
      }
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.all_matches && parsed.all_matches.length === 25) {
        // Ensure updated game definitions for Brain Ball and Telescope
        parsed.games = INITIAL_GAMES;
        parsed.all_matches = parsed.all_matches.map((m: TournamentMatch) => {
          const freshGame = INITIAL_GAMES.find((g) => g.id === m.game_id);
          return freshGame ? { ...m, game: freshGame } : m;
        });
        parsed.point_adjustments = parsed.point_adjustments || {};
        // Recompute leaderboard with updated 3-1-0 scoring and bonus points
        parsed.leaderboard = computeLeaderboard(parsed.all_matches, parsed.point_adjustments);
        parsed.current_round_matches = parsed.all_matches.filter((m: TournamentMatch) => m.round_id === parsed.current_round);
        saveStandaloneSnapshot(parsed);
        return parsed;
      }
    }
  } catch {
    // fallback to initial
  }
  const fresh = createInitialSnapshot();
  saveStandaloneSnapshot(fresh);
  return fresh;
}

export function saveStandaloneSnapshot(snapshot: TournamentSnapshot): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    // Purge legacy storage keys so they never resurrect old completed matches
    for (const oldKey of ['ccc_tournament_state_v5', 'ccc_tournament_state_v4', 'ccc_tournament_state_v3', 'ccc_tournament_state_v2', 'ccc_tournament_state_v1']) {
      localStorage.removeItem(oldKey);
    }
  } catch {
    // ignore
  }
}
