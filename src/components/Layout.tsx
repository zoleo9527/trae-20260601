import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import RoleSwitcher from '@/components/RoleSwitcher'

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <RoleSwitcher />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
