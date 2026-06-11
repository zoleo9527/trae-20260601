import type { Metadata } from 'next';
import './globals.css';
import { AppHeader } from '@/components/AppHeader';

export const metadata: Metadata = {
  title: '奥特莱斯运营系统 - 销售上报与费用结算',
  description: '奥特莱斯销售上报、材料审核、费用结算全流程管理',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen flex flex-col">
          <AppHeader />
          <main className="flex-1">{children}</main>
          <footer className="bg-white border-t border-slate-200 py-4 text-center text-sm text-slate-500">
            奥特莱斯运营系统 v1.0
          </footer>
        </div>
      </body>
    </html>
  );
}
