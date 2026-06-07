import { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import BillDetail from './pages/BillDetail';
import BillList from './pages/BillList';
import ComplaintDetail from './pages/ComplaintDetail';
import ComplaintList from './pages/ComplaintList';

const FALLBACK_CONSTANTS = {
  statusLabels: {
    pending: '待处理',
    processing: '处理中',
    returned: '已退回',
    supplement_needed: '待补材料',
    closed: '已关闭',
    urged: '有人催'
  },
  roleLabels: {
    clerk: '站点文员',
    delivery: '配送员',
    customer_service: '客服'
  },
  _isFallback: true
};

function App() {
  const [constants, setConstants] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    
    fetch('/api/status')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (mounted) {
          if (data && data.statusLabels && data.roleLabels) {
            setConstants({ ...data, _isFallback: false });
          } else {
            setConstants({ ...FALLBACK_CONSTANTS, _isFallback: true });
          }
          setLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          console.warn('常量加载失败，使用降级常量:', err.message);
          setError(err.message);
          setConstants({ ...FALLBACK_CONSTANTS, _isFallback: true });
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>🥛 乳品配送站 - 月结账单与客户申诉系统</h1>
        <nav className="nav">
          <NavLink to="/bills" className={({ isActive }) => isActive ? 'active' : ''}>
            📋 月结账单
          </NavLink>
          <NavLink to="/complaints" className={({ isActive }) => isActive ? 'active' : ''}>
            📝 客户申诉
          </NavLink>
        </nav>
      </header>
      
      <div className="container">
        {constants && constants._isFallback && (
          <div style={{ 
            padding: '12px 16px', 
            background: '#fff3e0', 
            border: '1px solid #ffb74d', 
            borderRadius: '8px', 
            marginBottom: '20px',
            fontSize: '14px',
            color: '#e65100'
          }}>
            ⚠️ 系统常量加载超时，已使用本地默认配置。{error && ` (${error})`} 页面功能仍可正常使用。
          </div>
        )}
        
        {loading && !constants && (
          <div className="empty-state">
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⏳</div>
            <div style={{ fontSize: '16px', color: '#666' }}>正在加载系统配置...</div>
          </div>
        )}
        
        {(!loading || constants) && (
          <Routes>
            <Route path="/" element={<Navigate to="/bills" replace />} />
            <Route path="/bills" element={<BillList constants={constants} loading={loading} />} />
            <Route path="/bills/:id" element={<BillDetail constants={constants} loading={loading} />} />
            <Route path="/complaints" element={<ComplaintList constants={constants} loading={loading} />} />
            <Route path="/complaints/:id" element={<ComplaintDetail constants={constants} loading={loading} />} />
          </Routes>
        )}
      </div>
    </div>
  );
}

export default App;
