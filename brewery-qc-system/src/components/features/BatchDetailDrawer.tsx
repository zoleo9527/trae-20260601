import { useState } from 'react';
import { X, Clock, User, MessageSquare, Send, FlaskConical, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useBatchStore } from '@/store/useBatchStore';
import { useAuthStore } from '@/store/useAuthStore';
import { RoleBadge, StatusBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusFlow } from '@/components/features/StatusFlow';
import { ROLE_DOT_COLORS, BATCH_STATUS_LABELS } from '@/types';
import type { UserRole, TestItem } from '@/types';

export function BatchDetailDrawer() {
  const {
    selectedBatchId, isDrawerOpen, setIsDrawerOpen,
    getBatchById, getTestRecordsByBatchId, getNotesByBatchId,
    getStatusLogsByBatchId, getTestTemplateByFormula,
    addNote, completeTesting,
  } = useBatchStore();
  const { currentUser } = useAuthStore();

  const [newNote, setNewNote] = useState('');
  const [testingMode, setTestingMode] = useState(false);
  const [testItems, setTestItems] = useState<Array<{ itemName: string; standard: string; value: string; isPass: boolean }>>([]);
  const [testConclusion, setTestConclusion] = useState('');
  const [testingNote, setTestingNote] = useState('');

  const batch = selectedBatchId ? getBatchById(selectedBatchId) : null;
  const testRecords = selectedBatchId ? getTestRecordsByBatchId(selectedBatchId) : [];
  const notes = selectedBatchId ? getNotesByBatchId(selectedBatchId) : [];
  const statusLogs = selectedBatchId ? getStatusLogsByBatchId(selectedBatchId) : [];

  const handleAddNote = () => {
    if (!newNote.trim() || !selectedBatchId || !currentUser) return;
    addNote(selectedBatchId, newNote.trim(), currentUser.name, currentUser.role);
    setNewNote('');
  };

  const handleStartTesting = () => {
    if (!batch) return;
    const template = getTestTemplateByFormula(batch.formula);
    if (template) {
      setTestItems(template.items.map((item) => ({
        itemName: item.itemName,
        standard: item.standard,
        value: '',
        isPass: true,
      })));
    }
    setTestingMode(true);
  };

  const handleTestItemValueChange = (index: number, value: string) => {
    setTestItems((prev) => prev.map((item, i) => i === index ? { ...item, value } : item));
  };

  const handleTestItemPassChange = (index: number, isPass: boolean) => {
    setTestItems((prev) => prev.map((item, i) => i === index ? { ...item, isPass } : item));
  };

  const handleCompleteTesting = (isAbnormal: boolean) => {
    if (!selectedBatchId || !currentUser) return;
    completeTesting(
      selectedBatchId,
      currentUser.name,
      isAbnormal,
      testConclusion || (isAbnormal ? '检测异常' : '检测通过'),
      testItems.map((item) => ({
        itemName: item.itemName,
        value: item.value,
        standard: item.standard,
        isPass: item.isPass,
      })),
      testingNote,
    );
    setTestingMode(false);
    setTestItems([]);
    setTestConclusion('');
    setTestingNote('');
  };

  const sourceLabel: Record<string, string> = {
    testing: '品控检测',
    release: '放行判断',
    manual: '手动添加',
  };

  if (!isDrawerOpen || !batch) return null;

  const canTest = currentUser?.role === 'packaging' && batch.currentStatus === 'TESTING';
  const brewerNotes = notes.filter((n) => n.role === 'brewer');
  const packagingNotes = notes.filter((n) => n.role === 'packaging');
  const salesNotes = notes.filter((n) => n.role === 'sales');

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={() => { setIsDrawerOpen(false); setTestingMode(false); }} />
      <div className="absolute right-0 top-0 h-full w-[560px] bg-white shadow-xl animate-slide-in-right overflow-y-auto scrollbar-thin">
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-neutral-800">批次详情</h2>
          <button onClick={() => { setIsDrawerOpen(false); setTestingMode(false); }} className="p-2 rounded-lg hover:bg-neutral-100 transition-colors">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <Card className="border-l-4 border-l-amber-900">
            <Card.Body>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-neutral-800">{batch.productName}</h3>
                  <p className="text-sm text-neutral-500 mt-1">批次号: {batch.batchNo}</p>
                </div>
                <StatusBadge status={batch.currentStatus} showPulse />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-500">配方编号</span>
                  <p className="font-medium text-neutral-800 mt-1">{batch.formula}</p>
                </div>
                <div>
                  <span className="text-neutral-500">发酵罐</span>
                  <p className="font-medium text-neutral-800 mt-1">{batch.tankNo}</p>
                </div>
                <div>
                  <span className="text-neutral-500">发酵日期</span>
                  <p className="font-medium text-neutral-800 mt-1">{batch.fermentationDate}</p>
                </div>
                <div>
                  <span className="text-neutral-500">批次数量</span>
                  <p className="font-medium text-neutral-800 mt-1">{batch.quantity} L</p>
                </div>
                <div>
                  <span className="text-neutral-500">酒精度</span>
                  <p className="font-medium text-neutral-800 mt-1">{batch.alcoholContent}%</p>
                </div>
                <div>
                  <span className="text-neutral-500">创建人</span>
                  <p className="font-medium text-neutral-800 mt-1">{batch.createdBy}</p>
                </div>
              </div>
            </Card.Body>
          </Card>

          <StatusFlow currentStatus={batch.currentStatus} statusLogs={statusLogs} />

          {testingMode && canTest ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4" />
                  品控检测处理
                </h4>
                <p className="text-xs text-blue-600">填写检测数据并添加备注，备注将流转至放行判断环节</p>
              </div>

              {brewerNotes.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-neutral-500 mb-2">酿酒师备注（请参考）</h4>
                  {brewerNotes.map((note) => (
                    <div key={note.id} className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ROLE_DOT_COLORS.brewer }} />
                        <span className="text-xs font-medium text-amber-800">{note.createdBy}</span>
                        <span className="text-xs text-neutral-400">{format(new Date(note.createdAt), 'MM-dd HH:mm', { locale: zhCN })}</span>
                      </div>
                      <p className="text-sm text-neutral-700">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-neutral-800 mb-3">检测项目</h4>
                <div className="space-y-2">
                  {testItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-800">{item.itemName}</span>
                          <span className="text-xs text-neutral-400">标准: {item.standard}</span>
                        </div>
                        <input
                          type="text"
                          value={item.value}
                          onChange={(e) => handleTestItemValueChange(index, e.target.value)}
                          placeholder="输入检测值..."
                          className="mt-1 w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTestItemPassChange(index, true)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            item.isPass ? 'bg-hop-green text-white' : 'bg-neutral-200 text-neutral-500'
                          }`}
                        >
                          合格
                        </button>
                        <button
                          onClick={() => handleTestItemPassChange(index, false)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            !item.isPass ? 'bg-red-500 text-white' : 'bg-neutral-200 text-neutral-500'
                          }`}
                        >
                          不合格
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-700 mb-1 block">检测结论</label>
                <textarea
                  value={testConclusion}
                  onChange={(e) => setTestConclusion(e.target.value)}
                  placeholder="输入检测结论..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none text-sm"
                  rows={2}
                />
              </div>

              <div className="bg-warning-50 border border-warning-orange/30 rounded-xl p-4">
                <label className="text-sm font-semibold text-warning-orange mb-1 block flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  品控备注（将流转至放行判断）
                </label>
                <p className="text-xs text-neutral-500 mb-2">此备注将自动流转到放行判断环节，销售内勤可查看</p>
                <textarea
                  value={testingNote}
                  onChange={(e) => setTestingNote(e.target.value)}
                  placeholder="添加品控检测备注，如异常说明、处理建议等..."
                  className="w-full px-3 py-2 border border-warning-orange/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none text-sm bg-white"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button variant="success" onClick={() => handleCompleteTesting(false)}>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  检测通过
                </Button>
                <Button variant="danger" onClick={() => handleCompleteTesting(true)}>
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  检测异常
                </Button>
                <Button variant="ghost" onClick={() => { setTestingMode(false); setTestItems([]); }}>
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <>
              {canTest && (
                <Button variant="primary" onClick={handleStartTesting} className="w-full">
                  <FlaskConical className="w-4 h-4 mr-2" />
                  开始品控检测
                </Button>
              )}

              {testRecords.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    检测记录
                  </h4>
                  <div className="space-y-3">
                    {testRecords.map((record) => (
                      <Card key={record.id}>
                        <Card.Body className="py-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-neutral-800">
                              {format(new Date(record.testedAt), 'MM-dd HH:mm', { locale: zhCN })}
                            </span>
                            <div className="flex items-center gap-2">
                              <RoleBadge role="packaging" />
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${record.isAbnormal ? 'bg-warning-50 text-warning-orange' : 'bg-hop-50 text-hop-green'}`}>
                                {record.isAbnormal ? '异常' : '正常'}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-neutral-600 mb-2">检测人: {record.testedBy}</p>
                          <p className="text-sm text-neutral-700 bg-neutral-50 p-2 rounded">{record.conclusion}</p>
                          <div className="mt-3 space-y-2">
                            {record.items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-sm">
                                <span className="text-neutral-600">{item.itemName}</span>
                                <div className="flex items-center gap-2">
                                  <span className={item.isPass ? 'text-hop-green' : 'text-red-600'}>
                                    {item.value || '-'}
                                  </span>
                                  <span className="text-neutral-400 text-xs">({item.standard})</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  备注流转 ({notes.length})
                </h4>

                {(brewerNotes.length > 0 || packagingNotes.length > 0 || salesNotes.length > 0) && (
                  <div className="space-y-1 mb-3">
                    {brewerNotes.length > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ROLE_DOT_COLORS.brewer }} />
                        <span className="text-neutral-500">酿酒师: {brewerNotes.length} 条</span>
                      </div>
                    )}
                    {packagingNotes.length > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ROLE_DOT_COLORS.packaging }} />
                        <span className="text-neutral-500">包装主管: {packagingNotes.length} 条</span>
                      </div>
                    )}
                    {salesNotes.length > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ROLE_DOT_COLORS.sales }} />
                        <span className="text-neutral-500">销售内勤: {salesNotes.length} 条</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-neutral-50 rounded-lg p-3 border-l-3"
                      style={{ borderLeftColor: ROLE_DOT_COLORS[note.role], borderLeftWidth: '3px' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm font-medium text-neutral-800">{note.createdBy}</span>
                          <RoleBadge role={note.role} />
                          {note.source && note.source !== 'manual' && (
                            <span className="text-xs bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded">
                              {sourceLabel[note.source] || note.source}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-neutral-400">
                          {format(new Date(note.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-700">{note.content}</p>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <p className="text-sm text-neutral-400 text-center py-4">暂无备注</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-neutral-800 mb-3">添加备注</h4>
                <div className="flex gap-2">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="输入备注内容..."
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none text-sm"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleAddNote();
                      }
                    }}
                  />
                  <Button variant="primary" size="sm" onClick={handleAddNote} disabled={!newNote.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-neutral-400 mt-1">Ctrl+Enter 快速发送，备注将流转给所有相关人员</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
