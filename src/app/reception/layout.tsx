'use client'

import Sidebar from '@/components/Sidebar'
import ToastContainer from '@/components/ToastContainer'

export default function ReceptionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-60">
        {children}
      </main>
      <ToastContainer />
    </div>
  )
}
