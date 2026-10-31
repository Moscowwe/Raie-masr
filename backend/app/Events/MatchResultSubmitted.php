<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MatchResultSubmitted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public array $matchResultData
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('tournament'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'MatchResultSubmitted';
    }
}
