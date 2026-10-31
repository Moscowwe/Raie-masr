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
}
