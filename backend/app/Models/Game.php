<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Game extends Model
{
    use HasFactory;

    protected $fillable = [
        'station_number',
        'name_en',
        'name_ar',
        'description_en',
        'description_ar',
        'icon',
    ];

    public function operator(): HasOne
    {
        return $this->hasOne(User::class, 'game_id');
    }

    public function matches(): HasMany
    {
        return $this->hasMany(TournamentMatch::class, 'game_id');
    }
}
