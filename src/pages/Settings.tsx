import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Bell,
  Upload,
  User,
  Moon,
  Sun,
  Globe,
  Shield,
  FileText,
  CheckCircle,
  AlertCircle,
  Trash2,
  Plus,
  X,
  ChevronRight,
  Phone,
  Mail,
  MessageSquare,
  Info,
  Database,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ROLE_LABELS } from '@/types';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  read: boolean;
  createdAt: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  createdAt: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: '案件催办通知',
    message: '案件 LP202401150001 已被催办，请尽快处理',
    type: 'warning',
    read: false,
    createdAt: '2024-01-15 14:30:00',
  },
  {
    id: '2',
    title: '审批通过通知',
    message: '案件 LP202401140002 已审批通过，请进行赔付计算',
    type: 'success',
    read: false,
    createdAt: '2024-01-15 10:15:00',
  },
  {
    id: '3',
    title: '材料补充提醒',
    message: '案件 LP202401130003 需要补充：住院费用明细清单',
    type: 'info',
    read: true,
    createdAt: '2024-01-14 16:45:00',
  },
  {
    id: '4',
    title: '系统维护通知',
    message: '系统将于今晚22:00-24:00进行维护，请提前保存数据',
    type: 'info',
    read: true,
    createdAt: '2024-01-14 09:00:00',
  },
];

