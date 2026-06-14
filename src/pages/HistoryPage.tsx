import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, History } from 'lucide-react';
import { useAppealStore } from '../stores';
import { SearchBar, SearchFilters } from '../components/SearchBar';
import { HistoryList } from '../components/HistoryList';
import { DetailModal } from '../components/DetailModal';
import { Appeal } from '../types';

export function HistoryPage() {
  const navigate = useNavigate();
  const [filteredAppeals, setFilteredAppeals] = useState<Appeal[]>([]);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  
  const loadAppeals = useAppealStore((state) => state.loadAppeals);
  const appeals = useAppealStore((state) => state.appeals);
  const getOperationHistoryByAppealId = useAppealStore((state) => state.getOperationHistoryByAppealId);
  const getAttachmentsByAppealId = useAppealStore((state) => state.getAttachmentsByAppealId);

  useEffect(() => {
    loadAppeals();
  }, [loadAppeals]);

  useEffect(() => {
    setFilteredAppeals(appeals);
  }, [appeals]);

  const handleSearch = (filters: SearchFilters) => {
    let filtered = appeals;
    
    if (filters.appealNumber) {
      filtered = filtered.filter(a => 
        a.appealNumber.includes(filters.appealNumber)
      );
    }
    
    if (filters.customerName) {
      filtered = filtered.filter(a => 
        a.customerName.includes(filters.customerName)
      );
    }
    
    if (filters.status) {
      filtered = filtered.filter(a => a.status === filters.status);
    }
    
    setFilteredAppeals(filtered);
  };

  const handleCardClick = (appeal: Appeal) => {
    setSelectedAppeal(appeal);
  };

  const handleCloseModal = () => {
    setSelectedAppeal(null);
  };

  const operations = selectedAppeal ? getOperationHistoryByAppealId(selectedAppeal.id) : [];
  const attachments = selectedAppeal ? getAttachmentsByAppealId(selectedAppeal.id) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm mb-4 hover:bg-gray-50 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">返回工作台</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-blue-900" />
            <h1 className="text-2xl font-bold text-gray-900">
              流程回看
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            查询历史归档记录,查看完整流程链路和责任界定
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <SearchBar onSearch={handleSearch} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <HistoryList 
            appeals={filteredAppeals} 
            onCardClick={handleCardClick}
          />
        </motion.div>

        <DetailModal
          appeal={selectedAppeal}
          operations={operations}
          attachments={attachments}
          onClose={handleCloseModal}
        />
      </div>
    </div>
  );
}