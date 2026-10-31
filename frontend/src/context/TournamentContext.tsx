import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type {
  TournamentSnapshot,
  RoundTimer,
} from '../types/tournament';
import { useAuth } from './AuthContext';
import { soundController } from '../utils/audio';

interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
}

interface TournamentContextType {
  snapshot: TournamentSnapshot | null;
  isLoading: boolean;
  isConnected: boolean;
  currentTimer: RoundTimer | null;
  toasts: ToastMessage[];
  refreshSnapshot: () => Promise<void>;
  dismissToast: (id: string) => void;
  // Admin Timer Controls
  startRound: () => Promise<boolean>;
  pauseRound: () => Promise<boolean>;
  resumeRound: () => Promise<boolean>;
  expireRound: () => Promise<boolean>;
  resetTimer: () => Promise<boolean>;
  setTimerDuration: (durationSeconds: number) => Promise<boolean>;
  // Admin Round Management
  selectRound: (roundNumber: number) => Promise<boolean>;
  completeRound: (roundNumber: number) => Promise<boolean>;
  // Match Results
  submitResult: (matchId: number, winnerTeamId: number | null, isDraw: boolean, notes?: string) => Promise<boolean>;
  correctResult: (matchId: number, winnerTeamId: number | null, isDraw: boolean, reason: string, notes?: string) => Promise<boolean>;
}

