import { useMemo } from 'react';
import type { UserRole } from '@/types';
import { ROLE_META } from '@/data/constants';

interface Props {
  name: string;
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

const SIZE_MAP = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
} as const;

export default function RoleAvatar({ name, role, size = 'md', showName = false }: Props) {
  const meta = ROLE_META[role];
  const initials = useMemo(() => {
    const clean = name.replace(/（.*）|\(.*\)/g, '').trim();
    return clean.length > 0 ? clean.slice(-2) : name.slice(0, 1);
  }, [name]);

  return (
    <div className="flex items-center gap-2">
      <div
        title={`${name} · ${meta.label}`}
        className={`${SIZE_MAP[size]} ${meta.avatarBg} rounded-md flex items-center justify-center text-white font-semibold shadow-sm ring-2 ring-white`}
      >
        {initials}
      </div>
      {showName && (
        <div className="leading-tight">
          <div className="text-xs font-medium text-slate-800">{name}</div>
          <div className={`text-[11px] ${meta.color}`}>{meta.label}</div>
        </div>
      )}
    </div>
  );
}
