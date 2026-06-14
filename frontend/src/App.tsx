import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import LobbyManagerPage from './components/LobbyManagerPage';
import AccountManagerPage from './components/AccountManagerPage';
import OperationManagerPage from './components/OperationManagerPage';

function AppContent() {
  const { user } = useApp();

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {user.role === 'lobby_manager' && <LobbyManagerPage />}
        {user.role === 'account_manager' && <AccountManagerPage />}
        {user.role === 'operation_manager' && <OperationManagerPage />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
