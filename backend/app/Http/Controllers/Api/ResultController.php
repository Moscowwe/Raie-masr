<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\ResultService;
use App\Models\TournamentMatch;
use App\Models\ActivityLog;

class ResultController extends Controller
{
    public function __construct(
        protected ResultService $resultService
    ) {}

    /**
     * Submit match result (Operator or Admin).
     */
    public function submit(Request $request, int $matchId)
    {
        $validated = $request->validate([
            'winner_team_id' => 'nullable|integer|exists:teams,id',
            'is_draw' => 'required|boolean',
            'notes' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $match = TournamentMatch::with(['teamA', 'teamB', 'game', 'round'])->findOrFail($matchId);

        $result = $this->resultService->submitResult(
            $match,
            $user,
            $validated['winner_team_id'] ?? null,
            $validated['is_draw'],
            $validated['notes'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => 'Match result successfully submitted and broadcasted.',
            'result' => $result,
        ]);
    }

    /**
     * Correct an existing result (Admin only).
     */
    public function correct(Request $request, int $matchId)
    {
        $validated = $request->validate([
            'winner_team_id' => 'nullable|integer|exists:teams,id',
            'is_draw' => 'required|boolean',
            'reason' => 'required|string|min:3|max:500',
            'notes' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $match = TournamentMatch::with(['teamA', 'teamB', 'game', 'round', 'result'])->findOrFail($matchId);

        $result = $this->resultService->correctResult(
            $match,
            $user,
            $validated['winner_team_id'] ?? null,
            $validated['is_draw'],
            $validated['reason'],
            $validated['notes'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => 'Match result successfully corrected and broadcasted.',
            'result' => $result,
        ]);
    }

    /**
     * Mark match as cancelled (Admin only).
     */
    public function cancel(Request $request, int $matchId)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $user = $request->user();
        if (!$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized: Admin only.'], 403);
        }

        $match = TournamentMatch::findOrFail($matchId);
        $match->status = 'cancelled';
        $match->save();

        ActivityLog::create([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'action' => 'MATCH_CANCELLED',
            'details' => ['match_id' => $match->id, 'reason' => $validated['reason']],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Match has been marked as cancelled.',
            'match' => $match,
        ]);
    }
}
