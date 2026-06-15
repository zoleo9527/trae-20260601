import { useState } from 'react';
import { Play, Check, X, SkipForward, RotateCcw, AlertTriangle, Cpu, Thermometer, HardDrive, Activity } from 'lucide-react';
import type { Machine, TestItem } from '@/types';
import { testItemStatusLabels, testItemStatusColors, formatDuration } from '@/utils/helpers';

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

  const handleStartTest = () => {
    if (operator.trim()) {
      onStartTest(machine.id, operator.trim());
    }
  };

  const handleTestResult = (itemId: string, status: TestItem['status'], result: string, remarks: string) => {
    onUpdateTestItem(machine.id, itemId, { status, result, remarks, tester: operator });
  };

  const handleReturn = () => {
    if (returnReason.trim()) {
      onReturnToPending(machine.id, operator || '操作员', returnReason.trim());
      setShowReturnModal(false);
      setReturnReason('');
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">烤机测试 - {machine.orderNo}</h2>
          <p className="text-sm text-gray-500">客户: {machine.customerName}</p>
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

      {machine.burnInTest && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Thermometer className="h-4 w-4" />
                <span className="text-sm">温度</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{machine.burnInTest.temperature}°C</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <Cpu className="h-4 w-4" />
                <span className="text-sm">CPU使用率</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{machine.burnInTest.cpuUsage}%</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Activity className="h-4 w-4" />
                <span className="text-sm">内存使用率</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{machine.burnInTest.memoryUsage}%</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-600 mb-1">
                <HardDrive className="h-4 w-4" />
                <span className="text-sm">GPU使用率</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{machine.burnInTest.gpuUsage}%</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">测试开始时间</span>
              <span className="font-medium">{machine.burnInTest.startTime}</span>
            </div>
            {machine.burnInTest.endTime && (
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">测试结束时间</span>
                <span className="font-medium">{machine.burnInTest.endTime}</span>
              </div>
            )}
            {machine.burnInTest.duration && (
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">测试时长</span>
                <span className="font-medium">{formatDuration(machine.burnInTest.duration)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-600">操作人员</span>
              <span className="font-medium">{machine.burnInTest.operator}</span>
            </div>
          </div>

          <h3 className="font-semibold text-gray-900 mb-4">测试项目</h3>
          <div className="space-y-4">
            {machine.burnInTest.items.map(item => (
              <div 
                key={item.id} 
                className={`rounded-xl border ${item.status === 'failed' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'} p-4`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${testItemStatusColors[item.status]}`}>
                    {testItemStatusLabels[item.status]}
                  </span>
                </div>
                
                {item.result && (
                  <div className="mb-2">
                    <p className="text-sm text-gray-600">测试结果: <span className="font-medium">{item.result}</span></p>
                  </div>
                )}
                
                {item.remarks && (
                  <div className="mb-2">
                    <p className="text-sm text-gray-600">备注: <span className="font-medium">{item.remarks}</span></p>
                  </div>
                )}

                {item.testedAt && (
                  <div className="text-xs text-gray-400">
                    测试时间: {item.testedAt} | 测试人员: {item.tester}
                  </div>
                )}

                {(machine.status === 'testing' || machine.status === 'test_failed') && item.status === 'pending' && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleTestResult(item.id, 'passed', '通过', '')}
                      className="btn btn-success flex-1 flex items-center justify-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      通过
                    </button>
                    <button
                      onClick={() => handleTestResult(item.id, 'failed', '失败', '')}
                      className="btn btn-danger flex-1 flex items-center justify-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      失败
                    </button>
                    <button
                      onClick={() => handleTestResult(item.id, 'skipped', '', '跳过此测试项')}
                      className="btn btn-secondary flex items-center justify-center gap-2"
                    >
                      <SkipForward className="h-4 w-4" />
                      跳过
                    </button>
                  </div>
                )}

                {item.status === 'failed' && (
                  <div className="flex items-start gap-2 mt-3 p-3 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{item.remarks || '此测试项失败，请检查相关硬件或重新测试'}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {machine.burnInTest.remarks && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">测试备注: </span>{machine.burnInTest.remarks}
              </p>
            </div>
          )}
        </>
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
