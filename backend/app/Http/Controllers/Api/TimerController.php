<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\TimerService;
use App\Services\TournamentService;
use App\Models\Round;

class TimerController extends Controller
{
    public function __construct(
        protected TimerService $timerService,
        protected TournamentService $tournamentService
    ) {}

    public function status(Request $request)
    {
        $activeRound = $this->tournamentService->getActiveRound();
        $timer = $this->timerService->getTimerForRound($activeRound);

        return response()->json([
            'success' => true,
            'timer' => [
                'round_number' => $activeRound->round_number,
                'round_status' => $activeRound->status,
                'duration_seconds' => $timer->duration_seconds,
                'remaining_seconds' => $timer->remaining_seconds,
                'status' => $timer->status,
                'started_at' => $timer->started_at?->toIso8601String(),
                'expires_at' => $timer->expires_at?->toIso8601String(),
                'paused_at' => $timer->paused_at?->toIso8601String(),
                'server_timestamp' => (int)(now()->timestamp * 1000),
            ],
        ]);
    }

    public function setDuration(Request $request)
    {
        $validated = $request->validate([
            'duration_seconds' => 'required|integer|min:10|max:7200',
        ]);

        $user = $request->user();
        $activeRound = $this->tournamentService->getActiveRound();
        $timer = $this->timerService->setDuration($activeRound, $validated['duration_seconds'], $user->name);

        return response()->json([
            'success' => true,
            'message' => 'Timer duration updated successfully.',
            'timer' => $timer,
        ]);
    }

    public function start(Request $request)
    {
        $user = $request->user();
        $activeRound = $this->tournamentService->getActiveRound();
        $timer = $this->timerService->startRound($activeRound, $user->name);

        return response()->json([
            'success' => true,
            'message' => 'Round and central timer started.',
            'timer' => $timer,
        ]);
    }

    public function pause(Request $request)
    {
        $user = $request->user();
        $activeRound = $this->tournamentService->getActiveRound();
        $timer = $this->timerService->pauseRound($activeRound, $user->name);

        return response()->json([
            'success' => true,
            'message' => 'Round timer paused.',
            'timer' => $timer,
        ]);
    }

    public function resume(Request $request)
    {
        $user = $request->user();
        $activeRound = $this->tournamentService->getActiveRound();
        $timer = $this->timerService->resumeRound($activeRound, $user->name);

        return response()->json([
            'success' => true,
            'message' => 'Round timer resumed.',
            'timer' => $timer,
        ]);
    }

    public function expire(Request $request)
    {
        $user = $request->user();
        $activeRound = $this->tournamentService->getActiveRound();
        $timer = $this->timerService->expireRound($activeRound, $user->name);

        return response()->json([
            'success' => true,
            'message' => 'Round timer expired.',
            'timer' => $timer,
        ]);
    }

    public function reset(Request $request)
    {
        $user = $request->user();
        $activeRound = $this->tournamentService->getActiveRound();
        $timer = $this->timerService->resetTimer($activeRound, $user->name);

        return response()->json([
            'success' => true,
            'message' => 'Round timer reset.',
            'timer' => $timer,
        ]);
    }
}
