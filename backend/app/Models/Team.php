<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Team extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'name_ar',
        'code',
        'color',
        'logo',
    ];

    public function homeMatches(): HasMany
    {
        return $this->hasMany(TournamentMatch::class, 'team_a_id');
    }

    public function awayMatches(): HasMany
    {
        return $this->hasMany(TournamentMatch::class, 'team_b_id');
    }

    public function wonResults(): HasMany
    {
        return $this->hasMany(MatchResult::class, 'winner_team_id');
    }
}
