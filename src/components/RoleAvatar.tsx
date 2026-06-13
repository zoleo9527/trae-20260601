import type { UserRole } from '@/types';
import { ROLE_LABEL, ROLE_AVATAR_COLOR, USER_NAMES } from '@/constants';

interface Props {
  role: UserRole;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function RoleAvatar({ role, showName = true, size = 'md' }: Props) {
  const name = USER_NAMES[role];
  const initial = name.slice(-2, -1) || name.slice(0, 1);
  const color = ROLE_AVATAR_COLOR[role];
  const sizeMap = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };
  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeMap[size]} ${color} text-white rounded-full flex items-center justify-center font-medium font-serif`}
      >
        {initial}
      </div>
      {showName && (
        <div className="leading-tight">
          <div className="text-sm font-medium text-ink-800">{name}</div>
          <div className="text-[11px] text-ink-500">{ROLE_LABEL[role]}</div>
        </div>
      )}
    </div>
  );
}
