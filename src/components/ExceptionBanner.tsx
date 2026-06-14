import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { useAppealStore } from '../stores';

export function ExceptionBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const exceptionList = useAppealStore((state) => state.getExceptionList());

  if (!isVisible || exceptionList.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-lg shadow-lg mb-4"
    >
      <motion.div
        animate={{
          opacity: [1, 0.7, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="flex items-center gap-3"
      >
        <AlertTriangle className="w-5 h-5" />
        <div className="flex-1">
          <span className="font-medium">异常提醒:</span>
          <span className="ml-2">
            {exceptionList.length}条申诉需要紧急处理
          </span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-red-700 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );
}