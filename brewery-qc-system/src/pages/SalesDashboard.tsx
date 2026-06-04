import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Clock, Search, Eye, MessageSquare, Send, FileCheck, CheckSquare, Download, ChevronDown, ChevronRight, User } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, RoleBadge } from '@/components/ui/Badge';
import { BatchDetailDrawer } from '@/components/features/BatchDetailDrawer';
import { StatusFlow } from '@/components/features/StatusFlow';
import { useBatchStore } from '@/store/useBatchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLE_DOT_COLORS } from '@/types';
import type { Batch, Note, TestRecord } from '@/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function SalesDashboard() {
  const { currentUser } = useAuthStore();
  const {
    batches, setSelectedBatchId, setIsDrawerOpen,
    updateBatchStatus, addNote, getNotesByBatchId, getTestRecordsByBatchId,
    getStatusLogsByBatchId, batchRelease, batchReject,
  } = useBatchStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'abnormal' | 'history'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatches, setSelectedBatches] = useState<Set<string>>(new Set());
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [releaseNote, setReleaseNote] = useState('');
  const [releasingBatch, setReleasingBatch] = useState<string | null>(null);

  const stats = {
    pending: batches.filter((b) => b.currentStatus === 'TEST_PASSED' || b.currentStatus === 'TEST_ABNORMAL').length,
    abnormal: batches.filter((b) => b.currentStatus === 'TEST_ABNORMAL').length,
    released: batches.filter((b) => b.currentStatus === 'RELEASED').length,
    rejected: batches.filter((b) => b.currentStatus === 'REJECTED').length,
  };

  const pendingBatches = batches.filter((b) =>
    b.currentStatus === 'TEST_PASSED' || b.currentStatus === 'TEST_ABNORMAL'
  );
  const abnormalBatches = batches.filter((b) => b.currentStatus === 'TEST_ABNORMAL');
  const historyBatches = batches.filter((b) =>
    b.currentStatus === 'RELEASED' || b.currentStatus === 'REJECTED'
  );

  let displayBatches: Batch[];
  switch (activeTab) {
    case 'abnormal': displayBatches = abnormalBatches; break;
    case 'history': displayBatches = historyBatches; break;
    default: displayBatches = pendingBatches;
  }

  displayBatches = displayBatches.filter((batch) =>
    batch.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    batch.batchNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDetail = (batchId: string) => {
    setSelectedBatchId(batchId);
    setIsDrawerOpen(true);
  };

  const handleBatchSelect = (batchId: string) => {
    const newSelected = new Set(selectedBatches);
    if (newSelected.has(batchId)) newSelected.delete(batchId);
    else newSelected.add(batchId);
    setSelectedBatches(newSelected);
  };

  const handleBatchRelease = (batchId: string, isApproved: boolean) => {
    const userName = currentUser?.name || '刘内勤';
    if (isApproved) {
      batchRelease([batchId], userName, releaseNote || '已放行，可安排发货');
    } else {
      batchReject([batchId], userName, releaseNote || '已拒签，退回重检');
    }
    setReleasingBatch(null);
    setReleaseNote('');
  };

  const handleBatchAction = (isApproved: boolean) => {
    const userName = currentUser?.name || '刘内勤';
    const ids = Array.from(selectedBatches);
    if (isApproved) {
      batchRelease(ids, userName, '批量放行');
    } else {
      batchReject(ids, userName, '批量拒签');
    }
    setSelectedBatches(new Set());
  };

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar role="sales" />
      <div className="flex-1">
        <Header title="放行判断中心" />
        <main className="p-6">
          {stats.abnormal > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 animate-pulse" />
              <div className="flex-1">
                <p className="font-medium text-red-700">异常批次提醒</p>
                <p className="text-sm text-red-600">当前有 {stats.abnormal} 个批次检测异常，请仔细评估后再做放行决定</p>
              </div>
              <Button variant="danger" size="sm" onClick={() => setActiveTab('abnormal')}>
                立即查看
              </Button>
            </motion.div>
          )}

          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard title="待放行批次" value={stats.pending} icon={<Clock className="w-6 h-6" />} color="amber" delay={0} />
            <StatCard title="其中异常" value={stats.abnormal} icon={<AlertTriangle className="w-6 h-6" />} color="orange" delay={0.1} />
            <StatCard title="今日已放行" value={stats.released} icon={<CheckCircle2 className="w-6 h-6" />} color="green" delay={0.2} />
            <StatCard title="已拒签" value={stats.rejected} icon={<XCircle className="w-6 h-6" />} color="red" delay={0.3} />
          </div>

          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1 bg-neutral-100 rounded-lg p-1">
                    <button
                      onClick={() => setActiveTab('pending')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'pending' ? 'bg-white text-amber-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-800'}`}
                    >
                      全部待放行
                    </button>
                    <button
                      onClick={() => setActiveTab('abnormal')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'abnormal' ? 'bg-white text-amber-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-800'}`}
                    >
                      异常批次
                      {stats.abnormal > 0 && (
                        <span className="bg-warning-orange text-white text-xs px-1.5 py-0.5 rounded-full">{stats.abnormal}</span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('history')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-white text-amber-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-800'}`}
                    >
                      处理记录
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {selectedBatches.size > 0 && (
                    <>
                      <span className="text-sm text-neutral-600">已选 {selectedBatches.size} 项</span>
                      <Button variant="success" size="sm" onClick={() => handleBatchAction(true)}>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        批量放行
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleBatchAction(false)}>
                        <XCircle className="w-4 h-4 mr-1" />
                        批量拒签
                      </Button>
                    </>
                  )}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="搜索批次..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent w-64"
                    />
                  </div>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="divide-y divide-neutral-200">
                {displayBatches.length === 0 ? (
                  <div className="py-12 text-center text-neutral-500">
                    <FileCheck className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                    <p>暂无批次数据</p>
                  </div>
                ) : (
                  displayBatches.map((batch, index) => (
                    <ReleaseBatchCard
                      key={batch.id}
                      batch={batch}
                      index={index}
                      isSelected={selectedBatches.has(batch.id)}
                      onSelect={() => handleBatchSelect(batch.id)}
                      isExpanded={expandedBatch === batch.id}
                      onToggleExpand={() => setExpandedBatch(expandedBatch === batch.id ? null : batch.id)}
                      onViewDetail={() => handleViewDetail(batch.id)}
                      onRelease={(isApproved) => handleBatchRelease(batch.id, isApproved)}
                      isReleasing={releasingBatch === batch.id}
                      releaseNote={releaseNote}
                      onReleaseNoteChange={setReleaseNote}
                      onStartRelease={() => setReleasingBatch(batch.id)}
                      onCancelRelease={() => { setReleasingBatch(null); setReleaseNote(''); }}
                      notes={getNotesByBatchId(batch.id)}
                      testRecords={getTestRecordsByBatchId(batch.id)}
                      statusLogs={getStatusLogsByBatchId(batch.id)}
                    />
                  ))
                )}
              </div>
            </Card.Body>
          </Card>
        </main>
      </div>
      <BatchDetailDrawer />
    </div>
  );
}

