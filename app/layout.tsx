import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '家电售后管理 - 返修投诉与回访处理',
  description: '家电售后返修投诉与回访处理工作台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-100">
        {children}
      </body>
    </html>
  );
}
