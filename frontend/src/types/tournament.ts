export interface Team {
  id: number;
  name: string;
  name_ar: string;
  code: string;
  color: string;
  logo?: string;
}

export interface Game {
  id: number;
  station_number: number;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  icon: string;
  operator?: User;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'operator';
  game_id?: number | null;
  game?: Game | null;
}

export interface Round {
  id: number;
  round_number: number;
  status: 'pending' | 'active' | 'awaiting_results' | 'completed';
  started_at?: string | null;
  completed_at?: string | null;
}

export interface MatchResult {
  id: number;
  match_id: number;
  winner_team_id: number | null;
  is_draw: boolean;
  submitted_by?: {
    id: number;
    name: string;
  } | null;
  submitted_at: string;
  operator_notes?: string | null;
  is_corrected: boolean;
  corrected_by?: {
    id: number;
    name: string;
  } | null;
  corrected_at?: string | null;
  previous_winner_team_id?: number | null;
  previous_is_draw?: boolean | null;
  correction_reason?: string | null;
}

export interface TournamentMatch {
  id: number;
  round_id: number;
  game_id: number;
  team_a_id: number;
  team_b_id: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  is_ready?: boolean;
  ready_at?: string | null;
  round?: Round;
  game?: Game;
  teamA?: Team;
  teamB?: Team;
  result?: MatchResult | null;
}

export interface RoundTimer {
  round_id: number;
  round_number: number;
  duration_seconds: number;
  remaining_seconds: number;
  status: 'idle' | 'running' | 'paused' | 'expired';
  started_at?: string | null;
  expires_at?: string | null;
  paused_at?: string | null;
  server_timestamp: number;
}

export interface LeaderboardEntry {
  rank: number;
  team_id: number;
  team_name: string;
  team_name_ar: string;
  team_code: string;
  team_color: string;
  total_points: number;
  match_points?: number;
  bonus_points?: number;
  wins: number;
  draws: number;
  losses: number;
  matches_played: number;
  matches_remaining: number;
}

export interface ActivityLog {
  id: number;
  user_id?: number | null;
  user_name: string;
  action: string;
  details?: any;
  created_at: string;
}

export interface TournamentStats {
  total_teams: number;
  total_games: number;
  total_rounds: number;
  total_matches: number;
  completed_matches: number;
  in_progress_matches: number;
  pending_matches: number;
  cancelled_matches: number;
}

export interface TournamentSnapshot {
  tournament_name: string;
  tournament_name_ar: string;
  total_teams: number;
  total_games: number;
  total_rounds: number;
  current_round: number;
  active_round: Round | null;
  timer: RoundTimer | null;
  stats: TournamentStats;
  games: Game[];
  teams: Team[];
  rounds: Round[];
  current_round_matches: TournamentMatch[];
  all_matches: TournamentMatch[];
  leaderboard: LeaderboardEntry[];
  recent_activities: ActivityLog[];
  point_adjustments?: Record<number, number>;
  server_time: string;
}
