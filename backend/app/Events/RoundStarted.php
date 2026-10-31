<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RoundStarted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $roundNumber,
        public int $durationSeconds,
        public int $remainingSeconds,
        public string $startedAt,
        public int $serverTimestamp
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('tournament'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'RoundStarted';
    }
}
