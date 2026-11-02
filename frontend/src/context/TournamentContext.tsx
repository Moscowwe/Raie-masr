import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type {
  TournamentSnapshot,
  RoundTimer,
  ActivityLog,
} from '../types/tournament';
import { useAuth } from './AuthContext';
import { soundController } from '../utils/audio';
import { supabase, REALTIME_CHANNEL } from '../utils/supabase';
import {
  loadStandaloneSnapshot,
  saveStandaloneSnapshot,
  computeLeaderboard,
  computeStats,
  createInitialSnapshot,
} from '../utils/standaloneEngine';

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
  // Points Adjustment & Tournament Reset
  adjustTeamPoints: (teamId: number, delta: number, reason: string) => Promise<boolean>;
  resetTournament: () => Promise<boolean>;
}

const TournamentContext = createContext<TournamentContextType | null>(null);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [snapshot, setSnapshot] = useState<TournamentSnapshot | null>(() => loadStandaloneSnapshot());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [currentTimer, setCurrentTimer] = useState<RoundTimer | null>(() => {
    const s = loadStandaloneSnapshot();
    return s.timer || null;
  });
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

  const broadcastSupabase = useCallback((event: string, payload?: any) => {
    try {
      supabase.channel(REALTIME_CHANNEL).send({
        type: 'broadcast',
        event,
        payload: payload || {},
      });
    } catch {
      // ignore
    }
  }, []);

  // Fetch full tournament snapshot
  const refreshSnapshot = useCallback(async () => {
    let synced = false;
    if (token && !token.startsWith('mock-')) {
      try {
        const res = await fetch('/api/tournament/snapshot', {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setSnapshot(data.data);
            if (data.data.timer) {
              setCurrentTimer(data.data.timer);
              if (data.data.timer.status !== 'expired') {
                hasBuzzerPlayedRef.current = false;
              }
            }
            saveStandaloneSnapshot(data.data);
            setIsConnected(true);
            synced = true;
          }
        }
      } catch {
        // Backend not reachable, stay on standalone cloud store
      }
    }

    if (!synced) {
      const local = loadStandaloneSnapshot();
      setSnapshot(local);
      if (local.timer) {
        setCurrentTimer(local.timer);
      }
      setIsConnected(true);
    }
    setIsLoading(false);
  }, [token]);

  // Initial load
  useEffect(() => {
    refreshSnapshot();
  }, [refreshSnapshot]);

  // Supabase Realtime Channel (Powers real-time synchronization on Vercel)
  useEffect(() => {
    const channel = supabase.channel(REALTIME_CHANNEL, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'RoundStarted' }, (payload) => {
        soundController.playWhistle();
        const roundNum = payload.payload?.roundNumber ?? 1;
        const expiresAt = payload.payload?.expires_at;
        const duration = payload.payload?.duration_seconds ?? 600;

        addToast('info', 'Round Started', `Round ${roundNum} has officially begun!`);

        setSnapshot((prev) => {
          if (!prev) return prev;
          const updatedTimer: RoundTimer = {
            ...prev.timer!,
            status: 'running',
            expires_at: expiresAt || new Date(Date.now() + duration * 1000).toISOString(),
            remaining_seconds: duration,
          };
          const next = { ...prev, timer: updatedTimer };
          saveStandaloneSnapshot(next);
          setCurrentTimer(updatedTimer);
          return next;
        });
      })
      .on('broadcast', { event: 'RoundPaused' }, () => {
        addToast('warning', 'Timer Paused', 'Round timer was paused by administrator.');
        setSnapshot((prev) => {
          if (!prev || !prev.timer) return prev;
          const updatedTimer: RoundTimer = {
            ...prev.timer,
            status: 'paused',
          };
          const next = { ...prev, timer: updatedTimer };
          saveStandaloneSnapshot(next);
          setCurrentTimer(updatedTimer);
          return next;
        });
      })
      .on('broadcast', { event: 'RoundResumed' }, (payload) => {
        addToast('info', 'Timer Resumed', 'Round timer resumed.');
        const expiresAt = payload.payload?.expires_at;
        setSnapshot((prev) => {
          if (!prev || !prev.timer) return prev;
          const updatedTimer: RoundTimer = {
            ...prev.timer,
            status: 'running',
            expires_at: expiresAt || prev.timer.expires_at,
          };
          const next = { ...prev, timer: updatedTimer };
          saveStandaloneSnapshot(next);
          setCurrentTimer(updatedTimer);
          return next;
        });
      })
      .on('broadcast', { event: 'RoundTimeExpired' }, () => {
        soundController.playBuzzer();
        addToast('warning', 'TIME EXPIRED', 'Round timer has ended. Awaiting operator results.');
        setSnapshot((prev) => {
          if (!prev || !prev.timer) return prev;
          const updatedTimer: RoundTimer = {
            ...prev.timer,
            status: 'expired',
            remaining_seconds: 0,
          };
          const next = { ...prev, timer: updatedTimer };
          saveStandaloneSnapshot(next);
          setCurrentTimer(updatedTimer);
          return next;
        });
      })
      .on('broadcast', { event: 'RoundTimerReset' }, () => {
        addToast('info', 'Timer Reset', 'Timer was reset to default.');
        hasBuzzerPlayedRef.current = false;
        setSnapshot((prev) => {
          if (!prev || !prev.timer) return prev;
          const updatedTimer: RoundTimer = {
            ...prev.timer,
            status: 'idle',
            remaining_seconds: prev.timer.duration_seconds,
          };
          const next = { ...prev, timer: updatedTimer };
          saveStandaloneSnapshot(next);
          setCurrentTimer(updatedTimer);
          return next;
        });
      })
      .on('broadcast', { event: 'RoundTimerDurationChanged' }, (payload) => {
        const dur = payload.payload?.durationSeconds ?? 600;
        setSnapshot((prev) => {
          if (!prev || !prev.timer) return prev;
          const updatedTimer: RoundTimer = {
            ...prev.timer,
            duration_seconds: dur,
            remaining_seconds: dur,
          };
          const next = { ...prev, timer: updatedTimer };
          saveStandaloneSnapshot(next);
          setCurrentTimer(updatedTimer);
          return next;
        });
      })
      .on('broadcast', { event: 'RoundSelected' }, (payload) => {
        const rNum = payload.payload?.roundNumber ?? 1;
        setSnapshot((prev) => {
          if (!prev) return prev;
          const currentRoundMatches = prev.all_matches.filter((m) => m.round_id === rNum);
          const activeRound = prev.rounds.find((r) => r.round_number === rNum) || null;
          const next = {
            ...prev,
            current_round: rNum,
            active_round: activeRound,
            current_round_matches: currentRoundMatches,
          };
          saveStandaloneSnapshot(next);
          return next;
        });
      })
      .on('broadcast', { event: 'MatchResultSubmitted' }, (payload) => {
        soundController.playSuccess();
        const p = payload.payload;
        const game = p?.game_name_en || 'Match Station';
        addToast('success', 'Result Submitted', `${game}: Result officially recorded!`);

        setSnapshot((prev) => {
          if (!prev) return prev;
          const updatedMatches = prev.all_matches.map((m) => {
            if (m.id === p.matchId) {
              return {
                ...m,
                status: 'completed' as const,
                result: {
                  id: Date.now(),
                  match_id: p.matchId,
                  winner_team_id: p.winnerTeamId,
                  is_draw: p.isDraw,
                  submitted_by: { id: p.operatorId || 2, name: p.operatorName || 'Game Operator' },
                  submitted_at: new Date().toISOString(),
                  operator_notes: p.notes,
                  is_corrected: false,
                },
              };
            }
            return m;
          });

          const currentRoundMatches = updatedMatches.filter((m) => m.round_id === prev.current_round);
          const next = {
            ...prev,
            all_matches: updatedMatches,
            current_round_matches: currentRoundMatches,
            leaderboard: computeLeaderboard(updatedMatches, prev.point_adjustments || {}),
            stats: computeStats(updatedMatches),
          };
          saveStandaloneSnapshot(next);
          return next;
        });
      })
      .on('broadcast', { event: 'MatchResultUpdated' }, (payload) => {
        soundController.playSuccess();
        const p = payload.payload;
        const game = p?.game_name_en || 'Match Station';
        addToast('info', 'Result Corrected', `${game}: Administrator corrected result.`);

        setSnapshot((prev) => {
          if (!prev) return prev;
          const updatedMatches = prev.all_matches.map((m) => {
            if (m.id === p.matchId) {
              return {
                ...m,
                status: 'completed' as const,
                result: {
                  id: m.result?.id || Date.now(),
                  match_id: p.matchId,
                  winner_team_id: p.winnerTeamId,
                  is_draw: p.isDraw,
                  submitted_by: m.result?.submitted_by || { id: 1, name: 'Admin' },
                  submitted_at: m.result?.submitted_at || new Date().toISOString(),
                  is_corrected: true,
                  corrected_by: { id: 1, name: 'Administrator' },
                  corrected_at: new Date().toISOString(),
                  correction_reason: p.reason,
                  operator_notes: p.notes,
                },
              };
            }
            return m;
          });

          const currentRoundMatches = updatedMatches.filter((m) => m.round_id === prev.current_round);
          const next = {
            ...prev,
            all_matches: updatedMatches,
            current_round_matches: currentRoundMatches,
            leaderboard: computeLeaderboard(updatedMatches, prev.point_adjustments || {}),
            stats: computeStats(updatedMatches),
          };
          saveStandaloneSnapshot(next);
          return next;
        });
      })
      .on('broadcast', { event: 'RoundCompleted' }, (payload) => {
        soundController.playSuccess();
        const rNum = payload.payload?.roundNumber ?? 1;
        addToast('success', 'Round Completed', `Round ${rNum} is complete!`);

        setSnapshot((prev) => {
          if (!prev) return prev;
          const nextRoundNum = Math.min(5, rNum + 1);
          const updatedRounds = prev.rounds.map((r) => {
            if (r.round_number === rNum) {
              return { ...r, status: 'completed' as const, completed_at: new Date().toISOString() };
            }
            if (r.round_number === nextRoundNum) {
              return { ...r, status: 'active' as const, started_at: new Date().toISOString() };
            }
            return r;
          });
          const currentRoundMatches = prev.all_matches.filter((m) => m.round_id === nextRoundNum);
          const next = {
            ...prev,
            current_round: nextRoundNum,
            active_round: updatedRounds.find((r) => r.round_number === nextRoundNum) || null,
            rounds: updatedRounds,
            current_round_matches: currentRoundMatches,
          };
          saveStandaloneSnapshot(next);
          return next;
        });
      })
      .on('broadcast', { event: 'PointsAdjusted' }, (payload) => {
        const p = payload.payload;
        addToast('info', 'Points Adjusted', `Administrator adjusted points (${p.delta >= 0 ? `+${p.delta}` : p.delta}).`);
        setSnapshot((prev) => {
          if (!prev) return prev;
          const currentAdj = prev.point_adjustments || {};
          const newBonus = (currentAdj[p.teamId] || 0) + p.delta;
          const updatedAdj = { ...currentAdj, [p.teamId]: newBonus };
          const next = {
            ...prev,
            point_adjustments: updatedAdj,
            leaderboard: computeLeaderboard(prev.all_matches, updatedAdj),
          };
          saveStandaloneSnapshot(next);
          return next;
        });
      })
      .on('broadcast', { event: 'TournamentReset' }, () => {
        soundController.playSuccess();
        const fresh = createInitialSnapshot();
        setSnapshot(fresh);
        setCurrentTimer(fresh.timer);
        saveStandaloneSnapshot(fresh);
        addToast('warning', 'Tournament Reset', 'Tournament has been restarted by administrator.');
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addToast]);

  // High-Precision Local Timer Countdown Loop (synchronized with server/expires_at)
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
          broadcastSupabase('RoundTimeExpired');
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
  }, [currentTimer?.status, currentTimer?.expires_at, addToast, broadcastSupabase]);

  // Admin Timer Control Actions
  const startRound = async (): Promise<boolean> => {
    soundController.playClick();
    const roundNum = snapshot?.current_round ?? 1;

    // Strict sequential rule: Round N > 1 cannot be played until Round N - 1 is completed
    if (roundNum > 1 && snapshot?.all_matches) {
      const prevIncomplete = snapshot.all_matches.some(
        (m) => m.round_id < roundNum && m.status !== 'completed'
      );
      if (prevIncomplete) {
        addToast(
          'error',
          'الجولة مغلقة (Round Locked)',
          `لا يمكن بدء المؤقت للجولة ${roundNum} حتى تكتمل جميع مباريات الجولة ${roundNum - 1} بالكامل.`
        );
        return false;
      }
    }

    const duration = snapshot?.timer?.duration_seconds || 600;
    const expiresAt = new Date(Date.now() + duration * 1000).toISOString();

    // Standalone state update
    setSnapshot((prev) => {
      if (!prev) return prev;
      const updatedTimer: RoundTimer = {
        round_id: roundNum,
        round_number: roundNum,
        duration_seconds: duration,
        remaining_seconds: duration,
        status: 'running',
        started_at: new Date().toISOString(),
        expires_at: expiresAt,
        server_timestamp: Date.now(),
      };
      const next = { ...prev, timer: updatedTimer };
      saveStandaloneSnapshot(next);
      setCurrentTimer(updatedTimer);
      return next;
    });

    soundController.playWhistle();
    broadcastSupabase('RoundStarted', {
      roundNumber: roundNum,
      expires_at: expiresAt,
      duration_seconds: duration,
    });

    if (token && !token.startsWith('mock-')) {
      try {
        await fetch('/api/timer/start', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
      } catch {
        // ignore
      }
    }
    return true;
  };

  const pauseRound = async (): Promise<boolean> => {
    soundController.playClick();
    setSnapshot((prev) => {
      if (!prev || !prev.timer) return prev;
      const updatedTimer: RoundTimer = {
        ...prev.timer,
        status: 'paused',
        paused_at: new Date().toISOString(),
      };
      const next = { ...prev, timer: updatedTimer };
      saveStandaloneSnapshot(next);
      setCurrentTimer(updatedTimer);
      return next;
    });

    broadcastSupabase('RoundPaused');

    if (token && !token.startsWith('mock-')) {
      try {
        await fetch('/api/timer/pause', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
      } catch {
        // ignore
      }
    }
    return true;
  };

  const resumeRound = async (): Promise<boolean> => {
    soundController.playClick();
    const remaining = currentTimer?.remaining_seconds || 600;
    const expiresAt = new Date(Date.now() + remaining * 1000).toISOString();

    setSnapshot((prev) => {
      if (!prev || !prev.timer) return prev;
      const updatedTimer: RoundTimer = {
        ...prev.timer,
        status: 'running',
        expires_at: expiresAt,
      };
      const next = { ...prev, timer: updatedTimer };
      saveStandaloneSnapshot(next);
      setCurrentTimer(updatedTimer);
      return next;
    });

    broadcastSupabase('RoundResumed', { expires_at: expiresAt });

    if (token && !token.startsWith('mock-')) {
      try {
        await fetch('/api/timer/resume', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
      } catch {
        // ignore
      }
    }
    return true;
  };

  const expireRound = async (): Promise<boolean> => {
    soundController.playClick();
    hasBuzzerPlayedRef.current = true;
    soundController.playBuzzer();

    setSnapshot((prev) => {
      if (!prev || !prev.timer) return prev;
      const updatedTimer: RoundTimer = {
        ...prev.timer,
        status: 'expired',
        remaining_seconds: 0,
      };
      const next = { ...prev, timer: updatedTimer };
      saveStandaloneSnapshot(next);
      setCurrentTimer(updatedTimer);
      return next;
    });

    broadcastSupabase('RoundTimeExpired');

    if (token && !token.startsWith('mock-')) {
      try {
        await fetch('/api/timer/expire', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
      } catch {
        // ignore
      }
    }
    return true;
  };

  const resetTimer = async (): Promise<boolean> => {
    soundController.playClick();
    hasBuzzerPlayedRef.current = false;

    setSnapshot((prev) => {
      if (!prev || !prev.timer) return prev;
      const dur = prev.timer.duration_seconds || 600;
      const updatedTimer: RoundTimer = {
        ...prev.timer,
        status: 'idle',
        remaining_seconds: dur,
        expires_at: null,
        started_at: null,
      };
      const next = { ...prev, timer: updatedTimer };
      saveStandaloneSnapshot(next);
      setCurrentTimer(updatedTimer);
      return next;
    });

    broadcastSupabase('RoundTimerReset');

    if (token && !token.startsWith('mock-')) {
      try {
        await fetch('/api/timer/reset', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
      } catch {
        // ignore
      }
    }
    return true;
  };

  const setTimerDuration = async (durationSeconds: number): Promise<boolean> => {
    soundController.playClick();

    setSnapshot((prev) => {
      if (!prev || !prev.timer) return prev;
      const updatedTimer: RoundTimer = {
        ...prev.timer,
        duration_seconds: durationSeconds,
        remaining_seconds: durationSeconds,
      };
      const next = { ...prev, timer: updatedTimer };
      saveStandaloneSnapshot(next);
      setCurrentTimer(updatedTimer);
      return next;
    });

    broadcastSupabase('RoundTimerDurationChanged', { durationSeconds });

    if (token && !token.startsWith('mock-')) {
      try {
        await fetch('/api/timer/duration', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ duration_seconds: durationSeconds }),
        });
      } catch {
        // ignore
      }
    }
    return true;
  };

  // Admin Round Management
  const selectRound = async (roundNumber: number): Promise<boolean> => {
    soundController.playClick();
    hasBuzzerPlayedRef.current = false;

    // Strict sequential rule: Cannot navigate to round N > 1 unless all matches in previous rounds are completed
    if (roundNumber > 1 && snapshot?.all_matches) {
      const prevIncomplete = snapshot.all_matches.some(
        (m) => m.round_id < roundNumber && m.status !== 'completed'
      );
      if (prevIncomplete) {
        addToast(
          'warning',
          'الجولة مغلقة (Round Locked)',
          `لا يمكن فتح الجولة ${roundNumber} قبل الانتهاء من جميع مباريات الجولة ${roundNumber - 1}.`
        );
        return false;
      }
    }

    setSnapshot((prev) => {
      if (!prev) return prev;
      const currentRoundMatches = prev.all_matches.filter((m) => m.round_id === roundNumber);
      const activeRound = prev.rounds.find((r) => r.round_number === roundNumber) || null;
      const next = {
        ...prev,
        current_round: roundNumber,
        active_round: activeRound,
        current_round_matches: currentRoundMatches,
      };
      saveStandaloneSnapshot(next);
      return next;
    });

    broadcastSupabase('RoundSelected', { roundNumber });

    if (token && !token.startsWith('mock-')) {
      try {
        await fetch(`/api/rounds/${roundNumber}/select`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
      } catch {
        // ignore
      }
    }
    return true;
  };

  const completeRound = async (roundNumber: number): Promise<boolean> => {
    soundController.playClick();

    if (!snapshot) return false;
    const matches = snapshot.current_round_matches;
    const pending = matches.some((m) => m.status === 'pending');
    if (pending) {
      addToast('error', 'Cannot Complete Round', 'All 5 matches must be recorded before completing the round.');
      return false;
    }

    soundController.playSuccess();
    const nextRoundNum = Math.min(5, roundNumber + 1);

    setSnapshot((prev) => {
      if (!prev) return prev;
      const updatedRounds = prev.rounds.map((r) => {
        if (r.round_number === roundNumber) {
          return { ...r, status: 'completed' as const, completed_at: new Date().toISOString() };
        }
        if (r.round_number === nextRoundNum) {
          return { ...r, status: 'active' as const, started_at: new Date().toISOString() };
        }
        return r;
      });
      const currentRoundMatches = prev.all_matches.filter((m) => m.round_id === nextRoundNum);
      const next = {
        ...prev,
        current_round: nextRoundNum,
        active_round: updatedRounds.find((r) => r.round_number === nextRoundNum) || null,
        rounds: updatedRounds,
        current_round_matches: currentRoundMatches,
      };
      saveStandaloneSnapshot(next);
      return next;
    });

    broadcastSupabase('RoundCompleted', { roundNumber });

    if (token && !token.startsWith('mock-')) {
      try {
        await fetch(`/api/rounds/${roundNumber}/complete`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
      } catch {
        // ignore
      }
    }
    return true;
  };

  // Match Results
  const submitResult = async (
    matchId: number,
    winnerTeamId: number | null,
    isDraw: boolean,
    notes?: string
  ): Promise<boolean> => {
    soundController.playClick();

    const targetMatch = snapshot?.all_matches.find((m) => m.id === matchId);
    const gameName = targetMatch?.game?.name_en || 'Match Station';

    // Strict sequential rule: cannot choose winner or submit result if previous rounds are not completed
    if (targetMatch && targetMatch.round_id > 1 && snapshot?.all_matches) {
      const prevIncomplete = snapshot.all_matches.some(
        (m) => m.round_id < targetMatch.round_id && m.status !== 'completed'
      );
      if (prevIncomplete) {
        addToast(
          'error',
          'الجولة غير متاحة (Round Locked)',
          `لا يمكن اختيار فائز أو تسجيل نتيجة في الجولة ${targetMatch.round_id} حتى تنتهي الجولة ${targetMatch.round_id - 1} بالكامل!`
        );
        return false;
      }
    }

    // Standalone update
    setSnapshot((prev) => {
      if (!prev) return prev;
      const updatedMatches = prev.all_matches.map((m) => {
        if (m.id === matchId) {
          return {
            ...m,
            status: 'completed' as const,
            result: {
              id: Date.now(),
              match_id: matchId,
              winner_team_id: winnerTeamId,
              is_draw: isDraw,
              submitted_by: { id: user?.id || 2, name: user?.name || 'Operator' },
              submitted_at: new Date().toISOString(),
              operator_notes: notes,
              is_corrected: false,
            },
          };
        }
        return m;
      });

      const thisMatchRoundId = targetMatch ? targetMatch.round_id : prev.current_round;
      const matchesInThisRound = updatedMatches.filter((m) => m.round_id === thisMatchRoundId);
      const isRoundNowFullyFinished = matchesInThisRound.length === 5 && matchesInThisRound.every((m) => m.status === 'completed');

      let nextRoundNum = prev.current_round;
      let updatedRounds = prev.rounds;

      if (isRoundNowFullyFinished && thisMatchRoundId < 5) {
        nextRoundNum = thisMatchRoundId + 1;
        updatedRounds = prev.rounds.map((r) => {
          if (r.round_number === thisMatchRoundId) {
            return { ...r, status: 'completed' as const, completed_at: new Date().toISOString() };
          }
          if (r.round_number === nextRoundNum) {
            return { ...r, status: 'active' as const, started_at: new Date().toISOString() };
          }
          return r;
        });
      } else if (isRoundNowFullyFinished && thisMatchRoundId === 5) {
        updatedRounds = prev.rounds.map((r) => {
          if (r.round_number === 5) {
            return { ...r, status: 'completed' as const, completed_at: new Date().toISOString() };
          }
          return r;
        });
      }

      const currentRoundMatches = updatedMatches.filter((m) => m.round_id === nextRoundNum);
      const next = {
        ...prev,
        current_round: nextRoundNum,
        active_round: updatedRounds.find((r) => r.round_number === nextRoundNum) || null,
        rounds: updatedRounds,
        all_matches: updatedMatches,
        current_round_matches: currentRoundMatches,
        leaderboard: computeLeaderboard(updatedMatches, prev.point_adjustments || {}),
        stats: computeStats(updatedMatches),
      };
      saveStandaloneSnapshot(next);
      return next;
    });

    soundController.playSuccess();
    addToast('success', 'Result Recorded', `${gameName}: Result officially recorded!`);

    if (targetMatch && targetMatch.round_id < 5) {
      const roundMatches = snapshot?.all_matches.filter((m) => m.round_id === targetMatch.round_id) || [];
      const pendingOthers = roundMatches.filter((m) => m.id !== matchId && m.status !== 'completed');
      if (pendingOthers.length === 0) {
        addToast(
          'success',
          'الجولة التالية مفتوحة!',
          `🎉 اكتملت جميع مباريات الجولة ${targetMatch.round_id}! تم فتح الجولة ${targetMatch.round_id + 1} تلقائياً.`
        );
        broadcastSupabase('RoundCompleted', { roundNumber: targetMatch.round_id });
      }
    }

    broadcastSupabase('MatchResultSubmitted', {
      matchId,
      winnerTeamId,
      isDraw,
      notes,
      operatorId: user?.id,
      operatorName: user?.name,
      game_name_en: gameName,
    });

    if (token && !token.startsWith('mock-')) {
      try {
        await fetch(`/api/matches/${matchId}/result`, {
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
      } catch {
        // ignore
      }
    }
    return true;
  };

  const correctResult = async (
    matchId: number,
    winnerTeamId: number | null,
    isDraw: boolean,
    reason: string,
    notes?: string
  ): Promise<boolean> => {
    soundController.playClick();

    const targetMatch = snapshot?.all_matches.find((m) => m.id === matchId);
    const gameName = targetMatch?.game?.name_en || 'Match Station';

    setSnapshot((prev) => {
      if (!prev) return prev;
      const updatedMatches = prev.all_matches.map((m) => {
        if (m.id === matchId) {
          return {
            ...m,
            status: 'completed' as const,
            result: {
              id: m.result?.id || Date.now(),
              match_id: matchId,
              winner_team_id: winnerTeamId,
              is_draw: isDraw,
              submitted_by: m.result?.submitted_by || { id: 1, name: 'Admin' },
              submitted_at: m.result?.submitted_at || new Date().toISOString(),
              is_corrected: true,
              corrected_by: { id: user?.id || 1, name: user?.name || 'Administrator' },
              corrected_at: new Date().toISOString(),
              correction_reason: reason,
              operator_notes: notes,
            },
          };
        }
        return m;
      });

      const currentRoundMatches = updatedMatches.filter((m) => m.round_id === prev.current_round);
      const next = {
        ...prev,
        all_matches: updatedMatches,
        current_round_matches: currentRoundMatches,
        leaderboard: computeLeaderboard(updatedMatches, prev.point_adjustments || {}),
        stats: computeStats(updatedMatches),
      };
      saveStandaloneSnapshot(next);
      return next;
    });

    soundController.playSuccess();
    addToast('info', 'Result Corrected', `${gameName}: Administrator corrected result.`);

    broadcastSupabase('MatchResultUpdated', {
      matchId,
      winnerTeamId,
      isDraw,
      reason,
      notes,
      game_name_en: gameName,
    });

    if (token && !token.startsWith('mock-')) {
      try {
        await fetch(`/api/matches/${matchId}/correct`, {
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
      } catch {
        // ignore
      }
    }
    return true;
  };

  // Admin Manual Points Adjustment (Add/Deduct points with reason)
  const adjustTeamPoints = async (teamId: number, delta: number, reason: string): Promise<boolean> => {
    soundController.playClick();
    if (!snapshot) return false;

    const team = snapshot.teams.find((t) => t.id === teamId);
    const teamName = team ? (team.name_ar || team.name) : `Team ${teamId}`;

    setSnapshot((prev) => {
      if (!prev) return prev;
      const currentAdj = prev.point_adjustments || {};
      const newBonus = (currentAdj[teamId] || 0) + delta;
      const updatedAdj = { ...currentAdj, [teamId]: newBonus };

      const updatedLeaderboard = computeLeaderboard(prev.all_matches, updatedAdj);
      const activity: ActivityLog = {
        id: Date.now(),
        user_name: user?.name || 'Administrator',
        action: 'POINTS_ADJUSTED',
        details: `${delta >= 0 ? `+${delta}` : delta} نقاط للفريق ${teamName}. السبب: ${reason}`,
        created_at: new Date().toISOString(),
      };

      const next = {
        ...prev,
        point_adjustments: updatedAdj,
        leaderboard: updatedLeaderboard,
        recent_activities: [activity, ...(prev.recent_activities || [])].slice(0, 25),
      };
      saveStandaloneSnapshot(next);
      return next;
    });

    soundController.playSuccess();
    addToast(
      'success',
      'تم تعديل النقاط',
      `تم تطبيق ${delta >= 0 ? `+${delta}` : delta} نقطة للفريق: ${teamName}`
    );

    broadcastSupabase('PointsAdjusted', { teamId, delta, reason });
    return true;
  };

  // Full Tournament Restart / Reset (Zero all matches, points, and timers)
  const resetTournament = async (): Promise<boolean> => {
    soundController.playClick();
    const fresh = createInitialSnapshot();
    const resetActivity: ActivityLog = {
      id: Date.now(),
      user_name: user?.name || 'Administrator',
      action: 'TOURNAMENT_RESET',
      details: 'تم تصفير البطولة بالكامل وإعادة ضبط جميع الجولات والنقاط والمؤقت المركزي.',
      created_at: new Date().toISOString(),
    };
    fresh.recent_activities = [resetActivity];

    setSnapshot(fresh);
    setCurrentTimer(fresh.timer);
    saveStandaloneSnapshot(fresh);

    soundController.playSuccess();
    addToast(
      'info',
      'تصفير البطولة',
      'تم تصفير جميع نتائج الجولات والنقاط بالكامل والعودة للجولة الأولى 1.'
    );

    broadcastSupabase('TournamentReset');

    if (token && !token.startsWith('mock-')) {
      try {
        await fetch('/api/tournament/reset', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
      } catch {
        // ignore
      }
    }
    return true;
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
        adjustTeamPoints,
        resetTournament,
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
