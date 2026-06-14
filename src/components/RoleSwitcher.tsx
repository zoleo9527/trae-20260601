import { motion } from 'framer-motion';
import { User, Users, Shield } from 'lucide-react';
import { useRoleStore } from '../stores';
import { Role, ROLE_LABELS } from '../types';

const roleIcons: Record<Role, React.ReactNode> = {
  receptionist: <User className="w-5 h-5" />,
  professional: <Users className="w-5 h-5" />,
  supervisor: <Shield className="w-5 h-5" />
};

export function RoleSwitcher() {
  const { currentRole, switchRole } = useRoleStore();

  return (
    <div className="flex items-center gap-2 p-4 bg-white rounded-lg shadow-sm">
      <span className="text-sm font-medium text-gray-700">当前角色:</span>
      <div className="flex gap-2">
        {(['receptionist', 'professional', 'supervisor'] as Role[]).map((role) => (
          <motion.button
            key={role}
            onClick={() => switchRole(role)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentRole === role
                ? 'bg-blue-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {roleIcons[role]}
            {ROLE_LABELS[role]}
          </motion.button>
        ))}
      </div>
    </div>
  );
}