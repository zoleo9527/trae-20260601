import { useState } from 'react';
import { Play, Check, X, SkipForward, RotateCcw, Cpu, Thermometer, HardDrive, Activity, History, Clock, User, ChevronDown, ChevronUp } from 'lucide-react';
import type { Machine, BurnInTest, TestItem } from '@/types';
import { testItemStatusLabels, testItemStatusColors, formatDuration, statusLabels, statusColors } from '@/utils/helpers';

interface BurnInTestPanelProps {
  machine: Machine;
  onStartTest: (machineId: string, operator: string) => void;
  onUpdateTestItem: (machineId: string, itemId: string, update: Partial<TestItem>) => void;
  onReturnToPending: (machineId: string, operator: string, reason: string) => void;
}

export function BurnInTestPanel({ machine, onStartTest, onUpdateTestItem, onReturnToPending }: BurnInTestPanelProps) {
  const [operator, setOperator] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showHistoryCollapsed, setShowHistoryCollapsed] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editResult, setEditResult] = useState('');
  const [editRemarks, setEditRemarks] = useState('');

  const handleStartTest = () => {
    if (operator.trim()) {
      onStartTest(machine.id, operator.trim());
    }
  };

  const handleTestItemAction = (itemId: string, action: 'pass' | 'fail' | 'skip') => {
    const status: TestItem['status'] = action === 'pass' ? 'passed' : action === 'fail' ? 'failed' : 'skipped';
    onUpdateTestItem(machine.id, itemId, { status, tester: operator });
  };

  const handleEditItem = (itemId: string, result: string, remarks: string) => {
    onUpdateTestItem(machine.id, itemId, { result, remarks });
    setEditingItem(null);
    setEditResult('');
    setEditRemarks('');
  };

  const handleReturn = () => {
    if (returnReason.trim()) {
      onReturnToPending(machine.id, operator || '操作员', returnReason.trim());
      setShowReturnModal(false);
      setReturnReason('');
    }
  };

  const renderTestSection = (test: BurnInTest, isHistory: boolean = false) => (
    <div className={`border ${isHistory ? 'border-gray-200 bg-gray-50' : 'border-blue-200 bg-white'} rounded-xl p-4 mb-4`}>
      {isHistory && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3 pb-3 border-b border-gray-200">
          <History className="h-4 w-4" />
          <span>历史测试记录 - 测试ID: {test.id}</span>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Thermometer className="h-4 w-4" />
            <span className="text-xs">温度</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{test.temperature}°C</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <Cpu className="h-4 w-4" />
            <span className="text-xs">CPU使用率</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{test.cpuUsage}%</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <Activity className="h-4 w-4" />
            <span className="text-xs">内存使用率</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{test.memoryUsage}%</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <HardDrive className="h-4 w-4" />
            <span className="text-xs">GPU使用率</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{test.gpuUsage}%</p>
        </div>
      </div>

      <div className="bg-gray-100 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="h-4 w-4" />
            <span>测试时间</span>
          </div>
          <span className="font-medium">{test.startTime} - {test.endTime || '进行中'}</span>
        </div>
        {test.duration && (
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600">测试时长</span>
            <span className="font-medium">{formatDuration(test.duration)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm mt-2">
          <div className="flex items-center gap-1 text-gray-600">
            <User className="h-4 w-4" />
            <span>操作人员</span>
          </div>
          <span className="font-medium">{test.operator}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-gray-600">测试结果</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            test.overallStatus === 'passed' ? 'bg-green-100 text-green-700' :
            test.overallStatus === 'failed' ? 'bg-red-100 text-red-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {test.overallStatus === 'passed' ? '通过' : test.overallStatus === 'failed' ? '失败' : '进行中'}
          </span>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-3">测试项目</h4>
        <div className="space-y-2">
          {test.items.map(item => (
            <div key={item.id} className={`rounded-lg p-3 ${item.status === 'failed' ? 'bg-red-50' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{item.name}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${testItemStatusColors[item.status]}`}>
                  {testItemStatusLabels[item.status]}
                </span>
              </div>
              {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
              
              {editingItem === item.id ? (
                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    value={editResult}
                    onChange={(e) => setEditResult(e.target.value)}
                    placeholder="测试结果"
                    className="input text-sm"
                  />
                  <textarea
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    placeholder="备注说明"
                    className="text-area h-16 text-sm"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleEditItem(item.id, editResult, editRemarks)} className="btn btn-sm btn-primary">保存</button>
                    <button onClick={() => setEditingItem(null)} className="btn btn-sm btn-secondary">取消</button>
                  </div>
                </div>
              ) : (
                <>
                  {item.result && <p className="text-xs text-gray-500 mt-1">结果: {item.result}</p>}
                  {item.remarks && <p className="text-xs text-gray-500">备注: {item.remarks}</p>}
                </>
              )}

              {!isHistory && machine.status === 'testing' && item.status !== 'running' && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleTestItemAction(item.id, 'pass')}
                    className="btn btn-sm btn-success flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" />
                    通过
                  </button>
                  <button
                    onClick={() => handleTestItemAction(item.id, 'fail')}
                    className="btn btn-sm btn-danger flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    失败
                  </button>
                  <button
                    onClick={() => handleTestItemAction(item.id, 'skip')}
                    className="btn btn-sm btn-secondary flex items-center gap-1"
                  >
                    <SkipForward className="h-3 w-3" />
                    跳过
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {test.remarks && (
        <div className="mt-3 p-3 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">备注: </span>{test.remarks}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">烤机测试 - {machine.orderNo}</h2>
          <p className="text-sm text-gray-500">客户: {machine.customerName} | 状态: <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[machine.status]}`}>{statusLabels[machine.status]}</span></p>
        </div>
        {machine.status === 'test_failed' && (
          <button
            onClick={() => setShowReturnModal(true)}
            className="btn btn-warning flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            退回重测
          </button>
        )}
      </div>

      {machine.status === 'pending' && (
        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">开始烤机测试</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">操作人员</label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="请输入操作人员姓名"
                className="input"
              />
            </div>
            <button
              onClick={handleStartTest}
              disabled={!operator.trim()}
              className="btn btn-primary flex items-center gap-2 w-full"
            >
              <Play className="h-4 w-4" />
              开始测试
            </button>
          </div>
        </div>
      )}

      {machine.status === 'testing' && machine.burnInTest && (
        <div className="bg-blue-50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">测试进行中</span>
            <span className="text-sm text-gray-500">请处理各项测试项目</span>
          </div>
        </div>
      )}

      {machine.burnInTest && renderTestSection(machine.burnInTest)}

      {machine.burnInTestHistory.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowHistoryCollapsed(!showHistoryCollapsed)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            {showHistoryCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            <History className="h-4 w-4" />
            <span className="font-medium">历史测试记录 ({machine.burnInTestHistory.length}条)</span>
          </button>
          
          {!showHistoryCollapsed && (
            <div className="space-y-4">
              {[...machine.burnInTestHistory].reverse().map((test, index) => (
                <div key={test.id}>
                  <div className="text-xs text-gray-400 mb-2">第{machine.burnInTestHistory.length - index}次测试</div>
                  {renderTestSection(test, true)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">退回重测</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">操作人员</label>
                <input
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  placeholder="请输入操作人员姓名"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">退回原因</label>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="请输入退回原因..."
                  className="text-area h-24"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleReturn}
                  disabled={!returnReason.trim()}
                  className="btn btn-warning flex-1"
                >
                  确认退回
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}