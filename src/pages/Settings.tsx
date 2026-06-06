import { useState, useRef } from 'react';
import { useStore } from '@/store';
import {
  DatabaseBackup,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  FileJson,
  Save,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function Settings() {
  const { backupData, restoreData, resetDemoData, animals, medicalRecords } = useStore();
  const [restoreMessage, setRestoreMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = () => {
    const data = backupData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `animal-rescue-backup-${format(new Date(), 'yyyyMMdd-HHmmss', { locale: zhCN })}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = restoreData(content);
        if (success) {
          setRestoreMessage({ type: 'success', text: '数据恢复成功！' });
        } else {
          setRestoreMessage({ type: 'error', text: '数据恢复失败，文件格式不正确' });
        }
      } catch {
        setRestoreMessage({ type: 'error', text: '数据恢复失败，无法解析文件' });
      }
    };
    reader.readAsText(file);

    setTimeout(() => setRestoreMessage(null), 3000);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetDemo = () => {
    if (window.confirm('确定要重置为演示数据吗？当前所有数据将被覆盖。')) {
      resetDemoData();
      setRestoreMessage({ type: 'success', text: '已重置为演示数据' });
      setTimeout(() => setRestoreMessage(null), 3000);
    }
  };

  const storageSize = JSON.stringify(localStorage.getItem('animal-rescue-station-storage')).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">备份与设置</h2>
        <p className="text-sm text-gray-500 mt-1">管理数据备份和系统设置</p>
      </div>

      {/* Status Message */}
      {restoreMessage && (
        <div
        className={`p-4 rounded-lg flex items-center gap-3 ${
          restoreMessage.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}
      >
        {restoreMessage.type === 'success' ? (
          <CheckCircle size={20} />
        ) : (
          <AlertTriangle size={20} />
        )}
        <span className="font-medium">{restoreMessage.text}</span>
      </div>
    )}

      {/* Data Statistics */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DatabaseBackup size={18} className="text-blue-600" />
          数据概览
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{animals.length}</p>
            <p className="text-sm text-gray-500">救助动物</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{medicalRecords.length}</p>
            <p className="text-sm text-gray-500">医疗记录</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {(storageSize / 1024).toFixed(1)} KB
            </p>
            <p className="text-sm text-gray-500">存储占用</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          数据自动保存至浏览器本地存储 (LocalStorage)，清除浏览器数据会导致数据丢失，请定期备份。
        </p>
      </div>

      {/* Backup */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Download size={18} className="text-green-600" />
          数据备份
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          将所有数据导出为 JSON 文件保存到本地，可用于数据迁移或恢复。
        </p>
        <button
          onClick={handleBackup}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Save size={18} />
          导出备份文件
        </button>
      </div>

      {/* Restore */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Upload size={18} className="text-blue-600" />
          数据恢复
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          从备份文件恢复数据，此操作会覆盖当前所有数据。
        </p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleRestore}
          accept=".json"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FileJson size={18} />
          选择备份文件恢复
        </button>
      </div>

      {/* Demo Data */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <RotateCcw size={18} className="text-orange-600" />
          演示数据
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          重置为系统预置的演示数据，用于测试或演示完整流程。
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">注意</p>
            <p className="text-xs text-yellow-700">
              此操作会清除所有现有数据并替换为演示数据，请确保已备份重要数据。
            </p>
          </div>
        </div>
        <button
          onClick={handleResetDemo}
          className="inline-flex items-center gap-2 px-4 py-2 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors"
        >
          <RotateCcw size={18} />
          重置为演示数据
        </button>
      </div>

      {/* Demo Guide */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">演示操作指南</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium text-xs shrink-0">
              1
            </span>
            <div>
              <p className="font-medium text-gray-900">创建救助登记</p>
              <p>在"救助登记"页面点击"新建救助登记"，填写动物基本信息和救助信息。</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium text-xs shrink-0">
              2
            </span>
            <div>
              <p className="font-medium text-gray-900">处理救助</p>
              <p>进入救助详情页，点击"变更状态"可进行确认登记、转寄养、转入治疗等操作。</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-medium text-xs shrink-0">
              3
            </span>
            <div>
              <p className="font-medium text-gray-900">医疗评估</p>
              <p>切换到兽医角色，在"医疗评估"页面对动物进行评估，添加评估、治疗、回访记录。</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-medium text-xs shrink-0">
              4
            </span>
            <div>
              <p className="font-medium text-gray-900">退回操作</p>
              <p>如领养不合适，可在详情页将状态变更为"退回"，记录退回原因。</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-medium text-xs shrink-0">
              5
            </span>
            <div>
              <p className="font-medium text-gray-900">补充资料</p>
              <p>随时可以在详情页添加回访记录、医疗记录，补充完善动物档案。</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-medium text-xs shrink-0">
              6
            </span>
            <div>
              <p className="font-medium text-gray-900">关闭档案</p>
              <p>动物领养成功或处理完成后，可将状态变更为"已关闭"完成整个流程。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
