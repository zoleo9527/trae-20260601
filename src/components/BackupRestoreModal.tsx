import { useState, useRef } from 'react';
import { useStore } from '@/store';
import { BackupData } from '@/types';
import { X, Download, Upload, FileJson, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface BackupRestoreModalProps {
  onClose: () => void;
}

export function BackupRestoreModal({ onClose }: BackupRestoreModalProps) {
  const { exportBackup, importBackup, orders, users } = useStore();
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `校园维修数据备份_${format(new Date(), 'yyyyMMdd_HHmmss', { locale: zhCN })}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as BackupData;
        
        if (!data.version || !data.orders || !data.users) {
          throw new Error('备份文件格式不正确');
        }

        importBackup(data);
        setImportStatus('success');
        setTimeout(() => {
          onClose();
        }, 1500);
      } catch (err) {
        setImportStatus('error');
        setErrorMessage(err instanceof Error ? err.message : '导入失败');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">数据备份与恢复</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('export')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'export'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Download className="w-4 h-4" />
                <span>备份导出</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'import'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>恢复导入</span>
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">当前数据概览</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white rounded p-2">
                    <p className="text-gray-500">工单总数</p>
                    <p className="text-lg font-semibold text-gray-900">{orders.length}</p>
                  </div>
                  <div className="bg-white rounded p-2">
                    <p className="text-gray-500">用户数</p>
                    <p className="text-lg font-semibold text-gray-900">{users.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                <p>• 导出的数据包含所有工单、完工记录、返修记录和用户信息</p>
                <p>• 导出文件为 JSON 格式，请妥善保存</p>
                <p>• 建议定期备份，防止数据丢失</p>
              </div>

              <button
                onClick={handleExport}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
              >
                <FileJson className="w-5 h-5" />
                <span>导出备份文件</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {importStatus === 'success' ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">导入成功</h4>
                  <p className="text-gray-500">数据已成功恢复，即将关闭...</p>
                </div>
              ) : importStatus === 'error' ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800">导入失败</h4>
                      <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {importStatus !== 'success' && (
                <>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer"
                       onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-700 font-medium mb-1">点击选择备份文件</p>
                    <p className="text-sm text-gray-500">支持 JSON 格式的备份文件</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  <div className="text-sm text-gray-500 space-y-1">
                    <p>• 导入将覆盖当前所有数据，请谨慎操作</p>
                    <p>• 建议在导入前先导出当前数据进行备份</p>
                    <p>• 仅支持本系统导出的备份文件</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
