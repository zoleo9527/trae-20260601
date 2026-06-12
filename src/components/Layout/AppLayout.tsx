import { Layout } from 'antd';
import type { ReactNode } from 'react';
import Sider from './Sider';
import Header from './Header';
import type { User, UserRole } from '@/types';

interface AppLayoutProps {
  children: ReactNode;
  currentUser: User;
  currentPath: string;
  onMenuClick: (key: string) => void;
  onRoleChange: (role: UserRole) => void;
}

export default function AppLayout({ children, currentUser, currentPath, onMenuClick, onRoleChange }: AppLayoutProps) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        currentUserRole={currentUser.role} 
        currentPath={currentPath} 
        onMenuClick={onMenuClick} 
      />
      <Layout>
        <Header currentUser={currentUser} onRoleChange={onRoleChange} />
        <Layout.Content style={{ padding: 24, background: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
          {children}
        </Layout.Content>
      </Layout>
    </Layout>
  );
}