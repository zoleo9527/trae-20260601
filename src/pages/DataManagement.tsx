import { useState, useEffect } from 'react';
import {
  Database,
  HardDrive,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  Save,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileJson,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatDateTime, formatCurrency, formatFileSize } from '@/utils/workflow';
import { cn } from '@/lib/utils';
import { checkTauriEnvironment, getStorageInfo, StorageInfo } from '@/utils/storage';

export default function DataManagement() {
  const {
    claims,
    handlers,
    backups,
    settings,
    createBackup,
    restoreFromBackup,
    deleteBackup,
    exportBackup,
    importBackup,
    updateSettings,
    resetData,
  } = useAppStore();

  const [isTauri, setIsTauri] = useState(false);
  const [tauriStorageInfo, setTauriStorageInfo] = useState<StorageInfo | null>(null);

  const [backupName, setBackupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    total: 5 * 1024 * 1024,
    items: 0,
  });

  useEffect(() => {
    setIsTauri(checkTauriEnvironment());
    const updateStorageInfo = async () => {
      const info = await getStorageInfo();
      setTauriStorageInfo(info);
    };
    updateStorageInfo();

    const dataStr = JSON.stringify({ claims, handlers, backups });
    const used = new Blob([dataStr]).size;
    setStorageInfo({
      used,
      total: 5 * 1024 * 1024,
      items: claims.length,
    });
  }, [claims, handlers, backups]);

  const handleCreateBackup = async () => {
    if (!backupName.trim()) {
      alert('请输入备份名称');
      return;
    }

    setIsCreating(true);
    try {
      await createBackup(backupName);
      setBackupName('');
      const info = await getStorageInfo();
      setTauriStorageInfo(info);
      alert('备份创建成功！');
    } catch (error) {
      alert('备份创建失败');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async (backupId: string, backupName: string) => {
    if (
      !confirm(
        `确认从备份"${backupName}"恢复数据？\n此操作将覆盖当前所有数据，不可撤销。`
      )
    ) {
      return;
    }

    setIsRestoring(backupId);
    try {
      await restoreFromBackup(backupId);
      alert('数据恢复成功！');
    } catch (error) {
      alert(error instanceof Error ? error.message : '恢复失败');
    } finally {
      setIsRestoring(null);
    }
  };

  const handleDelete = async (backupId: string, backupName: string) => {
    if (!confirm(`确认删除备份"${backupName}"？此操作不可撤销。`)) {
      return;
    }

    try {
      await deleteBackup(backupId);
      const info = await getStorageInfo();
      setTauriStorageInfo(info);
      alert('备份已删除');
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleResetData = () => {
    if (
      !confirm(
        '确认重置所有数据？\n此操作将删除所有案件数据并恢复到初始状态，不可撤销。'
      )
    ) {
      return;
    }

    try {
      resetData();
      alert('数据已重置');
    } catch (error) {
      alert('重置失败');
    }
  };

  const handleExport = async (backupId: string) => {
    try {
      const path = await exportBackup(backupId);
      alert(`备份已导出到：\n${path}`);
    } catch (error) {
      alert('导出失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backupData = event.target?.result as string;
        const appData = JSON.parse(backupData);

        if (!appData.claims || !appData.handlers) {
          throw new Error('无效的备份文件格式');
        }

        if (!confirm('确认导入此备份文件？将覆盖当前所有数据。')) {
          return;
        }

        await importBackup(backupData);
        const info = await getStorageInfo();
        setTauriStorageInfo(info);
        alert('备份文件已导入成功！');
      } catch (error) {
        alert('导入失败：' + (error instanceof Error ? error.message : '格式错误'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const totalClaimAmount = claims.reduce((sum, c) => sum + c.claimAmount, 0);
  const completedClaims = claims.filter((c) => c.status === 'completed');
  const totalPaidAmount = completedClaims.reduce(
    (sum, c) => sum + (c.compensationCalc?.totalAmount || 0),
    0
  );

  const usagePercent = (storageInfo.used / storageInfo.total) * 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-gradient-to-br from-blue-500 to-blue-600 p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">案件总数</p>
              <p className="mt-2 text-3xl font-bold">{claims.length}</p>
              <p className="mt-1 text-sm text-blue-100">
                已完成 {completedClaims.length} 件
              </p>
            </div>
            <div className="rounded-full bg-white/20 p-3">
              <Database className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-purple-600" />
            <span className="text-sm text-slate-600">总报案金额</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {formatCurrency(totalClaimAmount)}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <span className="text-sm text-slate-600">已赔付金额</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-600">
            {formatCurrency(totalPaidAmount)}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-amber-600" />
            <span className="text-sm text-slate-600">备份数量</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{backups.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-blue-600" />
              本地存储状态
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">存储空间使用</span>
                  <span className="text-sm font-medium text-slate-800">
                    {formatFileSize(storageInfo.used)} / {formatFileSize(storageInfo.total)}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                    )}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                {usagePercent > 80 && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    存储空间即将用尽，请及时清理或导出备份
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">案件数据</p>
                  <p className="mt-1 text-lg font-bold text-slate-800">
                    {claims.length} 条
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">处理人员</p>
                  <p className="mt-1 text-lg font-bold text-slate-800">
                    {handlers.length} 人
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-500 mb-2">自动备份设置</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        updateSettings({ autoBackup: !settings.autoBackup })
                      }
                      className={cn(
                        'relative h-6 w-11 rounded-full transition-colors',
                        settings.autoBackup ? 'bg-emerald-500' : 'bg-slate-300'
                      )}
                    >
                      <div
                        className={cn(
                          'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm',
                          settings.autoBackup ? 'translate-x-5' : 'translate-x-0.5'
                        )}
                      />
                    </button>
                    <span className="text-sm text-slate-700">
                      {settings.autoBackup ? '已开启' : '已关闭'}
                    </span>
                  </div>
                  {settings.autoBackup && (
                    <select
                      value={settings.autoBackupDays}
                      onChange={(e) =>
                        updateSettings({ autoBackupDays: parseInt(e.target.value) })
                      }
                      className="rounded-lg border border-slate-300 px-3 py-1 text-sm"
                    >
                      <option value={3}>保留3天</option>
                      <option value={7}>保留7天</option>
                      <option value={14}>保留14天</option>
                      <option value={30}>保留30天</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleResetData}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  重置数据
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Save className="h-5 w-5 text-purple-600" />
                备份管理
              </h2>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  导入备份
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="mb-6 rounded-lg bg-slate-50 p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                  placeholder="输入备份名称（如：2024年1月数据备份）"
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                />
                <button
                  onClick={handleCreateBackup}
                  disabled={isCreating}
                  className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isCreating ? '创建中...' : '创建备份'}
                </button>
              </div>
            </div>

            {backups.length > 0 ? (
              <div className="space-y-3">
                {[...backups]
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                  )
                  .map((backup) => (
                    <div
                      key={backup.id}
                      className="rounded-lg border border-slate-200 p-4 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                            <FileJson className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{backup.name}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDateTime(backup.createdAt)}
                              </span>
                              <span>{formatFileSize(backup.size)}</span>
                              <span>{backup.itemCount} 条数据</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleExport(backup.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="导出"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRestore(backup.id, backup.name)}
                            disabled={isRestoring === backup.id}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                            title="恢复"
                          >
                            <RotateCcw
                              className={cn(
                                'h-4 w-4',
                                isRestoring === backup.id && 'animate-spin'
                              )}
                            />
                          </button>
                          <button
                            onClick={() => handleDelete(backup.id, backup.name)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="删除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <Save className="mx-auto h-12 w-12 text-slate-400" />
                <p className="mt-4 text-slate-600">暂无备份</p>
                <p className="mt-1 text-sm text-slate-500">
                  创建备份以保护您的数据安全
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-slate-50 p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              数据安全说明
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>
                  <strong>本地存储：</strong>
                  所有数据存储在本地，不上传服务器，确保数据安全
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>
                  <strong>自动备份：</strong>
                  开启后将在应用启动时自动创建备份
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">•</span>
                <span>
                  <strong>手动备份：</strong>
                  建议每周至少创建一次完整备份
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>
                  <strong>导出备份：</strong>
                  将备份文件保存到外部存储介质，防止数据丢失
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>
                  <strong>数据校验：</strong>
                  每个备份文件包含校验码，确保数据完整性
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border bg-gradient-to-br from-purple-50 to-blue-50 p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-purple-600" />
              快捷操作
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  const defaultName = `备份_${new Date().toLocaleString('zh-CN')}`;
                  setBackupName(defaultName);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-white font-medium hover:bg-purple-700 transition-colors"
              >
                <Save className="h-5 w-5" />
                快速备份当前数据
              </button>
              <button
                onClick={handleResetData}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-3 text-slate-700 font-medium hover:bg-slate-100 transition-colors"
              >
                <RotateCcw className="h-5 w-5" />
                重置为示例数据
              </button>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">存储位置</h3>
            {isTauri && tauriStorageInfo ? (
              <>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-slate-500 mb-2">应用数据目录</p>
                  <p className="text-sm font-mono text-slate-700 break-all">
                    {tauriStorageInfo.path}
                  </p>
                </div>
                <div className="mt-3 rounded-lg bg-emerald-50 p-4 border border-emerald-200">
                  <p className="text-sm text-emerald-700 mb-1">
                    <strong>Tauri 本地文件存储已启用</strong>
                  </p>
                  <p className="text-xs text-emerald-600">
                    数据已持久化到本地文件系统，共 {tauriStorageInfo.fileCount} 个文件，
                    占用 {formatFileSize(tauriStorageInfo.totalSize)}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-slate-500 mb-2">应用数据目录</p>
                  <p className="text-sm font-mono text-slate-700 break-all">
                    ~/Library/Application Support/insurance-claim-center/
                  </p>
                </div>
                <div className="mt-3 rounded-lg bg-slate-50 p-4">
                  <p className="text-sm text-slate-500 mb-2">备份目录</p>
                  <p className="text-sm font-mono text-slate-700 break-all">
                    ~/Library/Application Support/insurance-claim-center/backups/
                  </p>
                </div>
                <div className="mt-3 rounded-lg bg-amber-50 p-4 border border-amber-200">
                  <p className="text-sm text-amber-700 mb-1">
                    <strong>浏览器演示模式</strong>
                  </p>
                  <p className="text-xs text-amber-600">
                    当前使用浏览器 localStorage 进行数据存储，
                    打包为 Tauri 桌面应用后将自动切换到本地文件系统存储
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
