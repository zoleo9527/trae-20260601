import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Notification from './Notification';

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <Notification />
    </div>
  );
}
