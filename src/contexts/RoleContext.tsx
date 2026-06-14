import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Role } from '../types';

interface RoleContextType {
  currentRole: Role | null;
  setRole: (role: Role) => void;
  clearRole: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<Role | null>(null);

  const setRole = useCallback((role: Role) => {
    setCurrentRole(role);
  }, []);

  const clearRole = useCallback(() => {
    setCurrentRole(null);
  }, []);

  return (
    <RoleContext.Provider value={{ currentRole, setRole, clearRole }}>
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
