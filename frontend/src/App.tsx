import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { TournamentProvider } from './context/TournamentContext';
import { Header } from './components/Header';
import { ToastContainer } from './components/ToastContainer';
import { RoleSwitchModal } from './components/modals/RoleSwitchModal';
import { AdminView } from './views/AdminView';
import { OperatorView } from './views/OperatorView';
import { PublicView } from './views/PublicView';

const MainLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState<'admin' | 'operator' | 'public'>('admin');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col font-sans bg-grid-pattern">
      {/* Navigation Header */}
      <Header
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'admin' && <AdminView />}
        {currentView === 'operator' && <OperatorView />}
        {currentView === 'public' && <PublicView />}
      </main>

      {/* Role Switcher Modal */}
      <RoleSwitchModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onSelectRoleView={(view) => setCurrentView(view)}
      />

      {/* Real-time Broadcast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <TournamentProvider>
          <MainLayout />
        </TournamentProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
