<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\ApiToken;
use Illuminate\Support\Facades\Auth;

class AuthenticateApiToken
{
    public function handle(Request $request, Closure $next, ?string $requiredRole = null): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated: Bearer token is missing.',
            ], 401);
        }

        $apiToken = ApiToken::where('token', $token)->with('user.game')->first();

        if (!$apiToken || !$apiToken->user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated: Invalid or expired token.',
            ], 401);
        }

        // Update token last used
        $apiToken->update(['last_used_at' => now()]);

        // Set authenticated user
        Auth::setUser($apiToken->user);
        $request->setUserResolver(fn() => $apiToken->user);

        // Check required role if specified
        if ($requiredRole && $apiToken->user->role !== $requiredRole) {
            return response()->json([
                'success' => false,
                'message' => "Forbidden: Requires {$requiredRole} role.",
            ], 403);
        }

        return $next($request);
    }
}
