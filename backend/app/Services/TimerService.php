<?php

namespace App\Services;

use App\Models\Round;
use App\Models\RoundTimer;
use App\Models\TournamentMatch;
use App\Models\ActivityLog;
use App\Events\RoundStarted;
use App\Events\RoundPaused;
use App\Events\RoundResumed;
use App\Events\RoundTimeExpired;
use Carbon\Carbon;

class TimerService
{
    /**
     * Get or initialize the timer for a given round.
     */
    public function getTimerForRound(Round $round): RoundTimer
    {
        $timer = RoundTimer::firstOrCreate(
            ['round_id' => $round->id],
            [
                'duration_seconds' => 600,
                'remaining_seconds' => 600,
                'status' => 'idle',
            ]
        );

        // Check dynamic expiry if running
        if ($timer->status === 'running' && $timer->expires_at) {
            $now = Carbon::now();
            $expiresAt = Carbon::parse($timer->expires_at);
            if ($now->greaterThanOrEqualTo($expiresAt)) {
                $timer->status = 'expired';
                $timer->remaining_seconds = 0;
                $timer->expired_at = $now;
                $timer->save();

                if ($round->status === 'active') {
                    $round->status = 'awaiting_results';
                    $round->save();
                }

                event(new RoundTimeExpired(
                    $round->round_number,
                    'awaiting_results',
                    'Round timer has expired. Awaiting official results from operators.'
                ));
            } else {
                $diff = $now->diffInSeconds($expiresAt, false);
                $timer->remaining_seconds = max(0, (int)$diff);
                $timer->save();
            }
        }

        return $timer;
    }

    /**
     * Admin set timer duration in seconds.
     */
    public function setDuration(Round $round, int $durationSeconds, ?string $userName = 'Admin'): RoundTimer
    {
        $timer = $this->getTimerForRound($round);

        // If running, adjust expires_at
        if ($timer->status === 'running') {
            $elapsed = $timer->duration_seconds - $timer->remaining_seconds;
            $newRemaining = max(0, $durationSeconds - $elapsed);
            $timer->duration_seconds = $durationSeconds;
            $timer->remaining_seconds = $newRemaining;
            $timer->expires_at = Carbon::now()->addSeconds($newRemaining);
        } else {
            $timer->duration_seconds = $durationSeconds;
            $timer->remaining_seconds = $durationSeconds;
        }

        $timer->save();

        ActivityLog::create([
            'user_name' => $userName,
            'action' => 'TIMER_DURATION_UPDATED',
            'details' => [
                'round_number' => $round->round_number,
                'duration_seconds' => $durationSeconds,
            ],
            'ip_address' => request()->ip(),
        ]);

        return $timer;
    }

    /**
     * Start the round and central countdown timer.
     * All 5 games start simultaneously.
     */
    public function startRound(Round $round, ?string $userName = 'Admin'): RoundTimer
    {
        $timer = $this->getTimerForRound($round);
        $now = Carbon::now();

        // Calculate expires_at
        $expiresAt = $now->copy()->addSeconds($timer->remaining_seconds);

        $timer->status = 'running';
        $timer->started_at = $timer->started_at ?? $now;
        $timer->resumed_at = $now;
        $timer->expires_at = $expiresAt;
        $timer->server_sync_timestamp = (int)($now->timestamp * 1000);
        $timer->save();

        // Update round status
        $round->status = 'active';
        $round->started_at = $round->started_at ?? $now;
        $round->save();

        // Update all pending matches in this round to in_progress
        TournamentMatch::where('round_id', $round->id)
            ->where('status', 'pending')
            ->update(['status' => 'in_progress']);

        ActivityLog::create([
            'user_name' => $userName,
            'action' => 'ROUND_STARTED',
            'details' => [
                'round_number' => $round->round_number,
                'duration_seconds' => $timer->duration_seconds,
                'remaining_seconds' => $timer->remaining_seconds,
            ],
            'ip_address' => request()->ip(),
        ]);

        // Broadcast RoundStarted
        event(new RoundStarted(
            $round->round_number,
            $timer->duration_seconds,
            $timer->remaining_seconds,
            $now->toIso8601String(),
            (int)($now->timestamp * 1000)
        ));

        return $timer;
    }

