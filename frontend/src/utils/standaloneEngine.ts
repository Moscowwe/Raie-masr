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

const STORAGE_KEY = 'ccc_tournament_state_v1';

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
    name_en: 'Prem Ball',
    name_ar: 'بريم بول',
    description_en: 'Fast-paced ball precision and agility battle',
    description_ar: 'تحدي الدقة والرشاقة والتحكم بالكرة',
    icon: 'circle-dot',
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
    name_en: 'Al-Fartas',
    name_ar: 'الفرطاس',
    description_en: 'Traditional high-stakes speed and reflex showdown',
    description_ar: 'المواجهة التراثية الكبرى للسرعة وسرعة البديهة',
    icon: 'zap',
  },
];

const SCHEDULE_MAP: Record<number, Record<number, [number, number]>> = {
  1: { 1: [1, 6], 2: [2, 7], 3: [8, 3], 4: [9, 4], 5: [10, 5] },
  2: { 1: [2, 6], 2: [7, 3], 3: [4, 8], 4: [5, 9], 5: [10, 1] },
  3: { 1: [3, 6], 2: [4, 7], 3: [8, 5], 4: [1, 9], 5: [10, 2] },
  4: { 1: [4, 6], 2: [7, 5], 3: [8, 1], 4: [9, 2], 5: [10, 3] },
  5: { 1: [1, 2], 2: [3, 4], 3: [6, 5], 4: [8, 7], 5: [10, 9] },
};

export function computeLeaderboard(matches: TournamentMatch[]): LeaderboardEntry[] {
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
    // Win = 1 point, Draw = 0 points, Loss = 0 points
    const total_points = stat.wins * 1;
    return {
      rank: 1,
      team_id: team.id,
      team_name: team.name,
      team_name_ar: team.name_ar,
      team_code: team.code,
      team_color: team.color,
      total_points,
      wins: stat.wins,
      draws: stat.draws,
      losses: stat.losses,
      matches_played: stat.played,
      matches_remaining: Math.max(0, 5 - stat.played),
    };
  });

  // Sort descending by points, then wins
  entries.sort((a, b) => {
    if (b.total_points !== a.total_points) {
      return b.total_points - a.total_points;
    }
    return b.wins - a.wins;
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
    leaderboard: computeLeaderboard(all_matches),
    recent_activities: initialActivities,
    server_time: new Date().toISOString(),
  };
}

export function loadStandaloneSnapshot(): TournamentSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.all_matches && parsed.all_matches.length === 25) {
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
  } catch {
    // ignore
  }
}
