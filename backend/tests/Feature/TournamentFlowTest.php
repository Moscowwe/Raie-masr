<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Round;
use App\Models\TournamentMatch;
use App\Models\MatchResult;
use App\Models\ApiToken;
use Illuminate\Support\Str;

class TournamentFlowTest extends TestCase
{
    use RefreshDatabase;

    protected string $adminToken;
    protected User $admin;
    protected User $operator1;
    protected string $operator1Token;
    protected User $operator2;
    protected string $operator2Token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();

        $this->admin = User::where('email', 'admin@ccc.local')->firstOrFail();
        $this->operator1 = User::where('email', 'operator1@ccc.local')->firstOrFail();
        $this->operator2 = User::where('email', 'operator2@ccc.local')->firstOrFail();

        $this->adminToken = 'admin-token-' . Str::random(30);
        ApiToken::create(['user_id' => $this->admin->id, 'token' => $this->adminToken, 'name' => 'admin-test']);

        $this->operator1Token = 'op1-token-' . Str::random(30);
        ApiToken::create(['user_id' => $this->operator1->id, 'token' => $this->operator1Token, 'name' => 'op1-test']);

        $this->operator2Token = 'op2-token-' . Str::random(30);
        ApiToken::create(['user_id' => $this->operator2->id, 'token' => $this->operator2Token, 'name' => 'op2-test']);
    }

    public function test_admin_can_start_round_and_all_games_start_simultaneously(): void
    {
        // 1. Admin starts round
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/timer/start');

        $response->assertStatus(200);
        $this->assertEquals('running', $response->json('timer.status'));

        // All 5 matches in Round 1 must now be in_progress
        $round1 = Round::where('round_number', 1)->first();
        $this->assertEquals('active', $round1->status);

        $matches = TournamentMatch::where('round_id', $round1->id)->get();
        foreach ($matches as $match) {
            $this->assertEquals('in_progress', $match->status, "Game {$match->game_id} must be in_progress");
        }
    }

    public function test_operator_can_submit_result_before_time_expires(): void
    {
        // Start round first
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/timer/start');

        $round1 = Round::where('round_number', 1)->first();
        // Match 1 is Prem Ball (Game 1, Operator 1) -> Team 1 vs Team 6
        $match1 = TournamentMatch::where('round_id', $round1->id)->where('game_id', 1)->first();

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->operator1Token)
            ->postJson("/api/matches/{$match1->id}/result", [
                'winner_team_id' => $match1->team_a_id, // Team 1 wins
                'is_draw' => false,
                'notes' => 'Great technical play by Team 1.',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('match_results', [
            'match_id' => $match1->id,
            'winner_team_id' => $match1->team_a_id,
            'is_draw' => false,
        ]);

        // Match 1 is marked as completed
        $this->assertEquals('completed', $match1->fresh()->status);

        // Submitting result does NOT stop other games
        $match2 = TournamentMatch::where('round_id', $round1->id)->where('game_id', 2)->first();
        $this->assertEquals('in_progress', $match2->status);

        // Submitting result does NOT stop or modify the central timer
        $timerResponse = $this->getJson('/api/timer/status');
        $this->assertEquals('running', $timerResponse->json('timer.status'));

        // Leaderboard must immediately award Team 1 = 3 points (Win = 3)
        $lbResponse = $this->getJson('/api/tournament/leaderboard');
        $team1Row = collect($lbResponse->json('leaderboard'))->firstWhere('team_id', $match1->team_a_id);
        $this->assertEquals(3, $team1Row['total_points']);
        $this->assertEquals(1, $team1Row['wins']);
    }

    public function test_operator_cannot_submit_result_for_another_station(): void
    {
        $round1 = Round::where('round_number', 1)->first();
        // Match 2 belongs to Game 2 (Fish Hunters)
        $match2 = TournamentMatch::where('round_id', $round1->id)->where('game_id', 2)->first();

        // Operator 1 tries to submit for Match 2 -> Forbidden (422)
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->operator1Token)
            ->postJson("/api/matches/{$match2->id}/result", [
                'winner_team_id' => $match2->team_a_id,
                'is_draw' => false,
            ]);

        $response->assertStatus(422);
    }

    public function test_operator_cannot_edit_result_after_submission(): void
    {
        $round1 = Round::where('round_number', 1)->first();
        $match1 = TournamentMatch::where('round_id', $round1->id)->where('game_id', 1)->first();

        // Submit first result
        $this->withHeader('Authorization', 'Bearer ' . $this->operator1Token)
            ->postJson("/api/matches/{$match1->id}/result", [
                'winner_team_id' => $match1->team_a_id,
                'is_draw' => false,
            ]);

        // Operator 1 attempts to change result -> Forbidden (422)
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->operator1Token)
            ->postJson("/api/matches/{$match1->id}/result", [
                'winner_team_id' => $match1->team_b_id,
                'is_draw' => false,
            ]);

        $response->assertStatus(422);
    }

    public function test_admin_can_correct_submitted_result(): void
    {
        $round1 = Round::where('round_number', 1)->first();
        $match1 = TournamentMatch::where('round_id', $round1->id)->where('game_id', 1)->first();

        // Operator 1 submits initial result
        $this->withHeader('Authorization', 'Bearer ' . $this->operator1Token)
            ->postJson("/api/matches/{$match1->id}/result", [
                'winner_team_id' => $match1->team_a_id,
                'is_draw' => false,
            ]);

        // Admin corrects result to DRAW
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson("/api/matches/{$match1->id}/correct", [
                'is_draw' => true,
                'reason' => 'Referee review overturned final goal.',
            ]);

        $response->assertStatus(200);

        // Verify result in database
        $result = MatchResult::where('match_id', $match1->id)->first();
        $this->assertTrue($result->is_draw);
        $this->assertTrue($result->is_corrected);
        $this->assertEquals($this->admin->id, $result->corrected_by_user_id);
        $this->assertEquals('Referee review overturned final goal.', $result->correction_reason);

        // Leaderboard must recalculate automatically (Team 1 now has 1 point, 1 draw)
        $lbResponse = $this->getJson('/api/tournament/leaderboard');
        $team1Row = collect($lbResponse->json('leaderboard'))->firstWhere('team_id', $match1->team_a_id);
        $this->assertEquals(1, $team1Row['total_points']);
        $this->assertEquals(1, $team1Row['draws']);
    }

    public function test_operator_can_submit_result_after_timer_expires(): void
    {
        // Start round first
        $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/timer/start');

        // Admin expires the timer
        $expireResponse = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->postJson('/api/timer/expire');
        $expireResponse->assertStatus(200);

        $timerResponse = $this->getJson('/api/timer/status');
        $this->assertEquals('expired', $timerResponse->json('timer.status'));

        $round1 = Round::where('round_number', 1)->first();
        $match2 = TournamentMatch::where('round_id', $round1->id)->where('game_id', 2)->first();

        // Operator 2 submits result after timer has expired
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->operator2Token)
            ->postJson("/api/matches/{$match2->id}/result", [
                'winner_team_id' => $match2->team_b_id,
                'is_draw' => false,
                'notes' => 'Submitted after match whistle.',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('match_results', [
            'match_id' => $match2->id,
            'winner_team_id' => $match2->team_b_id,
        ]);
    }
}
