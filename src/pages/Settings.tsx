import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Upload,
  RotateCcw,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportBackup = useAppStore((state) => state.exportBackup);
  const importBackup = useAppStore((state) => state.importBackup);
  const resetData = useAppStore((state) => state.resetData);
  const currentRole = useAppStore((state) => state.currentRole);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleExport = () => {
    exportBackup();
    setMessage({ type: 'success', text: '数据备份已导出' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const success = await importBackup(file);
    if (success) {
      setMessage({ type: 'success', text: '数据恢复成功' });
    } else {
      setMessage({ type: 'error', text: '数据恢复失败，请检查文件格式' });
    }
    setTimeout(() => setMessage(null), 3000);
    e.target.value = '';
  };

  const handleReset = () => {
    resetData();
    setShowResetConfirm(false);
    setMessage({ type: 'success', text: '数据已重置为初始状态' });
    setTimeout(() => setMessage(null), 3000);
  };

  if (currentRole !== 'manager') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">权限不足</h2>
          <p className="text-gray-500 mb-4">只有租赁经理可以访问系统设置</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-[#1e3a5f] text-white rounded hover:bg-[#2d4a6f] transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-[#1e3a5f] transition-colors mb-4"
          >
            <ArrowLeft size={18} />
            返回异常单看板
          </button>
          <h1 className="text-2xl font-bold text-gray-800">系统设置</h1>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <XCircle size={20} />
            )}
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Database size={20} />
              数据管理
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              备份和恢复系统数据。建议定期导出备份，防止数据丢失。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleExport}
                className="p-6 border-2 border-dashed border-gray-200 rounded-lg hover:border-[#1e3a5f] hover:bg-[#1e3a5f]/5 transition-all text-left group"
              >
                <Download
                  size={32}
                  className="text-gray-400 group-hover:text-[#1e3a5f] mb-3 transition-colors"
                />
                <h3 className="font-bold text-gray-800 mb-1">导出备份</h3>
                <p className="text-sm text-gray-500">
                  将所有数据导出为JSON文件，保存到本地
                </p>
              </button>

              <button
                onClick={handleImportClick}
                className="p-6 border-2 border-dashed border-gray-200 rounded-lg hover:border-[#1e3a5f] hover:bg-[#1e3a5f]/5 transition-all text-left group"
              >
                <Upload
                  size={32}
                  className="text-gray-400 group-hover:text-[#1e3a5f] mb-3 transition-colors"
                />
                <h3 className="font-bold text-gray-800 mb-1">导入备份</h3>
                <p className="text-sm text-gray-500">
                  从JSON备份文件恢复数据，将覆盖当前数据
                </p>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <RotateCcw size={20} />
              重置数据
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              重置所有数据为初始演示状态。此操作不可撤销。
            </p>

            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <RotateCcw size={16} />
                重置为演示数据
              </button>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 mb-3">
                  <AlertTriangle size={16} className="inline mr-2" />
                  确定要重置所有数据吗？此操作将清除所有操作记录，恢复为初始演示数据。
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    确认重置
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">使用说明</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <span className="bg-yellow-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  1
                </span>
                <div>
                  <p className="font-medium text-gray-800">从异常单开始</p>
                  <p>
                    首页展示所有卡住的单子，按卡顿时间排序。点击任意异常单进入详情页处理。
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-yellow-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  2
                </span>
                <div>
                  <p className="font-medium text-gray-800">三角色接力</p>
                  <p>
                    使用顶部角色切换按钮，模拟租赁经理→调度→维修师傅的接力处理流程。每个角色只能执行对应权限的操作。
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-yellow-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  3
                </span>
                <div>
                  <p className="font-medium text-gray-800">快捷筛选</p>
                  <p>
                    使用筛选标签快速定位特定类型或特定角色负责的异常单。支持关键词搜索。
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-yellow-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  4
                </span>
                <div>
                  <p className="font-medium text-gray-800">合同回看</p>
                  <p>
                    在租期合同详情页可以查看从预约到归还的全流程时间线，所有操作记录一目了然。
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-yellow-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  5
                </span>
                <div>
                  <p className="font-medium text-gray-800">数据安全</p>
                  <p>
                    定期使用系统设置中的备份功能导出数据。如果操作出错，可以随时重置为演示数据。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1e3a5f] rounded-lg p-6 text-white">
            <h2 className="text-lg font-bold mb-2">演示数据说明</h2>
            <p className="text-white/80 text-sm mb-4">
              系统预置了以下异常场景供演示：
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="font-medium text-yellow-400">缺材料</p>
                <p className="text-sm text-white/70">RES-2026-003 缺少身份证复印件和项目委托书</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="font-medium text-orange-400">超时未还</p>
                <p className="text-sm text-white/70">HT-2026-001 已超期5天，超期费用计算中</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="font-medium text-purple-400">油耗争议</p>
                <p className="text-sm text-white/70">HT-2026-008 客户质疑油耗过高</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="font-medium text-red-400">维修责任</p>
                <p className="text-sm text-white/70">WX-2026-009 液压泵损坏责任待认定</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 md:col-span-2">
                <p className="font-medium text-rose-400">复核不通过</p>
                <p className="text-sm text-white/70">WX-2026-007 经理驳回"自然损耗"认定，要求重新核实</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
