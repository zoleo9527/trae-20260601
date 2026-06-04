import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, Clock, AlertTriangle, CheckCircle2, Search, Filter, Eye, Play, Check, MessageSquare, Download, CheckSquare } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { BatchDetailDrawer } from '@/components/features/BatchDetailDrawer';
import { StatusFlow } from '@/components/features/StatusFlow';
import { useBatchStore } from '@/store/useBatchStore';
import { useAuthStore } from '@/store/useAuthStore';
import type { Batch, BatchStatus } from '@/types';

export function PackagingDashboard() {
  const { currentUser } = useAuthStore();
  const { batches, setSelectedBatchId, setIsDrawerOpen, updateBatchStatus, getNotesByBatchId, getStatusLogsByBatchId, batchCompleteTesting } = useBatchStore();
  const [selectedBatches, setSelectedBatches] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<BatchStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const stats = {
    pending: batches.filter((b) => b.currentStatus === 'PENDING_TEST').length,
    testing: batches.filter((b) => b.currentStatus === 'TESTING').length,
    abnormal: batches.filter((b) => b.currentStatus === 'TEST_ABNORMAL').length,
    passed: batches.filter((b) => b.currentStatus === 'TEST_PASSED').length,
    released: batches.filter((b) => b.currentStatus === 'RELEASED').length,
    rejected: batches.filter((b) => b.currentStatus === 'REJECTED').length,
  };

  const filteredBatches = batches.filter((batch) => {
    const matchesStatus = filterStatus === 'all' || batch.currentStatus === filterStatus;
    const matchesSearch = batch.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.batchNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const selectableIds = useMemo(() => {
    const idSet = new Set<string>();
    for (const b of filteredBatches) {
      if (b.currentStatus === 'TESTING') idSet.add(b.id);
    }
    return idSet;
  }, [filteredBatches]);

  const validSelectedIds = useMemo(() => {
    const valid = new Set<string>();
    for (const id of selectedBatches) {
      if (selectableIds.has(id)) valid.add(id);
    }
    return valid;
  }, [selectedBatches, selectableIds]);

  useEffect(() => {
    if (validSelectedIds.size !== selectedBatches.size) {
      setSelectedBatches(new Set(validSelectedIds));
    }
  }, [validSelectedIds, selectedBatches]);

  const handleViewDetail = (batchId: string) => {
    setSelectedBatchId(batchId);
    setIsDrawerOpen(true);
  };

  const handleStartTesting = (batchId: string) => {
    updateBatchStatus(batchId, 'TESTING', currentUser?.name || '王主管', 'packaging', '开始品控检测');
    setSelectedBatchId(batchId);
    setIsDrawerOpen(true);
  };

  const handleBatchSelect = (batchId: string) => {
    if (!selectableIds.has(batchId)) return;
    const newSelected = new Set(validSelectedIds);
    if (newSelected.has(batchId)) {
      newSelected.delete(batchId);
    } else {
      newSelected.add(batchId);
    }
    setSelectedBatches(newSelected);
  };

  const handleBatchSelectAll = () => {
    if (validSelectedIds.size === selectableIds.size && selectableIds.size > 0) {
      setSelectedBatches(new Set());
    } else {
      setSelectedBatches(new Set(selectableIds));
    }
  };

  const handleBatchPass = () => {
    const testingBatchIds = Array.from(validSelectedIds);
    if (testingBatchIds.length === 0) return;
    batchCompleteTesting(testingBatchIds, currentUser?.name || '王主管');
    setSelectedBatches(new Set());
  };

  const handleExportSelected = () => {
    alert(`已导出 ${validSelectedIds.size} 个批次的检测记录`);
  };

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar role="packaging" />

      <div className="flex-1">
        <Header title="品控检测工作台" />

        <main className="p-6">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard
              title="待检测批次"
              value={stats.pending}
              icon={<Clock className="w-6 h-6" />}
              color="amber"
              delay={0}
            />
            <StatCard
              title="检测中"
              value={stats.testing}
              icon={<FlaskConical className="w-6 h-6" />}
              color="blue"
              delay={0.1}
            />
            <StatCard
              title="异常批次"
              value={stats.abnormal}
              icon={<AlertTriangle className="w-6 h-6" />}
              color="orange"
              delay={0.2}
            />
            <StatCard
              title="检测通过"
              value={stats.passed}
              icon={<CheckCircle2 className="w-6 h-6" />}
              color="green"
              delay={0.3}
            />
          </div>

          {stats.abnormal > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-warning-50 border border-warning-orange/30 rounded-xl flex items-center gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-warning-orange flex-shrink-0 animate-pulse" />
              <div>
                <p className="font-medium text-warning-orange">异常批次提醒</p>
                <p className="text-sm text-neutral-600">当前有 {stats.abnormal} 个批次检测异常，销售内勤需评估后决定放行或退回</p>
              </div>
            </motion.div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="搜索批次号或产品名..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent w-72"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-neutral-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as BatchStatus | 'all')}
                  className="border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">全部状态</option>
                  <option value="PENDING_TEST">待检测</option>
                  <option value="TESTING">检测中</option>
                  <option value="TEST_PASSED">检测通过</option>
                  <option value="TEST_ABNORMAL">检测异常</option>
                </select>
              </div>
            </div>

            {validSelectedIds.size > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-600">已选 {validSelectedIds.size} 项</span>
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleBatchPass}
                >
                  <Check className="w-4 h-4 mr-1" />
                  批量通过
                </Button>
                <Button variant="secondary" size="sm" onClick={handleExportSelected}>
                  <Download className="w-4 h-4 mr-1" />
                  批量导出
                </Button>
              </div>
            )}
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={handleBatchSelectAll}
                        disabled={selectableIds.size === 0}
                        className={`p-1 rounded transition-colors ${selectableIds.size > 0 ? 'hover:bg-neutral-200' : 'opacity-40 cursor-not-allowed'}`}
                      >
                        <CheckSquare className={`w-4 h-4 ${validSelectedIds.size === selectableIds.size && selectableIds.size > 0 ? 'text-amber-900' : 'text-neutral-400'}`} />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">批次号</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">产品名称</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">发酵罐</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">数量</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">备注数</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">创建人</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredBatches.map((batch, index) => (
                    <BatchRow
                      key={batch.id}
                      batch={batch}
                      index={index}
                      isSelected={validSelectedIds.has(batch.id)}
                      canSelect={selectableIds.has(batch.id)}
                      onSelect={() => handleBatchSelect(batch.id)}
                      onViewDetail={() => handleViewDetail(batch.id)}
                      onStartTesting={() => handleStartTesting(batch.id)}
                      notesCount={getNotesByBatchId(batch.id).length}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </main>
      </div>

      <BatchDetailDrawer />
    </div>
  );
}

