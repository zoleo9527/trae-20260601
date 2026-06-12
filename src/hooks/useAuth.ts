import { useAuth } from '@/context/AuthContext'

export { useAuth }

export function usePermissions() {
  const { user, hasRole } = useAuth()
  
  const isAdmin = hasRole(['admin'])
  const isSupervisor = hasRole(['supervisor', 'admin'])
  const isManager = hasRole(['manager', 'supervisor', 'admin'])
  const isAccountant = hasRole(['accountant', 'manager', 'supervisor', 'admin'])
  
  const canManageUsers = isAdmin
  const canApproveHandover = isSupervisor
  const canCreateHandover = isAccountant || isManager
  const canManageCustomers = isAccountant || isManager || isSupervisor
  const canViewAllCustomers = isSupervisor
  const canAddFollowUp = isManager || isSupervisor
  const canAddNote = isAccountant || isManager || isSupervisor
  
  return {
    user,
    isAdmin,
    isSupervisor,
    isManager,
    isAccountant,
    canManageUsers,
    canApproveHandover,
    canCreateHandover,
    canManageCustomers,
    canViewAllCustomers,
    canAddFollowUp,
    canAddNote,
    hasRole,
  }
}

export default usePermissions