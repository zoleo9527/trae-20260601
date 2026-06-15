import React from 'react';
import {
  Calendar,
  ClipboardList,
  CheckSquare,
  AlertCircle,
  Clock,
  FileCheck,
  Home,
} from 'lucide-react';
import { useAppStore } from '../store/useStore';
import { Role, OrderStatus } from '../types';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const dispatcherNav = [
  { id: 'all', label: '全部订单', icon: ClipboardList, count: 'all' as OrderStatus | 'all' | 'my' },
  { id: 'scheduled', label: '已预约', icon: Calendar, count: 'scheduled' as OrderStatus | 'all' | 'my' },
  { id: 'assigned', label: '已派单', icon: FileCheck, count: 'assigned' as OrderStatus | 'all' | 'my' },
  { id: 'site_check', label: '现场确认中', icon: CheckSquare, count: 'site_check_pending' as OrderStatus | 'all' | 'my' },
  { id: 'delayed', label: '已延期', icon: Clock, count: 'delayed' as OrderStatus | 'all' | 'my' },
  { id: 'completed', label: '已完成', icon: CheckSquare, count: 'completed' as OrderStatus | 'all' | 'my' },
];

const installerNav = [
  { id: 'my_tasks', label: '我的任务', icon: ClipboardList, count: 'my' as OrderStatus | 'all' | 'my' },
  { id: 'pending_check', label: '待现场确认', icon: CheckSquare, count: 'site_check_pending' as OrderStatus | 'all' | 'my' },
  { id: 'installation', label: '安装中', icon: Home, count: 'installation' as OrderStatus | 'all' | 'my' },
  { id: 'completed', label: '已完成', icon: CheckSquare, count: 'completed' as OrderStatus | 'all' | 'my' },
  { id: 'failed', label: '确认不通过', icon: AlertCircle, count: 'site_check_failed' as OrderStatus | 'all' | 'my' },
];

const csNav = [
  { id: 'all', label: '全部订单', icon: ClipboardList, count: 'all' as OrderStatus | 'all' | 'my' },
  { id: 'pending_review', label: '待复核', icon: AlertCircle, count: 'pending_review' as OrderStatus | 'all' | 'my' },
  { id: 'rejected', label: '已驳回', icon: AlertCircle, count: 'rejected' as OrderStatus | 'all' | 'my' },
  { id: 'site_check_review', label: '现场确认回看', icon: CheckSquare, count: 'site_check_passed' as OrderStatus | 'all' | 'my' },
  { id: 'completed', label: '已完成', icon: CheckSquare, count: 'completed' as OrderStatus | 'all' | 'my' },
];

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const { currentUser, orders } = useAppStore();

  if (!currentUser) return null;

  const getNavItems = () => {
    switch (currentUser.role) {
      case 'dispatcher':
        return dispatcherNav;
      case 'installer':
        return installerNav;
      case 'customer_service':
        return csNav;
      default:
        return [];
    }
  };

  const getCount = (countType: OrderStatus | 'all' | 'my') => {
    if (countType === 'all') {
      return orders.length;
    }
    if (countType === 'my') {
      return orders.filter((o) => o.assignee === currentUser.id).length;
    }
    return orders.filter((o) => o.status === countType).length;
  };

  const navItems = getNavItems();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">卫浴安装队</div>
        <div className="text-xs text-muted mt-1">安装预约与现场确认</div>
      </div>
      <div className="sidebar-nav">
        <div className="sidebar-section">功能导航</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const count = getCount(item.count);
          return (
            <div
              key={item.id}
              className={`sidebar-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => onViewChange(item.id)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
              <span
                className="badge badge-gray"
                style={{ marginLeft: 'auto' }}
              >
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
