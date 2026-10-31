<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MatchResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'match_id',
        'winner_team_id',
        'is_draw',
        'submitted_by_user_id',
        'operator_notes',
        'submitted_at',
        'is_corrected',
        'corrected_by_user_id',
        'corrected_at',
        'previous_winner_team_id',
        'previous_is_draw',
        'correction_reason',
    ];

    protected $casts = [
        'is_draw' => 'boolean',
        'is_corrected' => 'boolean',
        'previous_is_draw' => 'boolean',
        'submitted_at' => 'datetime',
        'corrected_at' => 'datetime',
    ];

    public function match(): BelongsTo
    {
        return $this->belongsTo(TournamentMatch::class, 'match_id');
    }

    public function winnerTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'winner_team_id');
    }

    public function previousWinnerTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'previous_winner_team_id');
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }

    public function correctedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'corrected_by_user_id');
    }
}
