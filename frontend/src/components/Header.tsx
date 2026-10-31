import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTournament } from '../context/TournamentContext';
import { soundController } from '../utils/audio';
import {
  Trophy,
  Shield,
  Smartphone,
  Tv,
  Globe,
  Volume2,
  VolumeX,
  UserCheck,
  Radio,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface HeaderProps {
  currentView: 'admin' | 'operator' | 'public';
  onViewChange: (view: 'admin' | 'operator' | 'public') => void;
  onOpenRoleModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onOpenRoleModal,
}) => {
  const { t, language, toggleLanguage } = useLanguage();
  const { user } = useAuth();
  const { currentTimer, isConnected } = useTournament();
  const [soundEnabled, setSoundEnabled] = useState(soundController.enabled);

  const toggleSound = () => {
    soundController.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      soundController.playClick();
    }
  };

  const remainingSeconds = currentTimer?.remaining_seconds ?? 600;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timerStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <header className="sticky top-0 z-40 bg-[#0B0E14]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Live Pulse */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/30">
            <Trophy className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base lg:text-lg font-black tracking-wider uppercase text-white m-0 leading-none">
                {t('app_title')}
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase bg-blue-500/10 text-cyan-400 border border-cyan-500/30">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 m-0 hidden sm:block">
              {t('app_tagline')}
            </p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <nav className="flex items-center p-1 bg-slate-900/90 rounded-xl border border-slate-800">
          <button
            onClick={() => onViewChange('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentView === 'admin'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('view_admin')}</span>
            <span className="sm:hidden">Admin</span>
          </button>

          <button
            onClick={() => onViewChange('operator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentView === 'operator'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('view_operator')}</span>
            <span className="sm:hidden">Operator</span>
          </button>

          <button
            onClick={() => onViewChange('public')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentView === 'public'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('view_public')}</span>
            <span className="sm:hidden">Arena</span>
          </button>
        </nav>

        {/* Action Controls & User Account */}
        <div className="flex items-center gap-2">
          {/* Central Timer Preview */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
            <span className="text-slate-400 uppercase text-[10px] font-bold">Timer:</span>
            <span className="font-mono-esports font-bold text-cyan-400">{timerStr}</span>
          </div>

          {/* Connection Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
            title={isConnected ? 'Real-time WebSocket Synchronized' : 'Reconnecting...'}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden xl:inline text-[11px] font-bold uppercase">{t('connected')}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                <span className="hidden xl:inline text-[11px] font-bold uppercase">{t('connecting')}</span>
              </>
            )}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Language Toggle (AR / EN) */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold transition-colors cursor-pointer"
            title="Switch Language / تبديل اللغة"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>{language === 'ar' ? 'EN' : 'العربية'}</span>
          </button>

          {/* User Account / Role Switcher */}
          <button
            onClick={onOpenRoleModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-xs font-bold text-blue-300 transition-all cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            <span className="max-w-[120px] truncate hidden md:inline">
              {user ? user.name : t('quick_switch')}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