interface ReleaseBatchCardProps {
  batch: Batch;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onViewDetail: () => void;
  onRelease: (isApproved: boolean) => void;
  isReleasing: boolean;
  releaseNote: string;
  onReleaseNoteChange: (value: string) => void;
  onStartRelease: () => void;
  onCancelRelease: () => void;
  notes: Note[];
  testRecords: TestRecord[];
  statusLogs: any[];
}

function ReleaseBatchCard({
  batch, index, isSelected, onSelect, isExpanded, onToggleExpand,
  onViewDetail, onRelease, isReleasing, releaseNote, onReleaseNoteChange,
  onStartRelease, onCancelRelease, notes, testRecords, statusLogs,
}: ReleaseBatchCardProps) {
  const isAbnormal = batch.currentStatus === 'TEST_ABNORMAL';
  const isHistory = batch.currentStatus === 'RELEASED' || batch.currentStatus === 'REJECTED';
  const latestTest = testRecords[0];
  const brewerNotes = notes.filter((n) => n.role === 'brewer');
  const packagingNotes = notes.filter((n) => n.role === 'packaging');
  const salesNotes = notes.filter((n) => n.role === 'sales');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`${isAbnormal ? 'bg-warning-50/30' : ''} ${isExpanded ? 'bg-neutral-50' : ''}`}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {!isHistory && (
            <button onClick={onSelect} className="p-1 hover:bg-neutral-200 rounded mt-1">
              <CheckSquare className={`w-4 h-4 ${isSelected ? 'text-amber-900' : 'text-neutral-400'}`} />
            </button>
          )}

          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isAbnormal ? 'bg-warning-orange/10' :
            batch.currentStatus === 'RELEASED' ? 'bg-green-100' :
            batch.currentStatus === 'REJECTED' ? 'bg-red-100' : 'bg-amber-100'
          }`}>
            {isAbnormal ? <AlertTriangle className="w-6 h-6 text-warning-orange" /> :
             batch.currentStatus === 'RELEASED' ? <CheckCircle2 className="w-6 h-6 text-green-600" /> :
             batch.currentStatus === 'REJECTED' ? <XCircle className="w-6 h-6 text-red-600" /> :
             <Clock className="w-6 h-6 text-amber-900" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-neutral-800">{batch.productName}</h3>
                  <StatusBadge status={batch.currentStatus} showPulse />
                  {isAbnormal && (
                    <span className="text-xs bg-warning-orange text-white px-2 py-0.5 rounded-full animate-pulse">
                      需重点关注
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500">
                  <span className="font-mono">{batch.batchNo}</span>
                  <span>{batch.tankNo}</span>
                  <span>{batch.quantity} L</span>
                </div>
              </div>

              {!isHistory && (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={onToggleExpand}>
                    <Eye className="w-4 h-4 mr-1" />
                    {isExpanded ? '收起' : '回看记录'}
                  </Button>
                  <Button variant="primary" size="sm" onClick={onStartRelease}>
                    <Send className="w-4 h-4 mr-1" />
                    放行判断
                  </Button>
                </div>
              )}

              {isHistory && (
                <Button variant="ghost" size="sm" onClick={onToggleExpand}>
                  {isExpanded ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                  {isExpanded ? '收起' : '查看详情'}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-sm text-neutral-500">
                <MessageSquare className="w-4 h-4" />
                {notes.length} 条备注
              </span>
              {brewerNotes.length > 0 && (
                <span className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ROLE_DOT_COLORS.brewer }} />
                  酿酒师 {brewerNotes.length}
                </span>
              )}
              {packagingNotes.length > 0 && (
                <span className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ROLE_DOT_COLORS.packaging }} />
                  品控 {packagingNotes.length}
                </span>
              )}
              {salesNotes.length > 0 && (
                <span className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ROLE_DOT_COLORS.sales }} />
                  放行 {salesNotes.length}
                </span>
              )}
            </div>

            {latestTest && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-neutral-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-neutral-500">最新检测结论</span>
                  <span className="text-xs text-neutral-400">
                    {latestTest.testedBy} · {format(new Date(latestTest.testedAt), 'MM-dd HH:mm', { locale: zhCN })}
                  </span>
                  <RoleBadge role="packaging" />
                </div>
                <p className={`text-sm ${latestTest.isAbnormal ? 'text-warning-orange font-medium' : 'text-neutral-700'}`}>
                  {latestTest.conclusion}
                </p>
                {latestTest.items.filter((i) => !i.isPass).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {latestTest.items.filter((i) => !i.isPass).map((item) => (
                      <span key={item.id} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full">
                        {item.itemName}: {item.value} (标准: {item.standard})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isReleasing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-white rounded-xl border-2 border-amber-200"
              >
                <p className="text-sm font-medium text-neutral-800 mb-3">放行判断确认</p>
                <div className="mb-4">
                  <label className="text-xs text-neutral-500 mb-1 block">添加放行备注（将流转给所有相关人员）</label>
                  <textarea
                    value={releaseNote}
                    onChange={(e) => onReleaseNoteChange(e.target.value)}
                    placeholder="请输入放行备注或拒签原因..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="success" onClick={() => onRelease(true)}>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    确认放行
                  </Button>
                  <Button variant="danger" onClick={() => onRelease(false)}>
                    <XCircle className="w-4 h-4 mr-1" />
                    拒签退回
                  </Button>
                  <Button variant="ghost" onClick={onCancelRelease}>
                    取消
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-5 pb-5 border-t border-neutral-100"
        >
          <div className="pt-4 space-y-4">
            <StatusFlow currentStatus={batch.currentStatus} statusLogs={statusLogs} />

            {testRecords.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-neutral-800 mb-2">检测记录回看</h4>
                {testRecords.map((record) => (
                  <div key={record.id} className="bg-white rounded-lg p-3 border border-neutral-200 mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-neutral-800">
                        {format(new Date(record.testedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                      </span>
                      <div className="flex items-center gap-2">
                        <RoleBadge role="packaging" />
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${record.isAbnormal ? 'bg-warning-50 text-warning-orange' : 'bg-hop-50 text-hop-green'}`}>
                          {record.isAbnormal ? '异常' : '正常'}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-600 mb-2">检测人: {record.testedBy}</p>
                    <p className="text-sm text-neutral-700 bg-neutral-50 p-2 rounded mb-2">{record.conclusion}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {record.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-neutral-50 rounded">
                          <span className="text-neutral-600">{item.itemName}</span>
                          <div className="flex items-center gap-2">
                            <span className={item.isPass ? 'text-hop-green font-medium' : 'text-red-600 font-medium'}>
                              {item.value || '-'}
                            </span>
                            <span className="text-neutral-400 text-xs">({item.standard})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-neutral-800 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                备注流转链 ({notes.length})
              </h4>
              <div className="space-y-2">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-white rounded-lg p-3 border border-neutral-200"
                    style={{ borderLeftColor: ROLE_DOT_COLORS[note.role], borderLeftWidth: '3px' }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-neutral-400" />
                        <span className="text-sm font-medium text-neutral-800">{note.createdBy}</span>
                        <RoleBadge role={note.role} />
                        {note.source === 'testing' && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">品控检测</span>
                        )}
                        {note.source === 'release' && (
                          <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">放行判断</span>
                        )}
                      </div>
                      <span className="text-xs text-neutral-400">
                        {format(new Date(note.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-700">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={onViewDetail}>
                <Eye className="w-4 h-4 mr-1" />
                查看完整详情
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
