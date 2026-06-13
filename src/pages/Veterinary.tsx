import { useState } from 'react';
import { useFarmStore } from '@/store';
import { Search, Filter, Plus, Eye, CheckCircle, XCircle, Edit3, Calendar, User, Stethoscope, X, ShieldCheck, RefreshCw } from 'lucide-react';
import type { VeterinaryRecord } from '@/types';

function StatusBadge({ status }: { status: VeterinaryRecord['status'] }) {
  const config = {
    pending: { label: '待处理', className: 'bg-yellow-100 text-yellow-700' },
    processing: { label: '处理中', className: 'bg-blue-100 text-blue-700' },
    completed: { label: '已完成', className: 'bg-green-100 text-green-700' },
    rejected: { label: '已驳回', className: 'bg-red-100 text-red-700' },
  };
  const { label, className } = config[status];
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>{label}</span>;
}

function VeterinaryModal({ record, onClose, onUpdateStatus, onCreateQuarantine, onSupplement }: { 
  record: VeterinaryRecord; 
  onClose: () => void; 
  onUpdateStatus: (status: VeterinaryRecord['status'], reason?: string) => void;
  onCreateQuarantine: (reason: string) => void;
  onSupplement: (updates: Partial<VeterinaryRecord>) => void;
}) {
  const store = useFarmStore();
  const cattle = store.getCattleById(record.cattleId);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showQuarantineForm, setShowQuarantineForm] = useState(false);
  const [quarantineReason, setQuarantineReason] = useState('');
  const [showSupplementForm, setShowSupplementForm] = useState(false);
  const [supplementData, setSupplementData] = useState({
    symptoms: record.symptoms,
    diagnosis: record.diagnosis,
    treatment: record.treatment,
  });

  const handleComplete = () => {
    onUpdateStatus('completed');
    onClose();
  };

  const handleReject = () => {
    if (rejectReason.trim()) {
      onUpdateStatus('rejected', rejectReason);
      onClose();
    }
  };

  const handleCreateQuarantine = () => {
    if (quarantineReason.trim()) {
      onCreateQuarantine(quarantineReason);
      setShowQuarantineForm(false);
    }
  };

  const handleSupplement = () => {
    if (supplementData.symptoms.trim() && supplementData.diagnosis.trim()) {
      onSupplement(supplementData);
      setShowSupplementForm(false);
    }
  };

  const existingQuarantine = store.quarantineRecords.find(q => q.vetRecordId === record.id);
  const showQuarantineButton = !existingQuarantine || existingQuarantine.status !== 'completed';
  const isUpdatingQuarantine = !!existingQuarantine;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto fade-in">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">巡诊详情 #{record.id}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-pasture-100 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-pasture-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {cattle ? `${cattle.tagId} ${cattle.name}` : '未知牛只'}
              </p>
              <p className="text-sm text-gray-500">{cattle?.breed} · {cattle?.weight}kg</p>
            </div>
            <StatusBadge status={record.status} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">巡诊日期</p>
              <p className="text-sm font-medium">{record.examDate}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">兽医</p>
              <p className="text-sm font-medium">{record.vetName}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">症状描述</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{record.symptoms}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">诊断结果</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{record.diagnosis}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">处理方案</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{record.treatment}</p>
          </div>

          {record.rejectReason && (
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-xs text-red-600 font-medium mb-1">驳回原因</p>
              <p className="text-sm text-red-700">{record.rejectReason}</p>
            </div>
          )}

          {existingQuarantine && (
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-xs text-orange-600 font-medium mb-1">关联隔离记录</p>
              <p className="text-sm text-orange-700">
                隔离单 #{existingQuarantine.id} | 状态: {
                  existingQuarantine.status === 'pending' ? '待审核' :
                  existingQuarantine.status === 'quarantining' ? '隔离中' :
                  existingQuarantine.status === 'completed' ? '已解除' :
                  existingQuarantine.status === 'rejected' ? '已驳回' : existingQuarantine.status
                }
              </p>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500 pt-4 border-t border-gray-200">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              操作人: {record.operator}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              创建时间: {record.createdAt}
            </span>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          {record.status === 'rejected' ? (
            <div className="space-y-3">
              <button
                onClick={() => setShowSupplementForm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                补录修改
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowRejectForm(!showRejectForm)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                驳回
              </button>
              
              {showQuarantineButton && (
                <button
                  onClick={() => setShowQuarantineForm(!showQuarantineForm)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isUpdatingQuarantine ? '更新隔离原因' : '转隔离'}
                </button>
              )}
              
              <button
                onClick={handleComplete}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-pasture-500 text-white rounded-lg hover:bg-pasture-600 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                完成处理
              </button>
            </div>
          )}

          {showRejectForm && record.status !== 'completed' && record.status !== 'rejected' && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600 font-medium mb-2">请填写驳回原因</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入驳回原因..."
                className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认驳回
                </button>
              </div>
            </div>
          )}

          {showQuarantineForm && (existingQuarantine ? existingQuarantine.status !== 'completed' : true) && (
            <div className="mt-4 p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-600 font-medium mb-2">
                {isUpdatingQuarantine ? '更新隔离原因' : '请填写隔离原因'}
              </p>
              <textarea
                value={quarantineReason}
                onChange={(e) => setQuarantineReason(e.target.value)}
                placeholder={`${cattle?.name}需要隔离的原因...`}
                className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={3}
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowQuarantineForm(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateQuarantine}
                  disabled={!quarantineReason.trim()}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingQuarantine ? '确认更新' : '确认转隔离'}
                </button>
              </div>
            </div>
          )}

          {showSupplementForm && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-4">
              <p className="text-sm text-blue-600 font-medium">补录修改</p>
              
              <div>
                <label className="text-xs text-blue-600 mb-1 block">症状描述</label>
                <textarea
                  value={supplementData.symptoms}
                  onChange={(e) => setSupplementData({ ...supplementData, symptoms: e.target.value })}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              
              <div>
                <label className="text-xs text-blue-600 mb-1 block">诊断结果</label>
                <textarea
                  value={supplementData.diagnosis}
                  onChange={(e) => setSupplementData({ ...supplementData, diagnosis: e.target.value })}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              
              <div>
                <label className="text-xs text-blue-600 mb-1 block">处理方案</label>
                <textarea
                  value={supplementData.treatment}
                  onChange={(e) => setSupplementData({ ...supplementData, treatment: e.target.value })}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSupplementForm(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSupplement}
                  disabled={!supplementData.symptoms.trim() || !supplementData.diagnosis.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认补录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Veterinary() {
  const store = useFarmStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<VeterinaryRecord['status'] | 'all'>('all');
  const [selectedRecord, setSelectedRecord] = useState<VeterinaryRecord | null>(null);

  const filteredRecords = store.veterinaryRecords.filter(record => {
    const matchesKeyword = searchKeyword === '' || 
      record.symptoms.includes(searchKeyword) || 
      record.diagnosis.includes(searchKeyword) ||
      record.vetName.includes(searchKeyword);
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    return matchesKeyword && matchesStatus;
  });

  const handleUpdateStatus = (id: number, status: VeterinaryRecord['status'], reason?: string) => {
    store.updateVeterinaryStatus(id, status, reason);
  };

  const handleCreateQuarantine = (vetRecordId: number, cattleId: number, reason: string) => {
    store.createQuarantine(vetRecordId, cattleId, reason, '系统');
    setSelectedRecord(null);
  };

  const handleSupplement = (id: number, updates: Partial<VeterinaryRecord>) => {
    store.supplementVeterinary(id, updates);
    setSelectedRecord(null);
  };

  const cattleMap = new Map(store.cattle.map(c => [c.id, c]));

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">兽医巡诊管理</h2>
          <p className="text-sm text-gray-500 mt-1">管理和处理兽医巡诊记录</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-pasture-500 text-white rounded-lg hover:bg-pasture-600 transition-colors">
          <Plus className="w-4 h-4" />
          新建巡诊单
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索症状、诊断、兽医..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pasture-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as VeterinaryRecord['status'] | 'all')}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pasture-500"
            >
              <option value="all">全部状态</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="completed">已完成</option>
              <option value="rejected">已驳回</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">编号</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">牛只信息</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">症状</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">诊断</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">兽医</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const cattle = cattleMap.get(record.cattleId);
                return (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 text-sm text-gray-600">#{record.id}</td>
                    <td className="py-4 px-4">
                      <p className="text-sm font-medium text-gray-900">
                        {cattle ? `${cattle.tagId} ${cattle.name}` : '未知'}
                      </p>
                      <p className="text-xs text-gray-500">{cattle?.breed}</p>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 max-w-xs truncate">{record.symptoms}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">{record.diagnosis}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">{record.vetName}</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        {record.status !== 'completed' && record.status !== 'rejected' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(record.id, 'processing')}
                              className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                              title="开始处理"
                            >
                              <Edit3 className="w-4 h-4 text-blue-600" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredRecords.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Stethoscope className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>暂无巡诊记录</p>
            </div>
          )}
        </div>
      </div>

      {selectedRecord && (
        <VeterinaryModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onUpdateStatus={(status, reason) => handleUpdateStatus(selectedRecord.id, status, reason)}
          onCreateQuarantine={(reason) => handleCreateQuarantine(selectedRecord.id, selectedRecord.cattleId, reason)}
          onSupplement={(updates) => handleSupplement(selectedRecord.id, updates)}
        />
      )}
    </div>
  );
}
