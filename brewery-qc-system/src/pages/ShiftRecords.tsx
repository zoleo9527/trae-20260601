import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileBarChart, Search, Filter, Clock, User, ArrowRight, Eye, AlertTriangle, ClipboardList, CheckCircle2, XCircle, ArrowRightLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge, RoleBadge } from '@/components/ui/Badge';
import { BatchDetailDrawer } from '@/components/features/BatchDetailDrawer';
import { useBatchStore } from '@/store/useBatchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLE_DOT_COLORS } from '@/types';
import type { UserRole, BatchStatus } from '@/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function ShiftRecords() {
  const { currentUser } = useAuthStore();
  const { statusLogs, batches, setSelectedBatchId, setIsDrawerOpen, getBatchById } = useBatchStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');

  const filteredLogs = statusLogs
    .filter((log) => {
      const batch = getBatchById(log.batchId);
      const matchesSearch = batch?.batchNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batch?.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.remark.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRole === 'all' || log.role === filterRole;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => new Date(b.operatedAt).getTime() - new Date(a.operatedAt).getTime());

  const handleViewDetail = (batchId: string) => {
    setSelectedBatchId(batchId);
    setIsDrawerOpen(true);
  };

  const shiftStats = {
    pendingTest: batches.filter((b) => b.currentStatus === 'PENDING_TEST').length,
    testing: batches.filter((b) => b.currentStatus === 'TESTING').length,
    abnormal: batches.filter((b) => b.currentStatus === 'TEST_ABNORMAL').length,
    pendingRelease: batches.filter((b) => b.currentStatus === 'TEST_PASSED').length,
    released: batches.filter((b) => b.currentStatus === 'RELEASED').length,
    rejected: batches.filter((b) => b.currentStatus === 'REJECTED').length,
  };

  const attentionBatches = batches.filter(
    (b) => b.currentStatus === 'TEST_ABNORMAL' || b.currentStatus === 'REJECTED'
  );
  const nextShiftItems = batches.filter(
    (b) => b.currentStatus === 'PENDING_TEST' || b.currentStatus === 'TESTING' || b.currentStatus === 'TEST_PASSED' || b.currentStatus === 'TEST_ABNORMAL'
  );

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar role={currentUser.role} />

      <div className="flex-1">
        <Header title="交班记录" />

        <main className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="border-l-4 border-l-amber-900">
              <Card.Body>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-amber-900" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-800">本班待处理</h3>
                    <p className="text-xs text-neutral-500">当前需要关注的事项</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">待检测</span>
                    <span className="font-bold text-amber-900">{shiftStats.pendingTest}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">检测中</span>
                    <span className="font-bold text-blue-700">{shiftStats.testing}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">待放行</span>
                    <span className="font-bold text-hop-green">{shiftStats.pendingRelease}</span>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card className="border-l-4 border-l-warning-orange">
              <Card.Body>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-warning-50 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-warning-orange" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-800">需要关注</h3>
                    <p className="text-xs text-neutral-500">异常和拒签批次</p>
                  </div>
                </div>
                {attentionBatches.length > 0 ? (
                  <div className="space-y-2">
                    {attentionBatches.slice(0, 3).map((batch) => (
                      <div key={batch.id} className="flex items-center justify-between text-sm">
                        <span className="text-neutral-700 truncate flex-1 mr-2">{batch.productName}</span>
                        <StatusBadge status={batch.currentStatus} />
                      </div>
                    ))}
                    {attentionBatches.length > 3 && (
                      <p className="text-xs text-neutral-400">还有 {attentionBatches.length - 3} 项...</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-hop-green">暂无异常批次</p>
                )}
              </Card.Body>
            </Card>

            <Card className="border-l-4 border-l-hop-green">
              <Card.Body>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-hop-50 rounded-xl flex items-center justify-center">
                    <ArrowRightLeft className="w-5 h-5 text-hop-green" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-800">交班摘要</h3>
                    <p className="text-xs text-neutral-500">下一班需继续处理</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">待处理批次合计</span>
                    <span className="font-bold text-neutral-800">{nextShiftItems.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">本班已放行</span>
                    <span className="font-bold text-hop-green">{shiftStats.released}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">本班已拒签</span>
                    <span className="font-bold text-red-600">{shiftStats.rejected}</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>

          <Card className="mb-6">
            <Card.Body>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <FileBarChart className="w-6 h-6 text-amber-900" />
                </div>
                <div>
                  <h2 className="font-semibold text-neutral-800">操作记录追溯</h2>
                  <p className="text-sm text-neutral-500">查看所有批次的状态变更和操作记录，明确各环节责任</p>
                </div>
              </div>
            </Card.Body>
          </Card>

          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="搜索批次号、产品名或操作备注..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-neutral-500" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as UserRole | 'all')}
                className="border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">全部角色</option>
                <option value="brewer">酿酒师</option>
                <option value="packaging">包装主管</option>
                <option value="sales">销售内勤</option>
              </select>
            </div>
          </div>

          <Card>
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-px bg-neutral-200" />

              <div className="divide-y divide-neutral-100">
                {filteredLogs.map((log, index) => {
                  const batch = getBatchById(log.batchId);

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      className="relative pl-16 pr-6 py-5 hover:bg-neutral-50"
                    >
                      <div
                        className="absolute left-6 top-6 w-4 h-4 rounded-full border-2 border-white shadow-md"
                        style={{ backgroundColor: ROLE_DOT_COLORS[log.role] }}
                      />

                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-medium text-neutral-800">{log.remark}</span>
                            <RoleBadge role={log.role} />
                            {log.toStatus && (
                              <StatusBadge status={log.toStatus as BatchStatus} />
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-neutral-500 mb-2">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {log.operatedBy}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(new Date(log.operatedAt), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                            </span>
                            {log.fromStatus && (
                              <span className="text-neutral-400">
                                {log.fromStatus} → {log.toStatus}
                              </span>
                            )}
                          </div>

                          {batch && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-neutral-500">关联批次:</span>
                              <span className="font-mono text-neutral-700">{batch.batchNo}</span>
                              <ArrowRight className="w-4 h-4 text-neutral-300" />
                              <span className="text-neutral-700">{batch.productName}</span>
                              <Button variant="ghost" size="sm" className="ml-2" onClick={() => handleViewDetail(batch.id)}>
                                <Eye className="w-3 h-3 mr-1" />
                                详情
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {filteredLogs.length === 0 && (
                  <div className="py-12 text-center text-neutral-500">
                    <FileBarChart className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                    <p>暂无操作记录</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </main>
      </div>

      <BatchDetailDrawer />
    </div>
  );
}
