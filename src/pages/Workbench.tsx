import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { RoleSwitcher } from '../components/RoleSwitcher';
import { ExceptionBanner } from '../components/ExceptionBanner';
import { TodoList } from '../components/TodoList';
import { QuickActions } from '../components/QuickActions';
import { useAppealStore, useRoleStore } from '../stores';
import { ROLE_LABELS } from '../types';

export function Workbench() {
  const loadAppeals = useAppealStore((state) => state.loadAppeals);
  const currentRole = useRoleStore((state) => state.currentRole);

  useEffect(() => {
    loadAppeals();
  }, [loadAppeals]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            保险理赔中心 - 客户申诉与复核系统
          </h1>
          <p className="text-gray-600">
            当前角色: {ROLE_LABELS[currentRole]}工作台
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <RoleSwitcher />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <ExceptionBanner />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <QuickActions />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-3">待办事项</h2>
          <TodoList />
        </motion.div>
      </div>
    </div>
  );
}