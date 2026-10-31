<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Team;
use App\Models\Game;
use App\Models\Round;
use App\Models\TournamentMatch;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TournamentStructureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_tournament_structure_and_schedule(): void
    {
        // 1. All 10 teams exist
        $this->assertEquals(10, Team::count(), 'All 10 teams must exist');

        // 2. All 5 games exist
        $this->assertEquals(5, Game::count(), 'All 5 games must exist');

        // 3. All 5 rounds are loaded correctly
        $this->assertEquals(5, Round::count(), 'All 5 rounds must be loaded');

        // 4. All 25 matches are assigned correctly
        $this->assertEquals(25, TournamentMatch::count(), 'All 25 matches must be assigned');

        // 5. Each team plays exactly once per round
        for ($r = 1; $r <= 5; $r++) {
            $round = Round::where('round_number', $r)->firstOrFail();
            $matches = TournamentMatch::where('round_id', $round->id)->get();
            $this->assertCount(5, $matches, "Round {$r} must have exactly 5 matches");

            $teamIds = [];
            foreach ($matches as $match) {
                $teamIds[] = $match->team_a_id;
                $teamIds[] = $match->team_b_id;
            }

            sort($teamIds);
            $this->assertEquals(
                range(1, 10),
                $teamIds,
                "Every team from 1 to 10 must play exactly once in Round {$r}"
            );
        }

        // Check exact match assignments for Round 1
        $round1 = Round::where('round_number', 1)->firstOrFail();
        $r1m1 = TournamentMatch::where('round_id', $round1->id)->where('game_id', 1)->first();
        $this->assertEquals(1, $r1m1->team_a_id);
        $this->assertEquals(6, $r1m1->team_b_id);

        // Check operators assigned to games
        $operators = User::where('role', 'operator')->get();
        $this->assertCount(5, $operators, 'Must have 5 operator accounts');
        foreach ($operators as $op) {
            $this->assertNotNull($op->game_id, 'Each operator must be assigned to a game');
        }

        // Check admin
        $admin = User::where('role', 'admin')->first();
        $this->assertNotNull($admin, 'Main Administrator must exist');
    }
}
