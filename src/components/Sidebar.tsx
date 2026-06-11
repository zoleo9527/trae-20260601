import React from 'react'

interface SidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
}

const menuItems = [
  { key: 'dashboard', label: '工作台', icon: '📊' },
  { key: 'projects', label: '项目管理', icon: '📁' },
]

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span>⚡ 弱电施工管理</span>
      </div>
      <nav className="sidebar-menu">
        {menuItems.map(item => (
          <div
            key={item.key}
            className={`sidebar-menu-item ${currentPage === item.key ? 'active' : ''}`}
            onClick={() => onNavigate(item.key)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
