import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Shield, Smartphone, LogOut, Check, X, User } from 'lucide-react';

interface RoleSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoleView?: (view: 'admin' | 'operator' | 'public') => void;
}

export const RoleSwitchModal: React.FC<RoleSwitchModalProps> = ({
  isOpen,
  onClose,
  onSelectRoleView,
}) => {
  const { user, quickSwitch, logout } = useAuth();
  const { t } = useLanguage();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  if (!isOpen) return null;

  const operators = [
    { station: 1, name: 'Operator 1', game: 'Prem Ball • بريم بول' },
    { station: 2, name: 'Operator 2', game: 'Fish Hunters • صيادين السمك' },
    { station: 3, name: 'Operator 3', game: 'Chair & Ball • كرسي و الكرة' },
    { station: 4, name: 'Operator 4', game: 'Human Collision • التصادم البشري' },
    { station: 5, name: 'Operator 5', game: 'Al-Fartas • الفرطاس' },
  ];

  const handleSwitch = async (role: 'admin' | 'operator', station?: number) => {
    const key = role === 'admin' ? 'admin' : `op${station}`;
    setLoadingRole(key);
    const success = await quickSwitch(role, station);
    setLoadingRole(null);
    if (success) {
      if (onSelectRoleView) {
        onSelectRoleView(role === 'admin' ? 'admin' : 'operator');
      }
      onClose();
    }
  };

  const handleLogout = () => {
    logout();
    if (onSelectRoleView) {
      onSelectRoleView('public');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-[#12161F] border border-slate-700/80 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white m-0">
              {t('quick_switch')}
            </h3>
            <p className="text-xs text-slate-400 m-0">
              Select an account to test permissions in real-time
            </p>
          </div>
        </div>

        {/* Current Active Account */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 mb-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {t('logged_in_as')}:
            </span>
            <span className="text-sm font-bold text-white">
              {user ? user.name : 'Read-Only Viewer'}
            </span>
            <span className="text-xs text-cyan-400 block font-mono-esports">
              {user ? user.email : 'Public Display Mode'}
            </span>
          </div>
          {user && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Accounts List */}
        <div className="space-y-2 mb-4">
          {/* Main Administrator */}
          <button
            onClick={() => handleSwitch('admin')}
            disabled={loadingRole !== null}
            className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
              user?.role === 'admin'
                ? 'bg-blue-600/20 border-cyan-500/50 text-white shadow-md'
                : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600/30 text-cyan-400">
                <Shield className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm text-white">Main Administrator</div>
                <div className="text-[11px] text-slate-400">Full tournament & timer control</div>
              </div>
            </div>
            {user?.role === 'admin' && <Check className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* 5 Operators */}
          <div className="pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Station Game Operators:
            </span>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {operators.map((op) => {
                const isActive = user?.role === 'operator' && user?.game_id === op.station;
                return (
                  <button
                    key={op.station}
                    onClick={() => handleSwitch('operator', op.station)}
                    disabled={loadingRole !== null}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600/20 border-cyan-500/50 text-white'
                        : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400">
                        <Smartphone className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-white">
                          Station {op.station}: {op.game}
                        </div>
                        <div className="text-[10px] text-slate-400">operator{op.station}@ccc.local</div>
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-cyan-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  );
};
