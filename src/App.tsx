import { useState } from 'react';
import { useWorkbench } from './context/WorkbenchContext';
import { BatchAdjustmentPage } from './components/BatchAdjustmentPage';
import { InventoryAlertPage } from './components/InventoryAlertPage';
import { TodoTaskPage } from './components/TodoTaskPage';
import { ProcessingRecordsPage } from './components/ProcessingRecordsPage';
import { Badge } from './components/common';
import { Role } from './types';

type PageType = 'adjustment' | 'alert' | 'task' | 'record';

const roleUsers: Record<Role, { name: string; displayName: string }[]> = {
  clerk: [
    { name: '张三', displayName: '张三（店员）' },
    { name: '李四', displayName: '李四（店员）' }
  ],
  manager: [
    { name: '王经理', displayName: '王经理（店长）' }
  ],
  buyer: [
    { name: '采购刘', displayName: '采购刘（采购）' }
  ]
};

function App() {
  const { currentRole, setCurrentRole, currentUserName, setCurrentUserName, notifications } = useWorkbench();
  const [activePage, setActivePage] = useState<PageType>('adjustment');
  const [showSimplificationNotes, setShowSimplificationNotes] = useState(false);

  const roleLabels: Record<Role, string> = {
    clerk: '店员',
    manager: '店长',
    buyer: '采购'
  };

  const unreadCount = notifications.filter(n => !n.read && 
    (n.targetRole === currentRole || n.targetRole === 'all')).length;

  const handleRoleChange = (role: Role) => {
    setCurrentRole(role);
    const users = roleUsers[role];
    if (users.length > 0) {
      setCurrentUserName(users[0].name);
    }
  };

  const navItems = [
    { key: 'adjustment' as PageType, label: '批号处理', icon: '📦' },
    { key: 'alert' as PageType, label: '库存预警', icon: '⚠️' },
    { key: 'task' as PageType, label: '待办任务', icon: '📋', badge: unreadCount },
    { key: 'record' as PageType, label: '处理记录', icon: '📊' },
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'adjustment':
        return <BatchAdjustmentPage />;
      case 'alert':
        return <InventoryAlertPage />;
      case 'task':
        return <TodoTaskPage />;
      case 'record':
        return <ProcessingRecordsPage />;
      default:
        return <BatchAdjustmentPage />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ 
        width: '220px', 
        backgroundColor: '#001529', 
        color: '#fff',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #1f2d3d' }}>
          <h1 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
            🍼 母婴零售店工作台
          </h1>
        </div>
        
        <div style={{ padding: '12px', borderBottom: '1px solid #1f2d3d' }}>
          <div style={{ fontSize: '12px', color: '#8b9dc3', marginBottom: '8px' }}>当前角色</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(Object.keys(roleLabels) as Role[]).map(role => (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '4px',
                  backgroundColor: currentRole === role ? '#1890ff' : '#1f2d3d',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                {roleLabels[role]}
              </button>
            ))}
          </div>
          <div style={{ marginTop: '8px' }}>
            <select
              value={currentUserName}
              onChange={(e) => setCurrentUserName(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '4px',
                backgroundColor: '#1f2d3d',
                color: '#fff',
                border: '1px solid #2f4050',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {roleUsers[currentRole].map(user => (
                <option key={user.name} value={user.name}>{user.displayName}</option>
              ))}
            </select>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px' }}>
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setActivePage(item.key)}
              style={{
                width: '100%',
                padding: '12px 16px',
                marginBottom: '4px',
                borderRadius: '4px',
                backgroundColor: activePage === item.key ? '#1890ff' : 'transparent',
                color: '#fff',
                border: 'none',
                textAlign: 'left',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'background-color 0.2s'
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && item.badge > 0 && (
                <Badge color="red">{item.badge}</Badge>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: '12px', borderTop: '1px solid #1f2d3d' }}>
          <button
            onClick={() => setShowSimplificationNotes(!showSimplificationNotes)}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '4px',
              backgroundColor: showSimplificationNotes ? '#1890ff' : 'transparent',
              color: '#fff',
              border: 'none',
              textAlign: 'left',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'background-color 0.2s'
            }}
          >
            <span>📝</span>
            <span>简化说明</span>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ 
          backgroundColor: '#fff', 
          padding: '12px 20px', 
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
              {navItems.find(n => n.key === activePage)?.label}
            </h2>
            <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0' }}>
              当前用户: {currentUserName} ({roleLabels[currentRole]}) | 门店: 朝阳区店
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
          {renderPage()}
        </main>
      </div>

      {showSimplificationNotes && (
        <div style={{ 
          width: '320px', 
          backgroundColor: '#fff', 
          borderLeft: '1px solid #e8e8e8',
          padding: '20px',
          overflow: 'auto'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
            📝 简化说明
          </h3>
          
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#4080ff' }}>
              🔐 权限设计
            </h4>
            <ul style={{ fontSize: '12px', color: '#666', paddingLeft: '20px', margin: 0 }}>
              <li>店员: 提交批号调整申请</li>
              <li>店长: 审核申请、调整预警阈值</li>
              <li>采购: 处理库存预警、录入供应商批号</li>
              <li>暂不实现行级权限控制</li>
            </ul>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#52c41a' }}>
              📎 附件处理
            </h4>
            <ul style={{ fontSize: '12px', color: '#666', paddingLeft: '20px', margin: 0 }}>
              <li>支持PDF、图片、文档格式</li>
              <li>单个文件不超过10MB</li>
              <li>每申请最多5个附件</li>
              <li>暂不实现在线预览</li>
            </ul>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#fa8c16' }}>
              🔔 通知机制
            </h4>
            <ul style={{ fontSize: '12px', color: '#666', paddingLeft: '20px', margin: 0 }}>
              <li>系统内消息通知</li>
              <li>邮件通知（需绑定邮箱）</li>
              <li>暂不集成钉钉/企业微信</li>
              <li>暂不支持个性化订阅</li>
            </ul>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#ff4d4f' }}>
              🔗 外部系统
            </h4>
            <ul style={{ fontSize: '12px', color: '#666', paddingLeft: '20px', margin: 0 }}>
              <li>供应商系统: 手动录入批号</li>
              <li>收银系统: 手动盘点更新</li>
              <li>物流系统: 手动确认到货</li>
              <li>预留接口供后续集成</li>
            </ul>
          </div>

          <div style={{ padding: '12px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px' }}>
            <p style={{ fontSize: '12px', color: '#52c41a', margin: 0 }}>
              💡 <strong>提示:</strong> 修改批号后，库存预警会自动联动刷新状态，确保信息同步。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
