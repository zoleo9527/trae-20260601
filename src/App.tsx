import { Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import type { User } from './types';
import { ROLE_LABELS } from './types';
import Dashboard from './pages/Dashboard';
import FillingList from './pages/FillingList';
import FillingDetail from './pages/FillingDetail';
import FillingCreate from './pages/FillingCreate';
import PackagingList from './pages/PackagingList';
import PackagingDetail from './pages/PackagingDetail';
import PackagingCreate from './pages/PackagingCreate';
import NotificationsPanel from './components/NotificationsPanel';
import RoleSelector from './components/RoleSelector';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

export const AppContext = createContext<AppContextType>({
  currentUser: null,
  setCurrentUser: () => {},
  refreshTrigger: 0,
  triggerRefresh: () => {}
});

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(users => {
        if (users.length > 0 && !currentUser) {
          setCurrentUser(users[0]);
        }
      });
  }, []);

  const triggerRefresh = () => setRefreshTrigger(t => t + 1);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-beer-50 to-beer-100">
        <div className="text-center">
          <div className="text-6xl mb-4">🍺</div>
          <h1 className="text-3xl font-bold text-beer-800 mb-2">精酿酒厂</h1>
          <p className="text-beer-600 mb-8">灌装排产与包装领用系统</p>
          <div className="animate-pulse">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ currentUser, setCurrentUser, refreshTrigger, triggerRefresh }}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <span className="text-2xl">🍺</span>
                <h1 className="text-xl font-bold text-gray-900">精酿酒厂</h1>
                <nav className="hidden md:flex space-x-6 ml-8">
                  <button
                    onClick={() => navigate('/')}
                    className="text-gray-600 hover:text-beer-600 font-medium transition-colors"
                  >
                    工作台
                  </button>
                  <button
                    onClick={() => navigate('/filling')}
                    className="text-gray-600 hover:text-beer-600 font-medium transition-colors"
                  >
                    灌装排产
                  </button>
                  <button
                    onClick={() => navigate('/packaging')}
                    className="text-gray-600 hover:text-beer-600 font-medium transition-colors"
                  >
                    包装领用
                  </button>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <RoleSelector />
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-gray-500 hover:text-gray-700 relative"
                  >
                    <span className="text-xl">🔔</span>
                    <NotificationBadge />
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-96">
                      <NotificationsPanel onClose={() => setShowNotifications(false)} />
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 bg-beer-50 px-3 py-1.5 rounded-full">
                  <span className="text-lg">{currentUser.avatar || '👤'}</span>
                  <span className="text-sm font-medium text-gray-700">{currentUser.name}</span>
                  <span className="text-xs text-beer-600 bg-beer-100 px-2 py-0.5 rounded">
                    {ROLE_LABELS[currentUser.role]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/filling" element={<FillingList />} />
            <Route path="/filling/new" element={<FillingCreate />} />
            <Route path="/filling/:id" element={<FillingDetail />} />
            <Route path="/packaging" element={<PackagingList />} />
            <Route path="/packaging/new" element={<PackagingCreate />} />
            <Route path="/packaging/:id" element={<PackagingDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </AppContext.Provider>
  );
}

function NotificationBadge() {
  const { currentUser, refreshTrigger } = useContext(AppContext);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    fetch(`/api/notifications/${currentUser.id}`)
      .then(r => r.json())
      .then(notifs => {
        setUnread(notifs.filter((n: any) => !n.read).length);
      });
  }, [currentUser, refreshTrigger]);

  if (unread === 0) return null;
  return (
    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
      {unread > 9 ? '9+' : unread}
    </span>
  );
}

export default App;
