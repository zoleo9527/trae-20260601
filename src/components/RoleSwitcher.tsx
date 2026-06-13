import { ChevronDown, Users } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/store';
import { ROLE_LABEL, USER_NAMES } from '@/constants';
import type { UserRole } from '@/types';
import RoleAvatar from '@/components/RoleAvatar';
import { cn } from '@/lib/utils';

const roles: UserRole[] = ['recruiter', 'site_supervisor', 'payroll_accountant'];

const rolePermissions: Record<UserRole, string[]> = {
  recruiter: ['录入员工', '发起培训', '查看招聘备注'],
  site_supervisor: ['处理培训', '收集证件', '标记风险', '管理现场'],
  payroll_accountant: ['查看考勤争议', '核实证件', '复核工资'],
};

interface Props {
  horizontal?: boolean;
}

export default function RoleSwitcher({ horizontal = false }: Props) {
  const { currentUser, setCurrentRole } = useStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-3 py-2 rounded-[4px] border border-ink-100 bg-white hover:border-brand-200 transition-colors',
          horizontal && 'w-auto'
        )}
      >
        <RoleAvatar role={currentUser.role} size="sm" showName={!horizontal} />
        {horizontal && (
          <div className="text-left">
            <div className="text-sm font-medium text-ink-800">
              {USER_NAMES[currentUser.role]}
            </div>
            <div className="text-[11px] text-ink-500">
              {ROLE_LABEL[currentUser.role]}
            </div>
          </div>
        )}
        <ChevronDown
          size={16}
          className={cn('text-ink-400 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-[6px] border border-ink-100 shadow-card-hover z-20 overflow-hidden animate-slide-up">
            <div className="px-4 py-2 bg-ink-50 border-b border-ink-100">
              <div className="flex items-center gap-2 text-xs text-ink-500">
                <Users size={14} />
                切换角色视角
              </div>
            </div>
            <div className="p-2">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    setCurrentRole(role);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full text-left p-3 rounded-[4px] transition-colors',
                    currentUser.role === role
                      ? 'bg-brand-50 border border-brand-200'
                      : 'hover:bg-ink-50'
                  )}
                >
                  <div className="flex items-center gap-3 mb-1.5">
                    <RoleAvatar role={role} size="sm" showName />
                  </div>
                  <div className="ml-9 flex flex-wrap gap-1">
                    {rolePermissions[role].map((perm) => (
                      <span
                        key={perm}
                        className="text-[10px] px-1.5 py-0.5 bg-ink-100 text-ink-600 rounded"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
