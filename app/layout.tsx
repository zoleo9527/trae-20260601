import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '音乐培训机构 - 陪练打卡与阶段点评系统',
  description: '音乐培训机构内部陪练打卡与阶段点评管理系统',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
      </body>
    </html>
  );
}
