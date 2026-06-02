import Sidebar from '@/components/Sidebar'
import { Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#0f0f23] p-6">
        <Outlet />
      </main>
    </div>
  )
}
