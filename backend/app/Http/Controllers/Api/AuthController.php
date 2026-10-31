<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;
use App\Models\ApiToken;
use App\Models\ActivityLog;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::with('game')->where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password credentials.',
            ], 401);
        }

        // Generate a cryptographically secure token
        $token = Str::random(60);
        ApiToken::create([
            'user_id' => $user->id,
            'token' => $token,
            'name' => 'CCC-' . $user->role . '-' . now()->timestamp,
            'last_used_at' => now(),
        ]);

        ActivityLog::create([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'action' => 'USER_LOGIN',
            'details' => ['role' => $user->role, 'game_id' => $user->game_id],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'game_id' => $user->game_id,
                'game' => $user->game,
            ],
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $user->load('game');

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'game_id' => $user->game_id,
                'game' => $user->game,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $token = $request->bearerToken();
        if ($token) {
            ApiToken::where('token', $token)->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }
}