    /**
     * Pause the round timer.
     */
    public function pauseRound(Round $round, ?string $userName = 'Admin'): RoundTimer
    {
        $timer = $this->getTimerForRound($round);
        $now = Carbon::now();

        if ($timer->status === 'running' && $timer->expires_at) {
            $diff = $now->diffInSeconds(Carbon::parse($timer->expires_at), false);
            $timer->remaining_seconds = max(0, (int)$diff);
            $timer->paused_at = $now;
            $timer->status = 'paused';
            $timer->server_sync_timestamp = (int)($now->timestamp * 1000);
            $timer->save();

            ActivityLog::create([
                'user_name' => $userName,
                'action' => 'ROUND_PAUSED',
                'details' => [
                    'round_number' => $round->round_number,
                    'remaining_seconds' => $timer->remaining_seconds,
                ],
                'ip_address' => request()->ip(),
            ]);

            event(new RoundPaused(
                $round->round_number,
                $timer->remaining_seconds,
                (int)($now->timestamp * 1000)
            ));
        }

        return $timer;
    }

    /**
     * Resume the paused round timer.
     */
    public function resumeRound(Round $round, ?string $userName = 'Admin'): RoundTimer
    {
        $timer = $this->getTimerForRound($round);
        $now = Carbon::now();

        if ($timer->status === 'paused') {
            $expiresAt = $now->copy()->addSeconds($timer->remaining_seconds);
            $timer->status = 'running';
            $timer->resumed_at = $now;
            $timer->expires_at = $expiresAt;
            $timer->server_sync_timestamp = (int)($now->timestamp * 1000);
            $timer->save();

            ActivityLog::create([
                'user_name' => $userName,
                'action' => 'ROUND_RESUMED',
                'details' => [
                    'round_number' => $round->round_number,
                    'remaining_seconds' => $timer->remaining_seconds,
                ],
                'ip_address' => request()->ip(),
            ]);

            event(new RoundResumed(
                $round->round_number,
                $timer->remaining_seconds,
                (int)($now->timestamp * 1000)
            ));
        }

        return $timer;
    }

    /**
     * End round timer early or mark expired (timer only, does NOT auto submit results).
     */
    public function expireRound(Round $round, ?string $userName = 'Admin'): RoundTimer
    {
        $timer = $this->getTimerForRound($round);
        $now = Carbon::now();

        $timer->status = 'expired';
        $timer->remaining_seconds = 0;
        $timer->expired_at = $now;
        $timer->save();

        if ($round->status === 'active') {
            $round->status = 'awaiting_results';
            $round->save();
        }

        ActivityLog::create([
            'user_name' => $userName,
            'action' => 'ROUND_TIMER_EXPIRED',
            'details' => [
                'round_number' => $round->round_number,
            ],
            'ip_address' => request()->ip(),
        ]);

        event(new RoundTimeExpired(
            $round->round_number,
            'awaiting_results',
            'Round timer has been concluded. Awaiting official results from operators.'
        ));

        return $timer;
    }

    /**
     * Reset round timer to initial duration.
     */
    public function resetTimer(Round $round, ?string $userName = 'Admin'): RoundTimer
    {
        $timer = $this->getTimerForRound($round);

        $timer->status = 'idle';
        $timer->remaining_seconds = $timer->duration_seconds;
        $timer->started_at = null;
        $timer->paused_at = null;
        $timer->resumed_at = null;
        $timer->expires_at = null;
        $timer->expired_at = null;
        $timer->save();

        $round->status = 'pending';
        $round->save();

        ActivityLog::create([
            'user_name' => $userName,
            'action' => 'ROUND_TIMER_RESET',
            'details' => [
                'round_number' => $round->round_number,
                'duration_seconds' => $timer->duration_seconds,
            ],
            'ip_address' => request()->ip(),
        ]);

        return $timer;
    }
}
