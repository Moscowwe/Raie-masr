<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoundTimer extends Model
{
    use HasFactory;

    protected $fillable = [
        'round_id',
        'duration_seconds',
        'remaining_seconds',
        'status', // idle, running, paused, expired
        'started_at',
        'paused_at',
        'resumed_at',
        'expires_at',
        'server_sync_timestamp',
    ];

    protected $casts = [
        'duration_seconds' => 'integer',
        'remaining_seconds' => 'integer',
        'started_at' => 'datetime',
        'paused_at' => 'datetime',
        'resumed_at' => 'datetime',
        'expires_at' => 'datetime',
        'server_sync_timestamp' => 'integer',
    ];

    public function round(): BelongsTo
    {
        return $this->belongsTo(Round::class, 'round_id');
    }
}
