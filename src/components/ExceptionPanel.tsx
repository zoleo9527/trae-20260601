import { useState } from 'react';
import { AlertTriangle, CheckCircle, Edit3, MessageCircle, History, Clock, RotateCcw, User, FileText } from 'lucide-react';
import type { Machine, ExceptionRecord } from '@/types';
import { exceptionTypeLabels, exceptionSeverityLabels, exceptionSeverityColors, communicationTypeLabels, statusLabels, statusColors, approvalStatusLabels, approvalStatusColors } from '@/utils/helpers';

interface ExceptionPanelProps {
  machines: Machine[];
  onAddException: (machineId: string, exception: Omit<ExceptionRecord, 'id' | 'createdAt'>) => void;
  onResolveException: (machineId: string, exceptionId: string, resolution: string, resolvedBy: string) => void;
}

export function ExceptionPanel({ machines, onAddException, onResolveException }: ExceptionPanelProps) {
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newException, setNewException] = useState({
    type: 'hardware' as ExceptionRecord['type'],
    description: '',
    severity: 'medium' as ExceptionRecord['severity'],
  });
  const [resolveData, setResolveData] = useState({ exceptionId: '', resolution: '', resolvedBy: '' });

  const unresolvedExceptions = machines.flatMap(m => 
    m.exceptions.filter(e => !e.resolved).map(e => ({ ...e, machine: m }))
  );

  const resolvedExceptions = machines.flatMap(m => 
    m.exceptions.filter(e => e.resolved).map(e => ({ ...e, machine: m }))
  );

  const handleAddException = () => {
    if (selectedMachine && newException.description.trim()) {
      onAddException(selectedMachine.id, { ...newException, machineId: selectedMachine.id, resolved: false });
      setNewException({ type: 'hardware', description: '', severity: 'medium' });
      setShowAddForm(false);
    }
  };

  const handleResolve = () => {
    if (selectedMachine && resolveData.exceptionId && resolveData.resolution.trim() && resolveData.resolvedBy.trim()) {
      onResolveException(selectedMachine.id, resolveData.exceptionId, resolveData.resolution, resolveData.resolvedBy);
      setResolveData({ exceptionId: '', resolution: '', resolvedBy: '' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">异常管理</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Edit3 className="h-4 w-4" />
          记录异常
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold text-gray-900">待处理异常 ({unresolvedExceptions.length})</h3>
          </div>
          <div className="space-y-3">
            {unresolvedExceptions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无待处理异常</p>
            ) : (
              unresolvedExceptions.map(exception => (
                <div 
                  key={exception.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    exception.severity === 'high' || exception.severity === 'critical' 
                      ? 'border-red-500 bg-red-50' 
                      : exception.severity === 'medium' 
                        ? 'border-yellow-500 bg-yellow-50' 
                        : 'border-green-500 bg-green-50'
                  }`}
                  onClick={() => {
                    setSelectedMachine(exception.machine);
                    setResolveData({ exceptionId: exception.id, resolution: '', resolvedBy: '' });
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {exception.machine.orderNo} - {exception.machine.customerName}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${exceptionSeverityColors[exception.severity]}`}>
                          {exceptionSeverityLabels[exception.severity]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{exception.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>类型: {exceptionTypeLabels[exception.type]}</span>
                        <span>创建时间: {exception.createdAt}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold text-gray-900">已处理异常 ({resolvedExceptions.length})</h3>
          </div>
          <div className="space-y-3">
            {resolvedExceptions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无已处理异常</p>
            ) : (
              resolvedExceptions.map(exception => (
                <div 
                  key={exception.id}
                  className="p-4 rounded-lg bg-gray-50 border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {exception.machine.orderNo} - {exception.machine.customerName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          已解决
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{exception.description}</p>
                      {exception.resolution && (
                        <p className="text-sm text-green-600 mt-1">
                          处理结果: {exception.resolution}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>处理人: {exception.resolvedBy}</span>
                        <span>处理时间: {exception.resolvedAt}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {selectedMachine && resolveData.exceptionId && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">处理异常 - {selectedMachine.orderNo}</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">客户信息</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">订单号: {selectedMachine.orderNo}</p>
                <p className="text-sm text-gray-600">客户: {selectedMachine.customerName}</p>
                <p className="text-sm text-gray-600">状态: <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[selectedMachine.status]}`}>{statusLabels[selectedMachine.status]}</span></p>
              </div>

              <h4 className="text-sm font-medium text-gray-700 mb-2 mt-4">沟通记录</h4>
              <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                {selectedMachine.communications.length === 0 ? (
                  <p className="text-sm text-gray-500">暂无沟通记录</p>
                ) : (
                  <div className="space-y-2">
                    {selectedMachine.communications.map(comm => (
                      <div key={comm.id} className="flex items-start gap-2">
                        <MessageCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-700">{comm.content}</p>
                          <p className="text-xs text-gray-500">{communicationTypeLabels[comm.type]} - {comm.operator} - {comm.createdAt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                历史测试记录
              </h4>
              <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                {selectedMachine.burnInTestHistory.length === 0 ? (
                  <p className="text-sm text-gray-500">暂无历史测试记录</p>
                ) : (
                  <div className="space-y-3">
                    {[...selectedMachine.burnInTestHistory].reverse().map((test, index) => (
                      <div key={test.id} className="bg-white rounded p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400">第{selectedMachine.burnInTestHistory.length - index}次测试</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            test.overallStatus === 'passed' ? 'bg-green-100 text-green-700' :
                            test.overallStatus === 'failed' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {test.overallStatus === 'passed' ? '通过' : test.overallStatus === 'failed' ? '失败' : '进行中'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">时间: {test.startTime} - {test.endTime || '进行中'}</p>
                        {test.remarks && <p className="text-xs text-gray-500 mt-1">备注: {test.remarks}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <h4 className="text-sm font-medium text-gray-700 mb-2 mt-4 flex items-center gap-2">
                <User className="h-4 w-4" />
                历史验收记录
              </h4>
              <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                {selectedMachine.approvalHistory.length === 0 ? (
                  <p className="text-sm text-gray-500">暂无历史验收记录</p>
                ) : (
                  <div className="space-y-2">
                    {[...selectedMachine.approvalHistory].reverse().map((approval, index) => (
                      <div key={approval.id} className="bg-white rounded p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400">第{selectedMachine.approvalHistory.length - index}次验收</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${approvalStatusColors[approval.status]}`}>
                            {approvalStatusLabels[approval.status]}
                          </span>
                        </div>
                        {approval.approver && <p className="text-xs text-gray-600">验收人: {approval.approver}</p>}
                        {approval.comments && <p className="text-xs text-gray-500 mt-1">意见: {approval.comments}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                操作轨迹
              </h4>
              <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                {selectedMachine.operations.length === 0 ? (
                  <p className="text-sm text-gray-500">暂无操作记录</p>
                ) : (
                  <div className="space-y-2">
                    {[...selectedMachine.operations].reverse().map(op => (
                      <div key={op.id} className="flex items-start gap-2">
                        <div className="mt-0.5">
                          {op.type === 'return' && <RotateCcw className="h-3 w-3 text-yellow-500" />}
                          {op.type === 're_record' && <Edit3 className="h-3 w-3 text-cyan-500" />}
                          {op.type === 'review' && <CheckCircle className="h-3 w-3 text-indigo-500" />}
                          {op.type === 'start_test' && <Clock className="h-3 w-3 text-blue-500" />}
                          {op.type === 'complete_test' && <CheckCircle className="h-3 w-3 text-green-500" />}
                          {op.type === 'approve' && <CheckCircle className="h-3 w-3 text-green-500" />}
                          {op.type === 'reject' && <AlertTriangle className="h-3 w-3 text-red-500" />}
                          {op.type === 'add_exception' && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-700">{op.description}</p>
                          <p className="text-xs text-gray-400">{op.operator} - {op.createdAt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">处理人</label>
                  <input
                    type="text"
                    value={resolveData.resolvedBy}
                    onChange={(e) => setResolveData({ ...resolveData, resolvedBy: e.target.value })}
                    placeholder="请输入处理人姓名"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">处理结果</label>
                  <textarea
                    value={resolveData.resolution}
                    onChange={(e) => setResolveData({ ...resolveData, resolution: e.target.value })}
                    placeholder="请输入处理结果..."
                    className="text-area h-24"
                  />
                </div>
                <button
                  onClick={handleResolve}
                  disabled={!resolveData.resolvedBy.trim() || !resolveData.resolution.trim()}
                  className="btn btn-success w-full flex items-center justify-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  确认处理
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">记录异常</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择订单</label>
                <select
                  value={selectedMachine?.id || ''}
                  onChange={(e) => setSelectedMachine(machines.find(m => m.id === e.target.value) || null)}
                  className="select"
                >
                  <option value="">请选择订单</option>
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>{m.orderNo} - {m.customerName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">异常类型</label>
                <select
                  value={newException.type}
                  onChange={(e) => setNewException({ ...newException, type: e.target.value as ExceptionRecord['type'] })}
                  className="select"
                >
                  {Object.entries(exceptionTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">严重程度</label>
                <select
                  value={newException.severity}
                  onChange={(e) => setNewException({ ...newException, severity: e.target.value as ExceptionRecord['severity'] })}
                  className="select"
                >
                  {Object.entries(exceptionSeverityLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">异常描述</label>
                <textarea
                  value={newException.description}
                  onChange={(e) => setNewException({ ...newException, description: e.target.value })}
                  placeholder="请详细描述异常情况..."
                  className="text-area h-24"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleAddException}
                  disabled={!selectedMachine || !newException.description.trim()}
                  className="btn btn-primary flex-1"
                >
                  <AlertTriangle className="h-4 w-4" />
                  记录异常
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
