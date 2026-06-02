import { Sidebar } from '@/components/Sidebar'
import { Outlet } from 'react-router-dom'

export function Layout() {
  return (
    <div className="min-h-screen bg-surface-base">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <div className="p-8 max-w-[1400px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
