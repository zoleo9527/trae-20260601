import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Role, SidebarItem } from '../../types';

interface AppLayoutProps {
  children: ReactNode;
  role: Role;
  sidebarItems: SidebarItem[];
}

export function AppLayout({ children, role, sidebarItems }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar role={role} items={sidebarItems} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar role={role} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
