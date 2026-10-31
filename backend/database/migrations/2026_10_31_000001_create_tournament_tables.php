<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Teams Table
        Schema::create('teams', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g. "Team 1"
            $table->string('name_ar'); // e.g. "الفريق 1"
            $table->string('code')->unique(); // "T1"
            $table->string('color')->default('#0066FF');
            $table->string('logo')->nullable();
            $table->timestamps();
        });

        // 2. Games Table
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('station_number')->unique();
            $table->string('name_en');
            $table->string('name_ar');
            $table->text('description_en')->nullable();
            $table->text('description_ar')->nullable();
            $table->string('icon')->default('gamepad');
            $table->timestamps();
        });

        // Update Users table for role and game station
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('operator'); // 'admin' or 'operator'
            $table->foreignId('game_id')->nullable()->constrained('games')->nullOnDelete();
        });

        // 3. Rounds Table
        Schema::create('rounds', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('round_number')->unique();
            $table->string('status')->default('pending'); // pending, active, awaiting_results, completed
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        // 4. Matches Table
        Schema::create('matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('round_id')->constrained('rounds')->cascadeOnDelete();
            $table->foreignId('game_id')->constrained('games')->cascadeOnDelete();
            $table->foreignId('team_a_id')->constrained('teams');
            $table->foreignId('team_b_id')->constrained('teams');
            $table->string('status')->default('pending'); // pending, in_progress, completed, cancelled
            $table->timestamps();

            // Constraint: Exactly one match per game station per round
            $table->unique(['round_id', 'game_id'], 'round_game_station_unique');
            $table->index(['round_id', 'status']);
        });

        // 5. Match Results Table
        Schema::create('match_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('match_id')->unique()->constrained('matches')->cascadeOnDelete();
            $table->foreignId('winner_team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->boolean('is_draw')->default(false);
            $table->foreignId('submitted_by_user_id')->constrained('users');
            $table->text('operator_notes')->nullable();
            $table->timestamp('submitted_at');
            
            // Audit fields for corrections by Admin
            $table->boolean('is_corrected')->default(false);
            $table->foreignId('corrected_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('corrected_at')->nullable();
            $table->foreignId('previous_winner_team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->boolean('previous_is_draw')->nullable();
            $table->text('correction_reason')->nullable();
            
            $table->timestamps();
        });

        // 6. Round Timers Table
        Schema::create('round_timers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('round_id')->unique()->constrained('rounds')->cascadeOnDelete();
            $table->integer('duration_seconds')->default(600); // 10 minutes default
            $table->integer('remaining_seconds')->default(600);
            $table->string('status')->default('idle'); // idle, running, paused, expired
            $table->timestamp('started_at')->nullable();
            $table->timestamp('paused_at')->nullable();
            $table->timestamp('resumed_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('expired_at')->nullable();
            $table->bigInteger('server_sync_timestamp')->nullable();
            $table->timestamps();
        });

        // 7. Tournament Settings Table
        Schema::create('tournament_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value');
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // 8. Activity Logs Table
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('user_name');
            $table->string('action'); // e.g. START_ROUND, PAUSE_ROUND, SUBMIT_RESULT, CORRECT_RESULT
            $table->json('details')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamps();

            $table->index('created_at');
        });

        // 9. API Access Tokens Table
        Schema::create('api_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('token', 64)->unique();
            $table->string('name')->default('default');
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_tokens');
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('tournament_settings');
        Schema::dropIfExists('round_timers');
        Schema::dropIfExists('match_results');
        Schema::dropIfExists('matches');
        Schema::dropIfExists('rounds');
        
        if (Schema::hasColumn('users', 'game_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign(['game_id']);
                $table->dropColumn(['role', 'game_id']);
            });
        }
        
        Schema::dropIfExists('games');
        Schema::dropIfExists('teams');
    }
};
