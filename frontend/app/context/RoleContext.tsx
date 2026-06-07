import { createContext, useContext, useState, ReactNode } from 'react';

type UserRole = 'TECHNICIAN' | 'WAREHOUSE_KEEPER' | 'FIELD_MANAGER';

interface RoleContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: { id: string; name: string; role: UserRole } | null;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const ROLE_USERS: Record<UserRole, { id: string; name: string; role: UserRole }> = {
  TECHNICIAN: { id: 'tech-1', name: '李技术', role: 'TECHNICIAN' },
  WAREHOUSE_KEEPER: { id: 'keeper-1', name: '张仓管', role: 'WAREHOUSE_KEEPER' },
  FIELD_MANAGER: { id: 'manager-1', name: '刘场长', role: 'FIELD_MANAGER' },
};

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>('TECHNICIAN');

  return (
    <RoleContext.Provider value={{
      currentRole,
      setCurrentRole,
      currentUser: ROLE_USERS[currentRole],
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  TECHNICIAN: '养殖技术员',
  WAREHOUSE_KEEPER: '饲料仓管',
  FIELD_MANAGER: '场长',
};
