<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Team;
use App\Models\Game;
use App\Models\User;
use App\Models\Round;
use App\Models\TournamentMatch;
use App\Models\RoundTimer;
use App\Models\TournamentSetting;
use App\Models\ActivityLog;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Settings
        $settings = [
            ['key' => 'tournament_name', 'value' => 'COMPETITION CONTROL CENTER', 'description' => 'Main Tournament Title'],
            ['key' => 'tournament_name_ar', 'value' => 'مركز التحكم في المنافسات', 'description' => 'Main Tournament Arabic Title'],
            ['key' => 'current_round', 'value' => '1', 'description' => 'Active Round Number'],
            ['key' => 'round_default_duration', 'value' => '600', 'description' => 'Default Round Duration in Seconds (10 min)'],
            ['key' => 'points_win', 'value' => '1', 'description' => 'Points for a win'],
            ['key' => 'points_draw', 'value' => '0', 'description' => 'Points for a draw'],
            ['key' => 'points_loss', 'value' => '0', 'description' => 'Points for a loss'],
        ];

        foreach ($settings as $setting) {
            TournamentSetting::updateOrCreate(['key' => $setting['key']], $setting);
        }

        // 2. Teams (10 Teams)
        $teamsData = [
            ['id' => 1, 'name' => 'Team 1', 'name_ar' => 'الفريق 1', 'code' => 'T1', 'color' => '#00D2FF'],
            ['id' => 2, 'name' => 'Team 2', 'name_ar' => 'الفريق 2', 'code' => 'T2', 'color' => '#3B82F6'],
            ['id' => 3, 'name' => 'Team 3', 'name_ar' => 'الفريق 3', 'code' => 'T3', 'color' => '#6366F1'],
            ['id' => 4, 'name' => 'Team 4', 'name_ar' => 'الفريق 4', 'code' => 'T4', 'color' => '#8B5CF6'],
            ['id' => 5, 'name' => 'Team 5', 'name_ar' => 'الفريق 5', 'code' => 'T5', 'color' => '#EC4899'],
            ['id' => 6, 'name' => 'Team 6', 'name_ar' => 'الفريق 6', 'code' => 'T6', 'color' => '#EF4444'],
            ['id' => 7, 'name' => 'Team 7', 'name_ar' => 'الفريق 7', 'code' => 'T7', 'color' => '#F97316'],
            ['id' => 8, 'name' => 'Team 8', 'name_ar' => 'الفريق 8', 'code' => 'T8', 'color' => '#EAB308'],
            ['id' => 9, 'name' => 'Team 9', 'name_ar' => 'الفريق 9', 'code' => 'T9', 'color' => '#10B981'],
            ['id' => 10, 'name' => 'Team 10', 'name_ar' => 'الفريق 10', 'code' => 'T10', 'color' => '#06B6D4'],
        ];

        foreach ($teamsData as $team) {
            Team::updateOrCreate(['id' => $team['id']], $team);
        }

        // 3. Games (5 Games)
        $gamesData = [
            [
                'id' => 1,
                'station_number' => 1,
                'name_en' => 'Brain Ball',
                'name_ar' => 'برين بول',
                'description_en' => 'Fast-paced ball precision, agility, and mental battle',
                'description_ar' => 'تحدي الدقة والرشاقة والتحكم والتركيز الذهني بالكرة',
                'icon' => 'brain',
            ],
            [
                'id' => 2,
                'station_number' => 2,
                'name_en' => 'Fish Hunters',
                'name_ar' => 'صيادين السمك',
                'description_en' => 'Speed and reaction team catching contest',
                'description_ar' => 'سباق السرعة وردود الأفعال والصيد الجماعي',
                'icon' => 'fish',
            ],
            [
                'id' => 3,
                'station_number' => 3,
                'name_en' => 'Chair & Ball',
                'name_ar' => 'كرسي و الكرة',
                'description_en' => 'Strategic balance and tactical possession match',
                'description_ar' => 'تحدي التوازن الاستراتيجي والاستحواذ التكتيكي',
                'icon' => 'armchair',
            ],
            [
                'id' => 4,
                'station_number' => 4,
                'name_en' => 'Human Collision',
                'name_ar' => 'التصادم البشري',
                'description_en' => 'High energy physical clash and ring dominance',
                'description_ar' => 'مواجهة بدنية عالية الطاقة والسيطرة على الحلبة',
                'icon' => 'swords',
            ],
            [
                'id' => 5,
                'station_number' => 5,
                'name_en' => 'Telescope',
                'name_ar' => 'تليسكوب',
                'description_en' => 'High-stakes visual precision, speed, and tactical reflex showdown',
                'description_ar' => 'المواجهة الكبرى لدقة الرؤية وسرعة البديهة والتركيز العالي',
                'icon' => 'telescope',
            ],
        ];

        foreach ($gamesData as $game) {
            Game::updateOrCreate(['id' => $game['id']], $game);
        }

        // 4. Users (1 Admin, 5 Operators)
        User::updateOrCreate(
            ['email' => 'admin@ccc.local'],
            [
                'name' => 'Main Administrator',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'game_id' => null,
            ]
        );

        $operators = [
            ['station' => 1, 'email' => 'operator1@ccc.local', 'name' => 'Operator Brain Ball', 'game_id' => 1],
            ['station' => 2, 'email' => 'operator2@ccc.local', 'name' => 'Operator Fish Hunters', 'game_id' => 2],
            ['station' => 3, 'email' => 'operator3@ccc.local', 'name' => 'Operator Chair & Ball', 'game_id' => 3],
            ['station' => 4, 'email' => 'operator4@ccc.local', 'name' => 'Operator Human Collision', 'game_id' => 4],
            ['station' => 5, 'email' => 'operator5@ccc.local', 'name' => 'Operator Telescope', 'game_id' => 5],
        ];

        foreach ($operators as $op) {
            User::updateOrCreate(
                ['email' => $op['email']],
                [
                    'name' => $op['name'],
                    'password' => Hash::make('password123'),
                    'role' => 'operator',
                    'game_id' => $op['game_id'],
                ]
            );
        }

        // 5. Rounds (5 Rounds) & Timers
        for ($r = 1; $r <= 5; $r++) {
            $round = Round::updateOrCreate(
                ['round_number' => $r],
                [
                    'status' => 'pending',
                ]
            );

            RoundTimer::updateOrCreate(
                ['round_id' => $round->id],
                [
                    'duration_seconds' => 600,
                    'remaining_seconds' => 600,
                    'status' => 'idle',
                ]
            );
        }

        // 6. OFFICIAL MATCH SCHEDULE (Exact assignments)
        $schedule = [
            // ROUND 1:
            // Game 1: Team 1 vs Team 6
            // Game 2: Team 2 vs Team 10
            // Game 3: Team 3 vs Team 9
            // Game 4: Team 4 vs Team 8
            // Game 5: Team 5 vs Team 7
            1 => [
                1 => [1, 6],
                2 => [2, 10],
                3 => [3, 9],
                4 => [4, 8],
                5 => [5, 7],
            ],
            // ROUND 2:
            // Game 1: Team 2 vs Team 7
            // Game 2: Team 3 vs Team 6
            // Game 3: Team 4 vs Team 10
            // Game 4: Team 5 vs Team 9
            // Game 5: Team 1 vs Team 8
            2 => [
                1 => [2, 7],
                2 => [3, 6],
                3 => [4, 10],
                4 => [5, 9],
                5 => [1, 8],
            ],
            // ROUND 3:
            // Game 1: Team 3 vs Team 8
            // Game 2: Team 4 vs Team 7
            // Game 3: Team 5 vs Team 6
            // Game 4: Team 1 vs Team 10
            // Game 5: Team 2 vs Team 9
            3 => [
                1 => [3, 8],
                2 => [4, 7],
                3 => [5, 6],
                4 => [1, 10],
                5 => [2, 9],
            ],
            // ROUND 4:
            // Game 1: Team 4 vs Team 9
            // Game 2: Team 5 vs Team 8
            // Game 3: Team 1 vs Team 7
            // Game 4: Team 2 vs Team 6
            // Game 5: Team 3 vs Team 10
            4 => [
                1 => [4, 9],
                2 => [5, 8],
                3 => [1, 7],
                4 => [2, 6],
                5 => [3, 10],
            ],
            // ROUND 5:
            // Game 1: Team 5 vs Team 10
            // Game 2: Team 1 vs Team 9
            // Game 3: Team 2 vs Team 8
            // Game 4: Team 3 vs Team 7
            // Game 5: Team 4 vs Team 6
            5 => [
                1 => [5, 10],
                2 => [1, 9],
                3 => [2, 8],
                4 => [3, 7],
                5 => [4, 6],
            ],
        ];

        foreach ($schedule as $roundNum => $gameMatches) {
            $round = Round::where('round_number', $roundNum)->first();
            foreach ($gameMatches as $gameId => $teams) {
                TournamentMatch::updateOrCreate(
                    [
                        'round_id' => $round->id,
                        'game_id' => $gameId,
                    ],
                    [
                        'team_a_id' => $teams[0],
                        'team_b_id' => $teams[1],
                        'status' => 'pending',
                    ]
                );
            }
        }

        ActivityLog::create([
            'user_name' => 'System',
            'action' => 'TOURNAMENT_INITIALIZED',
            'details' => ['message' => 'Tournament structure, official schedule, and operator accounts seeded successfully.'],
            'ip_address' => '127.0.0.1',
        ]);
    }
}
