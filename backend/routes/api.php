<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TournamentController;
use App\Http\Controllers\Api\TimerController;
use App\Http\Controllers\Api\ResultController;
use App\Http\Controllers\Api\TeamController;
use App\Http\Middleware\AuthenticateApiToken;

/*
|--------------------------------------------------------------------------
| Public Routes (TV / Projector Viewers & General Sync)
|--------------------------------------------------------------------------
*/
Route::get('/tournament/snapshot', [TournamentController::class, 'snapshot']);
Route::get('/tournament/leaderboard', [TournamentController::class, 'leaderboard']);
Route::get('/timer/status', [TimerController::class, 'status']);
Route::get('/teams', [TeamController::class, 'index']);
Route::post('/auth/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Authenticated Routes (Operators & Admin)
|--------------------------------------------------------------------------
*/
Route::middleware([AuthenticateApiToken::class])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Operator or Admin Result Submission
    Route::post('/matches/{matchId}/result', [ResultController::class, 'submit']);

    // Operator or Admin Ready Confirmation
    Route::post('/matches/{matchId}/ready', [TournamentController::class, 'toggleReady']);
});

/*
|--------------------------------------------------------------------------
| Admin Only Routes
|--------------------------------------------------------------------------
*/
Route::middleware([AuthenticateApiToken::class . ':admin'])->group(function () {
    // Round Management
    Route::post('/rounds/{roundNumber}/select', [TournamentController::class, 'selectRound']);
    Route::post('/rounds/{roundNumber}/complete', [TournamentController::class, 'completeRound']);

    // Timer Controls
    Route::post('/timer/duration', [TimerController::class, 'setDuration']);
    Route::post('/timer/start', [TimerController::class, 'start']);
    Route::post('/timer/pause', [TimerController::class, 'pause']);
    Route::post('/timer/resume', [TimerController::class, 'resume']);
    Route::post('/timer/expire', [TimerController::class, 'expire']);
    Route::post('/timer/reset', [TimerController::class, 'reset']);

    // Result Corrections & Overrides
    Route::post('/matches/{matchId}/correct', [ResultController::class, 'correct']);
    Route::post('/matches/{matchId}/cancel', [ResultController::class, 'cancel']);

    // Teams Management
    Route::put('/teams/{teamId}', [TeamController::class, 'update']);

    // Tournament Reset
    Route::post('/tournament/reset', [TournamentController::class, 'reset']);
});
