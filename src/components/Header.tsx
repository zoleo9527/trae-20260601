import { User, Bell } from 'lucide-react';
import { useAppStore } from '../store/useStore';
import { mockUsers } from '../data/mockData';

export default function Header() {
  const { currentUser, setCurrentUser } = useAppStore();

  const roleLabels: Record<string, string> = {
    manager: '店长',
    supervisor: '区域督导',
    purchaser: '采购/仓配',
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <User className="w-8 h-8 text-gray-400 mr-3" />
          <div>
            <p className="font-medium text-gray-900">{currentUser.name}</p>
            <p className="text-sm text-gray-500">{roleLabels[currentUser.role]}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={currentUser.id}
            onChange={(e) => {
              const user = mockUsers.find(u => u.id === Number(e.target.value));
              if (user) setCurrentUser(user);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {mockUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({roleLabels[user.role]})
              </option>
            ))}
          </select>
          <button className="relative p-2 text-gray-500 hover:text-gray-700">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