const TournamentContext = createContext<TournamentContextType | null>(null);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [snapshot, setSnapshot] = useState<TournamentSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [currentTimer, setCurrentTimer] = useState<RoundTimer | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sound ref to prevent repeating buzzer
  const hasBuzzerPlayedRef = useRef<boolean>(false);
  const timerTickRef = useRef<number | null>(null);

  const addToast = useCallback((type: 'info' | 'success' | 'warning' | 'error', title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [{ id, type, title, message, timestamp: Date.now() }, ...prev.slice(0, 4)]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch full tournament snapshot
  const refreshSnapshot = useCallback(async () => {
    try {
      const res = await fetch('/api/tournament/snapshot', {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSnapshot(data.data);
        if (data.data.timer) {
          setCurrentTimer(data.data.timer);
          if (data.data.timer.status !== 'expired') {
            hasBuzzerPlayedRef.current = false;
          }
        }
        setIsConnected(true);
      }
    } catch (err) {
      console.warn('Network sync temporary failure, retrying...', err);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    refreshSnapshot();
  }, [refreshSnapshot]);

  // Periodic heartbeat sync (1.5s interval for instant real-time synchronization)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSnapshot();
    }, 1500);

    return () => clearInterval(interval);
  }, [refreshSnapshot]);

  // WebSocket Connection (Reverb) with fallback
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      try {
        // Connect to Laravel Reverb WebSocket port (default 8080)
        const host = window.location.hostname || 'localhost';
        const wsUrl = `ws://${host}:8080/app/157hrmz0wphdhaddnjnh?protocol=7&client=js&version=8.4.0-reverb&flash=false`;
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setIsConnected(true);
          // Subscribe to 'tournament' channel
          ws?.send(
            JSON.stringify({
              event: 'pusher:subscribe',
              data: {
                auth: '',
                channel: 'tournament',
              },
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.event === 'RoundStarted') {
              soundController.playWhistle();
              addToast('info', 'Round Started', `Round ${parsed.data.roundNumber} has officially begun!`);
              refreshSnapshot();
            } else if (parsed.event === 'RoundTimeExpired') {
              soundController.playBuzzer();
              addToast('warning', 'TIME EXPIRED', 'Round timer has ended. Awaiting operator results.');
              refreshSnapshot();
            } else if (parsed.event === 'MatchResultSubmitted') {
              soundController.playSuccess();
              addToast('success', 'Result Submitted', `${parsed.data.matchResultData.game_name_en}: Result officially recorded!`);
              refreshSnapshot();
            } else if (parsed.event === 'MatchResultUpdated') {
              soundController.playSuccess();
              addToast('info', 'Result Corrected', `${parsed.data.matchResultData.game_name_en}: Administrator corrected result.`);
              refreshSnapshot();
            } else if (parsed.event === 'RoundCompleted') {
              soundController.playSuccess();
              addToast('success', 'Round Completed', `Round ${parsed.data.roundNumber} is complete!`);
              refreshSnapshot();
            } else if (parsed.event === 'LeaderboardUpdated') {
              refreshSnapshot();
            }
          } catch (e) {
            // Ignore non-json socket packets
          }
        };

        ws.onerror = () => {
          // Fallback handled by periodic snapshot sync
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWebSocket, 4000);
        };
      } catch (err) {
        // Silent catch; fallback periodic sync guarantees real-time updates
      }
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [refreshSnapshot, addToast]);

  // High-Precision Local Timer Countdown Loop (synchronized with server)
  useEffect(() => {
    if (!currentTimer || currentTimer.status !== 'running' || !currentTimer.expires_at) {
      return;
    }

    const timer = setInterval(() => {
      const now = Date.now();
      const expiresAtMs = new Date(currentTimer.expires_at!).getTime();
      const remaining = Math.max(0, Math.floor((expiresAtMs - now) / 1000));

      if (remaining <= 0) {
        if (!hasBuzzerPlayedRef.current) {
          hasBuzzerPlayedRef.current = true;
          soundController.playBuzzer();
          addToast('warning', 'TIME EXPIRED', 'Round timer has expired! Awaiting match submissions.');
        }

        setCurrentTimer((prev) =>
          prev ? { ...prev, remaining_seconds: 0, status: 'expired' } : null
        );
      } else {
        // Warning tick on last 5 seconds
        if (remaining <= 5 && remaining !== timerTickRef.current) {
          timerTickRef.current = remaining;
          soundController.playTick();
        }

        setCurrentTimer((prev) =>
          prev ? { ...prev, remaining_seconds: remaining } : null
        );
      }
    }, 250);

    return () => clearInterval(timer);
  }, [currentTimer?.status, currentTimer?.expires_at, addToast]);

  // Admin Timer Control Actions
  const startRound = async (): Promise<boolean> => {
    soundController.playClick();
    try {
      const res = await fetch('/api/timer/start', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        soundController.playWhistle();
        await refreshSnapshot();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const pauseRound = async (): Promise<boolean> => {
    soundController.playClick();
    try {
      const res = await fetch('/api/timer/pause', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        await refreshSnapshot();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const resumeRound = async (): Promise<boolean> => {
    soundController.playClick();
    try {
      const res = await fetch('/api/timer/resume', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        await refreshSnapshot();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const expireRound = async (): Promise<boolean> => {
    soundController.playClick();
    try {
      const res = await fetch('/api/timer/expire', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        soundController.playBuzzer();
        await refreshSnapshot();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const resetTimer = async (): Promise<boolean> => {
    soundController.playClick();
    try {
      const res = await fetch('/api/timer/reset', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        hasBuzzerPlayedRef.current = false;
        await refreshSnapshot();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const setTimerDuration = async (durationSeconds: number): Promise<boolean> => {
    soundController.playClick();
    try {
      const res = await fetch('/api/timer/duration', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ duration_seconds: durationSeconds }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshSnapshot();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Admin Round Management
  const selectRound = async (roundNumber: number): Promise<boolean> => {
    soundController.playClick();
    try {
      const res = await fetch(`/api/rounds/${roundNumber}/select`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        hasBuzzerPlayedRef.current = false;
        await refreshSnapshot();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const completeRound = async (roundNumber: number): Promise<boolean> => {
    soundController.playClick();
    try {
      const res = await fetch(`/api/rounds/${roundNumber}/complete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        soundController.playSuccess();
        await refreshSnapshot();
        return true;
      } else {
        addToast('error', 'Cannot Complete Round', data.message || 'All matches must be completed first.');
        return false;
      }
    } catch {
      return false;
    }
  };

  // Match Results
  const submitResult = async (
    matchId: number,
    winnerTeamId: number | null,
    isDraw: boolean,
    notes?: string
  ): Promise<boolean> => {
    soundController.playClick();
    try {
      const res = await fetch(`/api/matches/${matchId}/result`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          winner_team_id: winnerTeamId,
          is_draw: isDraw,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        soundController.playSuccess();
        await refreshSnapshot();
        return true;
      } else {
        addToast('error', 'Submission Error', data.message || 'Could not submit result.');
        return false;
      }
    } catch {
      return false;
    }
  };

  const correctResult = async (
    matchId: number,
    winnerTeamId: number | null,
    isDraw: boolean,
    reason: string,
    notes?: string
  ): Promise<boolean> => {
    soundController.playClick();
    try {
      const res = await fetch(`/api/matches/${matchId}/correct`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          winner_team_id: winnerTeamId,
          is_draw: isDraw,
          reason,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        soundController.playSuccess();
        await refreshSnapshot();
        return true;
      } else {
        addToast('error', 'Correction Error', data.message || 'Could not correct result.');
        return false;
      }
    } catch {
      return false;
    }
  };

  return (
    <TournamentContext.Provider
      value={{
        snapshot,
        isLoading,
        isConnected,
        currentTimer,
        toasts,
        refreshSnapshot,
        dismissToast,
        startRound,
        pauseRound,
        resumeRound,
        expireRound,
        resetTimer,
        setTimerDuration,
        selectRound,
        completeRound,
        submitResult,
        correctResult,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};
