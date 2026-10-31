<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Team;
use App\Models\Game;
use App\Models\ActivityLog;

class TeamController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'teams' => Team::orderBy('id')->get(),
        ]);
    }

    public function update(Request $request, int $teamId)
    {
        $user = $request->user();
        if (!$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized: Admin only.'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'name_ar' => 'sometimes|string|max:100',
            'color' => 'sometimes|string|max:20',
        ]);

        $team = Team::findOrFail($teamId);
        $team->update($validated);

        ActivityLog::create([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'action' => 'TEAM_UPDATED',
            'details' => ['team_id' => $team->id, 'changes' => $validated],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Team updated successfully.',
            'team' => $team,
        ]);
    }
}
