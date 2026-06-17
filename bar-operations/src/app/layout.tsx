import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '酒吧运营系统 - 酒水寄存与取用核销',
  description: '酒吧运营管理系统，专注酒水寄存与取用核销管理',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={inter.className}>
      <body className="min-h-screen bg-[#0D1117]">
        {children}
      </body>
    </html>
  )
}