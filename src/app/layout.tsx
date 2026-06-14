import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '摩托车驾培管理系统',
  description: '摩托车驾培考试批次与学员通知管理系统',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
