import type { Metadata } from 'next'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'

export const metadata: Metadata = {
  title: '康复治疗中心 - 治疗排班与签到消课',
  description: '康复治疗中心治疗排班与签到消课管理系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-navy-50">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
