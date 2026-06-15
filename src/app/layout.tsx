import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '家电售后-报修受理与上门预约系统',
  description: '家电售后服务管理系统 - 报修受理、上门预约、配件管理',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
