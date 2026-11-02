<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\TournamentService;
use App\Services\LeaderboardService;
use App\Models\Round;
use App\Models\Team;
use App\Models\Game;

class TournamentController extends Controller
{
    public function __construct(
        protected TournamentService $tournamentService,
        protected LeaderboardService $leaderboardService
    ) {}

    /**
     * Get live full tournament snapshot for all viewers, admin, and operators.
     */
    public function snapshot()
    {
        $data = $this->tournamentService->getFullSnapshot();
        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get real-time leaderboard.
     */
    public function leaderboard()
    {
        $leaderboard = $this->leaderboardService->getLeaderboard();
        return response()->json([
            'success' => true,
            'leaderboard' => $leaderboard,
        ]);
    }

    /**
     * Select current round (Admin only).
     */
    public function selectRound(Request $request, int $roundNumber)
    {
        $user = $request->user();
        $round = $this->tournamentService->selectRound($roundNumber, $user->name);

        return response()->json([
            'success' => true,
            'message' => "Round {$roundNumber} selected.",
            'round' => $round,
            'snapshot' => $this->tournamentService->getFullSnapshot(),
        ]);
    }

    /**
     * Approve round completion (Admin only).
     */
    public function completeRound(Request $request, int $roundNumber)
    {
        $user = $request->user();
        $round = Round::where('round_number', $roundNumber)->firstOrFail();
        $completedRound = $this->tournamentService->completeRound($round, $user->name);

        return response()->json([
            'success' => true,
            'message' => "Round {$roundNumber} marked as completed.",
            'round' => $completedRound,
            'snapshot' => $this->tournamentService->getFullSnapshot(),
        ]);
    }

    /**
     * Toggle station readiness before round starts (Operator or Admin).
     */
    public function toggleReady(Request $request, int $matchId)
    {
        $user = $request->user();
        $match = \App\Models\TournamentMatch::with(['game', 'round'])->findOrFail($matchId);

        // If operator, can only toggle match for their assigned game
        if ($user->role === 'operator' && $user->game_id && $match->game_id !== $user->game_id) {
            return response()->json([
                'success' => false,
                'message' => 'You are only authorized to confirm readiness for your assigned station.',
            ], 403);
        }

        $isReady = $request->has('is_ready') ? (bool)$request->input('is_ready') : !$match->is_ready;
        $match->is_ready = $isReady;
        $match->ready_at = $isReady ? now() : null;
        $match->save();

        \App\Models\ActivityLog::create([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'action' => $isReady ? 'STATION_READY_CONFIRMED' : 'STATION_BRIEFING_EXTENDED',
            'details' => [
                'match_id' => $match->id,
                'round_number' => $match->round?->round_number,
                'station_number' => $match->game?->station_number,
                'game_name' => $match->game?->name_en,
                'is_ready' => $isReady,
            ],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => $isReady ? 'Station marked as Ready.' : 'Station marked as Briefing.',
            'match' => $match,
        ]);
    }
}