export default function Settings() {
  const navigate = useNavigate();
  const { handlers, currentUserId, settings, updateSettings, setCurrentUserId } =
    useAppStore();

  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [activeTab, setActiveTab] = useState<'notifications' | 'upload' | 'system'>(
    'notifications'
  );
  const [isDragging, setIsDragging] = useState(false);

  const currentUser = handlers.find((h) => h.id === currentUserId);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    e.target.value = '';
  };

  const handleFiles = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file) => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0,
      createdAt: new Date().toISOString(),
    }));

    setUploadedFiles([...newFiles, ...uploadedFiles]);

    newFiles.forEach((file) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === file.id
                ? { ...f, status: 'success', progress: 100 }
                : f
            )
          );
        } else {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === file.id ? { ...f, progress: Math.round(progress) } : f
            )
          );
        }
      }, 300);
    });
  };

  const handleDeleteFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1e3a5f]">
          <SettingsIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">系统设置</h1>
          <p className="text-sm text-slate-500">管理通知、文件上传和系统偏好</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-4">
              <button
                onClick={() => setActiveTab('notifications')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  activeTab === 'notifications'
                    ? 'bg-[#1e3a5f] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                <Bell className="h-4 w-4" />
                通知中心
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  activeTab === 'upload'
                    ? 'bg-[#1e3a5f] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                <Upload className="h-4 w-4" />
                文件上传
              </button>
              <button
                onClick={() => setActiveTab('system')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  activeTab === 'system'
                    ? 'bg-[#1e3a5f] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                <Globe className="h-4 w-4" />
                系统设置
              </button>
            </div>

            {activeTab === 'notifications' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800">
                    通知列表
                  </h2>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      全部标为已读
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleMarkAsRead(notification.id)}
                        className={cn(
                          'flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md',
                          !notification.read
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        )}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={cn(
                                'font-medium',
                                !notification.read
                                  ? 'text-slate-900'
                                  : 'text-slate-700'
                              )}
                            >
                              {notification.title}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-slate-400">
                                {notification.createdAt}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNotification(notification.id);
                                }}
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Bell className="mx-auto h-12 w-12 text-slate-400" />
                      <p className="mt-4 text-slate-600">暂无通知</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    外部通知（占位）
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <Phone className="h-6 w-6 text-blue-500" />
                      <span className="text-sm text-slate-700">短信通知</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors">
                      <Mail className="h-6 w-6 text-emerald-500" />
                      <span className="text-sm text-slate-700">邮件通知</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-colors">
                      <MessageSquare className="h-6 w-6 text-purple-500" />
                      <span className="text-sm text-slate-700">微信通知</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'upload' && (
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4">
                  文件上传中心
                </h2>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
                    isDragging
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50'
                  )}
                >
                  <Upload
                    className={cn(
                      'mx-auto h-12 w-12 mb-4',
                      isDragging ? 'text-purple-500' : 'text-slate-400'
                    )}
                  />
                  <p className="text-lg font-medium text-slate-700 mb-2">
                    拖拽文件到此处上传
                  </p>
                  <p className="text-sm text-slate-500 mb-4">
                    或点击下方按钮选择文件
                  </p>
                  <label className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors cursor-pointer">
                    <Plus className="h-4 w-4" />
                    选择文件
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  <p className="mt-4 text-xs text-slate-400">
                    支持 PDF、JPG、PNG、DOC 等格式，单个文件最大 10MB
                  </p>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-slate-800">
                        已上传文件 ({uploadedFiles.length})
                      </h3>
                      <button
                        onClick={() => setUploadedFiles([])}
                        className="text-sm text-red-500 hover:text-red-600"
                      >
                        清空列表
                      </button>
                    </div>
                    <div className="space-y-2">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white"
                        >
                          <div className="flex-shrink-0">
                            {file.status === 'success' ? (
                              <CheckCircle className="h-8 w-8 text-emerald-500" />
                            ) : file.status === 'error' ? (
                              <AlertCircle className="h-8 w-8 text-red-500" />
                            ) : (
                              <FileText className="h-8 w-8 text-purple-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatFileSize(file.size)}
                            </p>
                            {file.status === 'uploading' && (
                              <div className="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-500 rounded-full transition-all"
                                  style={{ width: `${file.progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">
                              {file.status === 'uploading'
                                ? `${file.progress}%`
                                : file.status === 'success'
                                ? '上传成功'
                                : '上传失败'}
                            </span>
                            <button
                              onClick={() => handleDeleteFile(file.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <h3 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    上传说明（占位）
                  </h3>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• 此为文件上传占位功能，实际集成时需对接文件存储服务</li>
                    <li>• 支持批量上传，支持断点续传</li>
                    <li>• 大文件建议压缩后上传</li>
                    <li>• 涉及个人隐私的文件请加密后上传</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-4">
                    当前用户
                  </h2>
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                    {currentUser && (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="h-16 w-16 rounded-full"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-lg">
                        {currentUser?.name}
                      </p>
                      <p className="text-slate-600">
                        {currentUser?.role && ROLE_LABELS[currentUser.role]}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-500 mb-1">
                        切换用户
                      </label>
                      <select
                        value={currentUserId}
                        onChange={(e) => setCurrentUserId(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        {handlers.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name} ({ROLE_LABELS[h.role]})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-4">
                    外观设置
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-white border border-slate-200">
                      <div className="flex items-center gap-3">
                        {settings.theme === 'dark' ? (
                          <Moon className="h-5 w-5 text-indigo-600" />
                        ) : (
                          <Sun className="h-5 w-5 text-amber-500" />
                        )}
                        <div>
                          <p className="font-medium text-slate-800">主题模式</p>
                          <p className="text-sm text-slate-500">
                            选择浅色或深色主题
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateSettings({ theme: 'light' })}
                          className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                            settings.theme === 'light'
                              ? 'bg-[#1e3a5f] text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          )}
                        >
                          浅色
                        </button>
                        <button
                          onClick={() => updateSettings({ theme: 'dark' })}
                          className={cn(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                            settings.theme === 'dark'
                              ? 'bg-[#1e3a5f] text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          )}
                        >
                          深色
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-4">
                    通知设置
                  </h2>
                  <div className="space-y-3">
                    {[
                      { key: 'caseUpdate', label: '案件状态更新', desc: '案件状态变化时发送通知' },
                      { key: 'urge', label: '催办通知', desc: '收到催办时发送通知' },
                      { key: 'approval', label: '审批结果', desc: '审批通过或退回时发送通知' },
                      { key: 'system', label: '系统通知', desc: '系统维护和更新通知' },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-4 rounded-lg bg-white border border-slate-200"
                      >
                        <div>
                          <p className="font-medium text-slate-800">
                            {item.label}
                          </p>
                          <p className="text-sm text-slate-500">{item.desc}</p>
                        </div>
                        <button className="relative h-6 w-11 rounded-full bg-emerald-500">
                          <div className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-white shadow-sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-4">
                    安全设置
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-white border border-slate-200">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-slate-800">
                            自动锁定
                          </p>
                          <p className="text-sm text-slate-500">
                            5分钟无操作后自动锁定应用
                          </p>
                        </div>
                      </div>
                      <button className="relative h-6 w-11 rounded-full bg-slate-300">
                        <div className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-white border border-slate-200">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-emerald-600" />
                        <div>
                          <p className="font-medium text-slate-800">
                            数据加密
                          </p>
                          <p className="text-sm text-slate-500">
                            本地数据加密存储
                          </p>
                        </div>
                      </div>
                      <button className="relative h-6 w-11 rounded-full bg-emerald-500">
                        <div className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-white shadow-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-purple-50 p-6">
            <h3 className="font-bold text-slate-800 mb-4">关于应用</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">应用名称</span>
                <span className="font-medium text-slate-800">
                  保险理赔中心
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">版本号</span>
                <span className="font-medium text-slate-800">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">技术栈</span>
                <span className="font-medium text-slate-800">Tauri + React</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">数据存储</span>
                <span className="font-medium text-slate-800">本地存储</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">快捷操作</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/data')}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2 text-slate-700">
                  <Database className="h-4 w-4" />
                  数据管理
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
              <button
                onClick={() => {
                  alert('帮助文档（占位）：将打开用户使用手册');
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2 text-slate-700">
                  <FileText className="h-4 w-4" />
                  帮助文档
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
              <button
                onClick={() => {
                  alert('检查更新（占位）：当前已是最新版本');
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2 text-slate-700">
                  <RefreshCw className="h-4 w-4" />
                  检查更新
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
