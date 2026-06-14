import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, RefreshCw, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppealStore } from '../stores';
import { AppealForm } from './AppealForm';

export function QuickActions() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const resetData = useAppealStore((state) => state.resetData);

  return (
    <>
      <div className="flex gap-3 mb-4">
        <motion.button
          onClick={resetData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm font-medium">重置数据</span>
        </motion.button>
        
        <Link to="/history">
          <motion.button
            className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <History className="w-4 h-4" />
            <span className="text-sm font-medium">流程回看</span>
          </motion.button>
        </Link>
        
        <motion.button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">录入申诉</span>
        </motion.button>
      </div>
      
      <AppealForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </>
  );
}