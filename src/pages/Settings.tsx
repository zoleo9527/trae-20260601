import React, { useState } from 'react';
import { Download, Upload, Database, Trash2, AlertTriangle, Info, User } from 'lucide-react';
import { storage } from '../utils/storage';
import { useAuthStore } from '../stores/authStore';
import { UserRole } from '../types';

const Settings: React.FC = () => {
  const { currentUser, role, setCurrentUser, setRole } = useAuthStore();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleExport = () => {
    const data = storage.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ktv-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        storage.importAll(data);
        window.location.reload();
      } catch (err) {
        alert('导入失败：文件格式不正确');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    storage.clear();
    window.location.reload();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-400" />
          当前用户
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 block mb-1.5">操作员姓名</label>
            <input
              type="text"
              value={currentUser}
              onChange={(e) => setCurrentUser(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1.5">角色权限</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="front_desk">前台操作员</option>
              <option value="manager">店长/管理</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400" />
          数据管理
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div>
              <p className="font-medium text-sm">导出数据</p>
              <p className="text-xs text-slate-400 mt-0.5">将所有业务数据导出为 JSON 文件备份</p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              导出
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div>
              <p className="font-medium text-sm">导入数据</p>
              <p className="text-xs text-slate-400 mt-0.5">从 JSON 备份文件恢复数据</p>
            </div>
            <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              导入
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div>
              <p className="font-medium text-sm text-red-400 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                清空所有数据
              </p>
              <p className="text-xs text-slate-400 mt-0.5">删除所有本地存储的数据，此操作不可恢复</p>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
            >
              清空
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-amber-400" />
          系统说明
        </h3>
        <div className="space-y-3 text-sm text-slate-400">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p><strong className="text-slate-300">账号体系：</strong>本系统使用本地角色切换，无真实用户认证体系。</p>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p><strong className="text-slate-300">第三方通知：</strong>无短信、微信等第三方推送功能，异常仅在本地提示。</p>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p><strong className="text-slate-300">附件上传：</strong>照片使用示例 URL 模拟，无真实文件上传存储。</p>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p><strong className="text-slate-300">离线可用：</strong>所有数据存储在浏览器本地，无网络时可正常使用。</p>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p><strong className="text-slate-300">数据安全：</strong>请定期导出数据备份，清除浏览器缓存会导致数据丢失。</p>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-sm w-full mx-4">
            <h4 className="font-semibold text-lg mb-2">确认清空数据？</h4>
            <p className="text-slate-400 text-sm mb-6">此操作将删除所有本地存储的数据，包括预订、套餐、会员、布置记录等，且不可恢复。建议先导出备份。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleClearData}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
