import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserRole = 'TECHNICIAN' | 'WAREHOUSE_KEEPER' | 'FIELD_MANAGER';

interface User {
  id: string;
  name: string;
  role: UserRole;
}

interface RoleContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: User | null;
  usersByRole: Record<UserRole, User[]>;
  loading: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>('TECHNICIAN');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        setUsers(data);
      } catch (e) {
        console.error('Failed to load users:', e);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const usersByRole = users.reduce((acc, user) => {
    if (!acc[user.role]) acc[user.role] = [];
    acc[user.role].push(user);
    return acc;
  }, {} as Record<UserRole, User[]>);

  const currentUser = usersByRole[currentRole]?.[0] || null;

  return (
    <RoleContext.Provider value={{
      currentRole,
      setCurrentRole,
      currentUser,
      usersByRole,
      loading,
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
