import { roleMap, getInitial } from '../utils/format';
import type { UserRole } from '../../shared/types';

interface AvatarProps {
  name: string;
  role?: UserRole;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

export default function Avatar({ name, role, size = 'md' }: AvatarProps) {
  const roleStyle = role ? roleMap[role].className : 'bg-slate-200 text-slate-700';
  return (
    <div
      className={`${sizeMap[size]} ${roleStyle} rounded-full flex items-center justify-center font-semibold flex-shrink-0 select-none`}
    >
      {getInitial(name)}
    </div>
  );
}
