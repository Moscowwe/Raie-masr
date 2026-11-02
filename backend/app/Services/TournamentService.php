<?php

namespace App\Services;

use App\Models\Round;
use App\Models\TournamentMatch;
use App\Models\Game;
use App\Models\Team;
use App\Models\ActivityLog;
use App\Models\TournamentSetting;
use App\Events\RoundCompleted;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class TournamentService
{
    public function __construct(
        protected TimerService $timerService,
        protected LeaderboardService $leaderboardService
    ) {}

    public function getCurrentRoundNumber(): int
    {
        $setting = TournamentSetting::where('key', 'current_round')->first();
        return $setting ? (int)$setting->value : 1;
    }

    public function setCurrentRoundNumber(int $roundNum): void
    {
        TournamentSetting::updateOrCreate(
            ['key' => 'current_round'],
            ['value' => (string)$roundNum]
        );
    }

    public function getActiveRound(): Round
    {
        $currentRoundNum = $this->getCurrentRoundNumber();
        return Round::where('round_number', $currentRoundNum)->firstOrFail();
    }

    /**
     * Complete current round (Admin only).
     * Requires all 5 matches to be completed or cancelled.
     */
    public function completeRound(Round $round, ?string $userName = 'Admin'): Round
    {
        $matches = TournamentMatch::where('round_id', $round->id)->get();

        $unresolvedCount = $matches->whereNotIn('status', ['completed', 'cancelled'])->count();
        if ($unresolvedCount > 0) {
            throw ValidationException::withMessages([
                'round' => "Cannot complete round {$round->round_number}: {$unresolvedCount} match(es) still pending results.",
            ]);
        }

        $now = Carbon::now();
        $round->status = 'completed';
        $round->completed_at = $now;
        $round->save();

        // Expire the timer if still active
        $timer = $this->timerService->getTimerForRound($round);
        if ($timer->status === 'running' || $timer->status === 'paused') {
            $timer->status = 'expired';
            $timer->remaining_seconds = 0;
            $timer->expired_at = $now;
            $timer->save();
        }

        // Determine next round
        $nextRoundNumber = null;
        if ($round->round_number < 5) {
            $nextRoundNumber = $round->round_number + 1;
            $this->setCurrentRoundNumber($nextRoundNumber);
            $nextRound = Round::where('round_number', $nextRoundNumber)->first();
            if ($nextRound && $nextRound->status === 'pending') {
                // Initialize next round timer
                $this->timerService->getTimerForRound($nextRound);
            }
        }

        ActivityLog::create([
            'user_name' => $userName,
            'action' => 'ROUND_COMPLETED',
            'details' => [
                'completed_round' => $round->round_number,
                'next_round' => $nextRoundNumber,
            ],
            'ip_address' => request()->ip(),
        ]);

        event(new RoundCompleted(
            $round->round_number,
            $nextRoundNumber,
            $now->toIso8601String()
        ));

        return $round;
    }

    /**
     * Switch current round (Admin control).
     */
    public function selectRound(int $roundNum, ?string $userName = 'Admin'): Round
    {
        $round = Round::where('round_number', $roundNum)->firstOrFail();

        if ($roundNum > 1) {
            $prevIncomplete = TournamentMatch::whereHas('round', function ($q) use ($roundNum) {
                $q->where('round_number', '<', $roundNum);
            })->where('status', '!=', 'completed')->exists();

            if ($prevIncomplete) {
                throw ValidationException::withMessages([
                    'round' => "Cannot select Round {$roundNum}: Previous rounds must be completed first.",
                ]);
            }
        }

        $this->setCurrentRoundNumber($roundNum);

        ActivityLog::create([
            'user_name' => $userName,
            'action' => 'ROUND_SWITCHED',
            'details' => ['selected_round' => $roundNum],
            'ip_address' => request()->ip(),
        ]);

        return $round;
    }

    /**
     * Get tournament full snapshot for real-time hydration and reconnection.
     */
    public function getFullSnapshot(): array
    {
        $currentRoundNum = $this->getCurrentRoundNumber();
        $activeRound = Round::where('round_number', $currentRoundNum)->first();
        $timer = $activeRound ? $this->timerService->getTimerForRound($activeRound) : null;

        $rounds = Round::orderBy('round_number')->get();
        $games = Game::with('operator')->orderBy('station_number')->get();
        $teams = Team::orderBy('id')->get();

        // All matches with results
        $matches = TournamentMatch::with([
            'game',
            'teamA',
            'teamB',
            'round',
            'result.submittedBy',
            'result.correctedBy',
        ])->get();

        // Tournament Stats
        $totalMatches = $matches->count();
        $completedMatches = $matches->where('status', 'completed')->count();
        $inProgressMatches = $matches->where('status', 'in_progress')->count();
        $pendingMatches = $matches->where('status', 'pending')->count();
        $cancelledMatches = $matches->where('status', 'cancelled')->count();

        // Current round matches
        $currentRoundMatches = $matches->where('round_id', $activeRound?->id)->values();

        $leaderboard = $this->leaderboardService->getLeaderboard();

        $recentActivities = ActivityLog::latest()->take(20)->get();

        return [
            'tournament_name' => 'COMPETITION CONTROL CENTER',
            'tournament_name_ar' => 'مركز التحكم في المنافسات',
            'total_teams' => 10,
            'total_games' => 5,
            'total_rounds' => 5,
            'current_round' => $currentRoundNum,
            'active_round' => $activeRound,
            'timer' => $timer ? [
                'round_id' => $timer->round_id,
                'round_number' => $activeRound->round_number,
                'duration_seconds' => $timer->duration_seconds,
                'remaining_seconds' => $timer->remaining_seconds,
                'status' => $timer->status,
                'started_at' => $timer->started_at?->toIso8601String(),
                'expires_at' => $timer->expires_at?->toIso8601String(),
                'paused_at' => $timer->paused_at?->toIso8601String(),
                'server_timestamp' => (int)(Carbon::now()->timestamp * 1000),
            ] : null,
            'stats' => [
                'total_teams' => 10,
                'total_games' => 5,
                'total_rounds' => 5,
                'total_matches' => $totalMatches,
                'completed_matches' => $completedMatches,
                'in_progress_matches' => $inProgressMatches,
                'pending_matches' => $pendingMatches,
                'cancelled_matches' => $cancelledMatches,
            ],
            'games' => $games,
            'teams' => $teams,
            'rounds' => $rounds,
            'current_round_matches' => $currentRoundMatches,
            'all_matches' => $matches,
            'leaderboard' => $leaderboard,
            'recent_activities' => $recentActivities,
            'server_time' => Carbon::now()->toIso8601String(),
        ];
    }

    /**
     * Reset entire tournament to initial clean state.
     */
    public function resetTournament(?string $userName = 'Admin'): array
    {
        // 1. Delete all match results
        \App\Models\MatchResult::query()->delete();

        // 2. Reset all matches
        TournamentMatch::query()->update([
            'status' => 'pending',
            'is_ready' => false,
            'ready_at' => null,
        ]);

        // 3. Reset all rounds
        Round::query()->update([
            'status' => 'pending',
            'started_at' => null,
            'completed_at' => null,
        ]);
        Round::where('round_number', 1)->update([
            'status' => 'active',
            'started_at' => Carbon::now(),
        ]);

        // 4. Reset round timers
        \App\Models\RoundTimer::query()->update([
            'status' => 'idle',
            'duration_seconds' => 600,
            'remaining_seconds' => 600,
            'started_at' => null,
            'paused_at' => null,
            'resumed_at' => null,
            'expires_at' => null,
            'expired_at' => null,
        ]);

        // 5. Reset setting to Round 1
        $this->setCurrentRoundNumber(1);

        ActivityLog::create([
            'user_name' => $userName,
            'action' => 'TOURNAMENT_RESET',
            'details' => ['message' => 'Full tournament reset executed. All match results, scores, and station winners cleared.'],
            'ip_address' => request()->ip(),
        ]);

        return $this->getFullSnapshot();
    }
}
