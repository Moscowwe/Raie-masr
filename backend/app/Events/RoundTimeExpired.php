<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RoundTimeExpired implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $roundNumber,
        public string $status, // 'awaiting_results'
        public string $message = 'Round timer has expired. Awaiting official results from operators.'
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('tournament'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'RoundTimeExpired';
    }
}
