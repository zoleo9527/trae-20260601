import { User } from '@/types';
import { User as UserIcon } from 'lucide-react';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showRole?: boolean;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

const roleColors: Record<string, string> = {
  '食堂管理员': 'bg-blue-500',
  '年级主任': 'bg-purple-500',
  '财务': 'bg-green-500',
  '校长': 'bg-red-500',
  '家长': 'bg-gray-500',
};

export function UserAvatar({ user, size = 'md', showName = false, showRole = false }: UserAvatarProps) {
  const initial = user.name.charAt(0);
  const bgColor = roleColors[user.role] || 'bg-gray-500';

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} ${bgColor} text-white rounded-full flex items-center justify-center font-medium flex-shrink-0`}>
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          initial
        )}
      </div>
      {showName && (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">{user.name}</span>
          {showRole && <span className="text-xs text-gray-500">{user.role}</span>}
        </div>
      )}
    </div>
  );
}
