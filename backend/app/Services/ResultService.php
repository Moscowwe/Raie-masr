<?php

namespace App\Services;

use App\Models\TournamentMatch;
use App\Models\MatchResult;
use App\Models\User;
use App\Models\ActivityLog;
use App\Events\MatchResultSubmitted;
use App\Events\MatchResultUpdated;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class ResultService
{
    public function __construct(
        protected LeaderboardService $leaderboardService
    ) {}

    /**
     * Submit match result (Operator or Admin).
     */
    public function submitResult(
        TournamentMatch $match,
        User $user,
        ?int $winnerTeamId,
        bool $isDraw,
        ?string $notes = null
    ): MatchResult {
        // Validation 1: Operator can only submit for their assigned game station
        if ($user->isOperator() && $user->game_id !== $match->game_id) {
            throw ValidationException::withMessages([
                'game_id' => 'Unauthorized: You can only submit results for your assigned game station.',
            ]);
        }

        // Validation 2: Check if result already exists and operator is trying to edit
        if ($match->result && $user->isOperator()) {
            throw ValidationException::withMessages([
                'match_id' => 'Result has already been submitted for this match. Only the Administrator can correct submitted results.',
            ]);
        }

        // Validation 3: Ensure winner is one of the competing teams (unless it is a draw)
        if ($isDraw) {
            $winnerTeamId = null;
        } else {
            if (!$winnerTeamId || !in_array($winnerTeamId, [$match->team_a_id, $match->team_b_id])) {
                throw ValidationException::withMessages([
                    'winner_team_id' => 'Invalid winner team: Must be either Team A or Team B.',
                ]);
            }
        }

        $now = Carbon::now();

        // Save result
        $result = MatchResult::updateOrCreate(
            ['match_id' => $match->id],
            [
                'winner_team_id' => $winnerTeamId,
                'is_draw' => $isDraw,
                'submitted_by_user_id' => $user->id,
                'operator_notes' => $notes,
                'submitted_at' => $now,
            ]
        );

        // Mark match as completed
        $match->status = 'completed';
        $match->save();

        // Audit log
        $winnerName = $isDraw ? 'DRAW' : ($winnerTeamId == $match->team_a_id ? $match->teamA->name : $match->teamB->name);
        ActivityLog::create([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'action' => 'MATCH_RESULT_SUBMITTED',
            'details' => [
                'match_id' => $match->id,
                'game_name' => $match->game->name_en,
                'round_number' => $match->round->round_number,
                'team_a' => $match->teamA->name,
                'team_b' => $match->teamB->name,
                'outcome' => $winnerName,
                'notes' => $notes,
            ],
            'ip_address' => request()->ip(),
        ]);

        $matchResultPayload = $this->formatMatchPayload($match, $result);

        // Broadcast MatchResultSubmitted
        event(new MatchResultSubmitted($matchResultPayload));

        // Immediately update and broadcast leaderboard
        $this->leaderboardService->broadcastLeaderboard();

        return $result;
    }

    /**
     * Admin Correction of an existing result.
     */
    public function correctResult(
        TournamentMatch $match,
        User $adminUser,
        ?int $newWinnerTeamId,
        bool $isDraw,
        string $correctionReason,
        ?string $notes = null
    ): MatchResult {
        if (!$adminUser->isAdmin()) {
            throw ValidationException::withMessages([
                'auth' => 'Only the tournament administrator can correct submitted results.',
            ]);
        }

        $result = $match->result;
        if (!$result) {
            throw ValidationException::withMessages([
                'result' => 'Cannot correct a match that does not have a submitted result.',
            ]);
        }

        if ($isDraw) {
            $newWinnerTeamId = null;
        } else {
            if (!$newWinnerTeamId || !in_array($newWinnerTeamId, [$match->team_a_id, $match->team_b_id])) {
                throw ValidationException::withMessages([
                    'winner_team_id' => 'Invalid winner team: Must be either Team A or Team B.',
                ]);
            }
        }

        $now = Carbon::now();

        // Keep previous values for audit trail
        $result->previous_winner_team_id = $result->winner_team_id;
        $result->previous_is_draw = $result->is_draw;
        $result->winner_team_id = $newWinnerTeamId;
        $result->is_draw = $isDraw;
        $result->is_corrected = true;
        $result->corrected_by_user_id = $adminUser->id;
        $result->corrected_at = $now;
        $result->correction_reason = $correctionReason;
        if ($notes !== null) {
            $result->operator_notes = $notes;
        }
        $result->save();

        // Audit log
        ActivityLog::create([
            'user_id' => $adminUser->id,
            'user_name' => $adminUser->name,
            'action' => 'MATCH_RESULT_CORRECTED',
            'details' => [
                'match_id' => $match->id,
                'game_name' => $match->game->name_en,
                'round_number' => $match->round->round_number,
                'previous_outcome' => $result->previous_is_draw ? 'DRAW' : "Winner: {$result->previous_winner_team_id}",
                'new_outcome' => $isDraw ? 'DRAW' : "Winner: {$newWinnerTeamId}",
                'reason' => $correctionReason,
            ],
            'ip_address' => request()->ip(),
        ]);

        $matchResultPayload = $this->formatMatchPayload($match, $result);

        // Broadcast MatchResultUpdated
        event(new MatchResultUpdated($matchResultPayload));

        // Immediately recalculate and broadcast leaderboard
        $this->leaderboardService->broadcastLeaderboard();

        return $result;
    }

    public function formatMatchPayload(TournamentMatch $match, MatchResult $result): array
    {
        $match->loadMissing(['game', 'teamA', 'teamB', 'round', 'result.submittedBy', 'result.correctedBy']);

        return [
            'match_id' => $match->id,
            'round_id' => $match->round_id,
            'round_number' => $match->round->round_number,
            'game_id' => $match->game_id,
            'game_name_en' => $match->game->name_en,
            'game_name_ar' => $match->game->name_ar,
            'station_number' => $match->game->station_number,
            'team_a' => [
                'id' => $match->teamA->id,
                'name' => $match->teamA->name,
                'name_ar' => $match->teamA->name_ar,
                'code' => $match->teamA->code,
                'color' => $match->teamA->color,
            ],
            'team_b' => [
                'id' => $match->teamB->id,
                'name' => $match->teamB->name,
                'name_ar' => $match->teamB->name_ar,
                'code' => $match->teamB->code,
                'color' => $match->teamB->color,
            ],
            'status' => $match->status,
            'result' => [
                'id' => $result->id,
                'winner_team_id' => $result->winner_team_id,
                'is_draw' => $result->is_draw,
                'submitted_by' => $result->submittedBy ? [
                    'id' => $result->submittedBy->id,
                    'name' => $result->submittedBy->name,
                ] : null,
                'submitted_at' => $result->submitted_at ? $result->submitted_at->toIso8601String() : null,
                'notes' => $result->operator_notes,
                'is_corrected' => $result->is_corrected,
                'corrected_by' => $result->correctedBy ? [
                    'id' => $result->correctedBy->id,
                    'name' => $result->correctedBy->name,
                ] : null,
                'corrected_at' => $result->corrected_at ? $result->corrected_at->toIso8601String() : null,
                'correction_reason' => $result->correction_reason,
            ],
        ];
    }
}
