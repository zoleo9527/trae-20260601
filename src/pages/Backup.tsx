import { useState } from 'react';
import { Download, Upload, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useCourseStore } from '@/store/courseStore';

export default function Backup() {
  const { exportData, importData } = useCourseStore();
  const [importText, setImportText] = useState('');
  interface MessageState {
  type: 'success' | 'error' | null;
  text: string;
}
const [message, setMessage] = useState<MessageState>({ type: null, text: '' });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `course-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsExporting(false);
      setMessage({ type: 'success', text: '数据导出成功！' });
      setTimeout(() => setMessage({ type: null, text: '' }), 3000);
    }, 500);
  };

  const handleImport = () => {
    if (!importText.trim()) {
      setMessage({ type: 'error', text: '请输入要导入的数据' });
      setTimeout(() => setMessage({ type: null, text: '' }), 3000);
      return;
    }

    const success = importData(importText);
    if (success) {
      setMessage({ type: 'success', text: '数据导入成功！' });
      setImportText('');
    } else {
      setMessage({ type: 'error', text: '数据格式错误，请检查后重试' });
    }
    setTimeout(() => setMessage({ type: null, text: '' }), 3000);
  };

  const handleClearStorage = () => {
    if (window.confirm('确定要清除所有本地存储的数据吗？此操作不可恢复。')) {
      localStorage.removeItem('course-storage');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">数据导出</h2>
          <p className="text-sm text-gray-500 mt-1">导出所有实验课程和材料数据</p>
        </div>
        <div className="p-6">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>导出中...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>导出数据</span>
              </>
            )}
          </button>
          <p className="mt-3 text-sm text-gray-500">
            点击导出按钮将下载包含所有课程和材料数据的 JSON 文件。建议定期备份数据以防丢失。
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">数据导入</h2>
          <p className="text-sm text-gray-500 mt-1">从备份文件恢复数据</p>
        </div>
        <div className="p-6">
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="粘贴 JSON 格式的备份数据..."
            className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none font-mono text-sm"
          />
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleImport}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>导入数据</span>
            </button>
            <button
              onClick={handleClearStorage}
              className="flex items-center gap-2 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>重置数据</span>
            </button>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            导入数据将覆盖当前所有数据，请确保已备份当前数据。重置数据将恢复到初始状态。
          </p>
        </div>
      </div>

      {message.type && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </span>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h3 className="font-medium text-amber-800 mb-3">备份恢复说明</h3>
        <ul className="space-y-2 text-sm text-amber-700">
          <li className="flex items-start gap-2">
            <span className="font-medium">1.</span>
            <span>导出功能会将所有课程和材料数据保存为 JSON 文件。</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-medium">2.</span>
            <span>导入功能会覆盖当前所有数据，请谨慎操作。</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-medium">3.</span>
            <span>建议定期导出备份，以防数据丢失。</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-medium">4.</span>
            <span>重置数据会清除所有自定义数据，恢复到初始状态。</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
