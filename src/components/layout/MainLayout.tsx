import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import GlobalBanner from '@/components/GlobalBanner';

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-ivory-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 p-8 overflow-auto scrollbar-thin animate-fade-in">
          <GlobalBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
