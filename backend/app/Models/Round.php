<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Round extends Model
{
    use HasFactory;

    protected $fillable = [
        'round_number',
        'status', // pending, active, awaiting_results, completed
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'round_number' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function matches(): HasMany
    {
        return $this->hasMany(TournamentMatch::class, 'round_id');
    }

    public function timer(): HasOne
    {
        return $this->hasOne(RoundTimer::class, 'round_id');
    }
}
