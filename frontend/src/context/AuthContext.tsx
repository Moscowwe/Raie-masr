import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/tournament';

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  quickSwitch: (role: 'admin' | 'operator', stationNumber?: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ccc_token'));
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('ccc_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (token) {
      // Validate token with backend /api/auth/me
      fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem('ccc_user', JSON.stringify(data.user));
          } else {
            // Token expired or invalid
            setToken(null);
            setUser(null);
            localStorage.removeItem('ccc_token');
            localStorage.removeItem('ccc_user');
          }
        })
        .catch(() => {
          // If offline, keep local user state
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string = 'password123'): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.token && data.user) {
          setToken(data.token);
          setUser(data.user);
          localStorage.setItem('ccc_token', data.token);
          localStorage.setItem('ccc_user', JSON.stringify(data.user));
          return true;
        }
      }
    } catch {
      // Offline / Vercel cloud standalone fallback
    }

    // Standalone fallback user for Vercel
    let mockUser: User | null = null;
    if (email === 'admin@ccc.local') {
      mockUser = {
        id: 1,
        name: 'Main Administrator',
        email: 'admin@ccc.local',
        role: 'admin',
      };
    } else {
      const match = email.match(/operator(\d)@ccc\.local/);
      const station = match ? parseInt(match[1]) : 1;
      const gameNames = ['Prem Ball', 'Fish Hunters', 'Chair & Ball', 'Human Collision', 'Al-Fartas'];
      mockUser = {
        id: station + 1,
        name: `Operator ${gameNames[station - 1] || station}`,
        email,
        role: 'operator',
        game_id: station,
      };
    }

    const mockToken = 'mock-standalone-token-' + Date.now();
    setToken(mockToken);
    setUser(mockUser);
    localStorage.setItem('ccc_token', mockToken);
    localStorage.setItem('ccc_user', JSON.stringify(mockUser));
    return true;
  };

  const logout = async () => {
    if (token && !token.startsWith('mock-')) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });
      } catch (err) {
        // Ignore network errors on logout
      }
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('ccc_token');
    localStorage.removeItem('ccc_user');
  };

  const quickSwitch = async (role: 'admin' | 'operator', stationNumber: number = 1): Promise<boolean> => {
    const email = role === 'admin' ? 'admin@ccc.local' : `operator${stationNumber}@ccc.local`;
    return await login(email, 'password123');
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout, quickSwitch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