interface BatchRowProps {
  batch: Batch;
  index: number;
  isSelected: boolean;
  canSelect: boolean;
  onSelect: () => void;
  onViewDetail: () => void;
  onStartTesting: () => void;
  notesCount: number;
}

function BatchRow({ batch, index, isSelected, canSelect, onSelect, onViewDetail, onStartTesting, notesCount }: BatchRowProps) {
  const canTest = batch.currentStatus === 'PENDING_TEST';
  const isTestingNow = batch.currentStatus === 'TESTING';
  const isAbnormal = batch.currentStatus === 'TEST_ABNORMAL';

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`hover:bg-neutral-50 transition-colors ${isAbnormal ? 'bg-warning-50/50' : ''} ${isTestingNow ? 'bg-blue-50/30' : ''}`}
    >
      <td className="px-4 py-3">
        <button
          onClick={onSelect}
          disabled={!canSelect}
          className={`p-1 rounded transition-colors ${canSelect ? 'hover:bg-neutral-200' : 'opacity-40 cursor-not-allowed'}`}
        >
          <CheckSquare className={`w-4 h-4 ${isSelected && canSelect ? 'text-amber-900' : 'text-neutral-400'}`} />
        </button>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-mono text-neutral-800">{batch.batchNo}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-neutral-800">{batch.productName}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-neutral-600">{batch.tankNo}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-neutral-600">{batch.quantity} L</span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={batch.currentStatus} showPulse />
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1 text-sm text-neutral-600">
          <MessageSquare className="w-4 h-4" />
          {notesCount}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-neutral-600">{batch.createdBy}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onViewDetail}>
            <Eye className="w-4 h-4" />
          </Button>

          {canTest && (
            <Button variant="primary" size="sm" onClick={onStartTesting}>
              <FlaskConical className="w-4 h-4 mr-1" />
              开始检测
            </Button>
          )}

          {isTestingNow && (
            <Button variant="warning" size="sm" onClick={onViewDetail}>
              <FlaskConical className="w-4 h-4 mr-1" />
              继续检测
            </Button>
          )}
        </div>
      </td>
    </motion.tr>
  );
}
