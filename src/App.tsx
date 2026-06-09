import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './stores/appStore';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SalesNew from './pages/SalesNew';
import SalesList from './pages/SalesList';
import ConfirmationList from './pages/ConfirmationList';
import WarehouseList from './pages/WarehouseList';
import Inventory from './pages/Inventory';
import Trace from './pages/Trace';
import Credit from './pages/Credit';

function App() {
  const { currentUser, initialize, loading } = useStore();

  useEffect(() => {
    initialize();
  }, []);

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <UserSelection />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sales/new" element={<SalesNew />} />
          <Route path="/sales/list" element={<SalesList />} />
          <Route path="/confirmation/list" element={<ConfirmationList />} />
          <Route path="/warehouse/list" element={<WarehouseList />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/trace/:id" element={<Trace />} />
          <Route path="/credit" element={<Credit />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

function UserSelection() {
  const { users, setCurrentUser } = useStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-dark to-primary-light">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-fadeIn">
        <h1 className="text-2xl font-bold text-center text-primary-dark mb-2">
          农资门店管理系统
        </h1>
        <p className="text-center text-gray-500 mb-8">农药销售与用药提醒</p>

        <p className="text-sm text-gray-600 mb-4">请选择您的身份：</p>

        <div className="space-y-3">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => setCurrentUser(user)}
              className="w-full p-4 bg-gray-50 hover:bg-primary-light hover:text-white rounded-xl transition-all duration-200 text-left flex items-center gap-3 group"
            >
              <div className="w-10 h-10 bg-primary-dark rounded-full flex items-center justify-center text-white font-bold">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium group-hover:text-white">{user.name}</p>
                <p className="text-xs text-gray-500 group-hover:text-white/80">
                  {user.role === 'owner' && '门店老板'}
                  {user.role === 'technician' && '农技员'}
                  {user.role === 'warehouse' && '仓管'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
