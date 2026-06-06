import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-warm-50">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
