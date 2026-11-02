<?php

namespace App\Services;

use App\Models\Team;
use App\Models\TournamentMatch;
use App\Models\MatchResult;
use App\Events\LeaderboardUpdated;

class LeaderboardService
{
    /**
     * Calculate live tournament leaderboard based on win-based scoring:
     * Win = 1 pt, Draw = 0 pt, Loss = 0 pt.
     */
    public function getLeaderboard(): array
    {
        $teams = Team::all();
        $totalTournamentRounds = 5;

        // Fetch all completed matches with results
        $completedMatches = TournamentMatch::with('result')
            ->where('status', 'completed')
            ->whereHas('result')
            ->get();

        $stats = [];
        foreach ($teams as $team) {
            $stats[$team->id] = [
                'team_id' => $team->id,
                'team_name' => $team->name,
                'team_name_ar' => $team->name_ar,
                'team_code' => $team->code,
                'team_color' => $team->color,
                'total_points' => 0,
                'wins' => 0,
                'draws' => 0,
                'losses' => 0,
                'matches_played' => 0,
                'matches_remaining' => $totalTournamentRounds,
            ];
        }

        foreach ($completedMatches as $match) {
            $result = $match->result;
            if (!$result) {
                continue;
            }

            $teamAId = $match->team_a_id;
            $teamBId = $match->team_b_id;

            if (isset($stats[$teamAId])) {
                $stats[$teamAId]['matches_played']++;
                $stats[$teamAId]['matches_remaining'] = max(0, $totalTournamentRounds - $stats[$teamAId]['matches_played']);
            }
            if (isset($stats[$teamBId])) {
                $stats[$teamBId]['matches_played']++;
                $stats[$teamBId]['matches_remaining'] = max(0, $totalTournamentRounds - $stats[$teamBId]['matches_played']);
            }

            if ($result->is_draw) {
                if (isset($stats[$teamAId])) {
                    $stats[$teamAId]['draws']++;
                    $stats[$teamAId]['total_points'] += 1; // Draw = 1 point each
                }
                if (isset($stats[$teamBId])) {
                    $stats[$teamBId]['draws']++;
                    $stats[$teamBId]['total_points'] += 1; // Draw = 1 point each
                }
            } else if ($result->winner_team_id) {
                $winnerId = $result->winner_team_id;
                $loserId = ($winnerId == $teamAId) ? $teamBId : $teamAId;

                if (isset($stats[$winnerId])) {
                    $stats[$winnerId]['wins']++;
                    $stats[$winnerId]['total_points'] += 3; // Win = 3 points
                }
                if (isset($stats[$loserId])) {
                    $stats[$loserId]['losses']++;
                    // Loss = 0 points
                }
            }
        }

        $leaderboard = array_values($stats);

        // Sort descending by Points, then Wins, then ascending by team_id
        usort($leaderboard, function ($a, $b) {
            if ($b['total_points'] !== $a['total_points']) {
                return $b['total_points'] <=> $a['total_points'];
            }
            if ($b['wins'] !== $a['wins']) {
                return $b['wins'] <=> $a['wins'];
            }
            return $a['team_id'] <=> $b['team_id'];
        });

        // Assign ranks with tie handling
        $currentRank = 1;
        foreach ($leaderboard as $idx => &$row) {
            if ($idx > 0) {
                $prev = $leaderboard[$idx - 1];
                if ($row['total_points'] === $prev['total_points'] && $row['wins'] === $prev['wins']) {
                    $row['rank'] = $prev['rank'];
                } else {
                    $row['rank'] = $idx + 1;
                }
            } else {
                $row['rank'] = 1;
            }
        }

        return $leaderboard;
    }

    public function broadcastLeaderboard(): array
    {
        $leaderboard = $this->getLeaderboard();
        event(new LeaderboardUpdated($leaderboard));
        return $leaderboard;
    }
}
