import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { users } from '@/data/mockData';
import { User, Users, GraduationCap } from 'lucide-react';

const roleIcons: Record<string, React.ReactNode> = {
  manager: <Users className="w-4 h-4" />,
  department: <User className="w-4 h-4" />,
  instructor: <GraduationCap className="w-4 h-4" />,
};

const roleColors: Record<string, string> = {
  manager: 'bg-blue-600 hover:bg-blue-700',
  department: 'bg-green-600 hover:bg-green-700',
  instructor: 'bg-purple-600 hover:bg-purple-700',
};

const roleNames: Record<string, string> = {
  manager: '培训经理',
  department: '部门负责人',
  instructor: '讲师',
};

export function RoleSwitcher() {
  const { currentUser, actions } = useAppStore();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">选择入口</h3>
      <div className="grid grid-cols-3 gap-3">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => actions.setCurrentUser(user)}
            className={cn(
              'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all duration-200',
              currentUser?.id === user.id
                ? `${roleColors[user.role]} border-transparent text-white`
                : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
            )}
          >
            {roleIcons[user.role]}
            <span className="text-xs font-medium">{user.name}</span>
            <span className="text-xs opacity-80">{roleNames[user.role]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}