import { useState, useRef, useEffect } from 'react';
import { Beer, Bell, LogOut, User, AlertTriangle, X } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useBatchStore } from '@/store/useBatchStore';
import { useNavigate } from 'react-router-dom';
import { RoleBadge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { currentUser, logout } = useAuthStore();
  const { batches, getNotesByBatchId, getTestRecordsByBatchId } = useBatchStore();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const abnormalBatches = batches.filter(
    (b) => b.currentStatus === 'TEST_ABNORMAL' || b.currentStatus === 'REJECTED'
  );
  const pendingBatches = batches.filter((b) => b.currentStatus === 'PENDING_TEST');
  const testingBatches = batches.filter((b) => b.currentStatus === 'TESTING');
  const totalAlerts = abnormalBatches.length + testingBatches.length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNotificationClick = (batchId: string) => {
    setShowNotifications(false);
    const role = currentUser?.role;
    if (role === 'sales') {
      navigate('/sales');
    } else if (role === 'packaging') {
      navigate('/packaging');
    } else {
      navigate('/brewer');
    }
  };

  return (
    <header className="bg-white border-b border-neutral-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-amber-900">
            <Beer className="w-8 h-8" />
            <span className="text-xl font-bold font-serif">精酿工坊</span>
          </div>
          <span className="text-neutral-300">|</span>
          <h1 className="text-lg font-semibold text-neutral-800">{title}</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={notificationRef}>
            <button
              className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5 text-neutral-600" />
              {totalAlerts > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-warning-orange rounded-full text-white text-xs flex items-center justify-center animate-pulse">
                  {totalAlerts}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-lg border border-neutral-200 z-50 overflow-hidden">
                <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning-orange" />
                    <span className="text-sm font-semibold text-neutral-800">异常提醒</span>
                    {totalAlerts > 0 && (
                      <span className="bg-warning-orange text-white text-xs px-2 py-0.5 rounded-full">{totalAlerts}</span>
                    )}
                  </div>
                  <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-neutral-200 rounded">
                    <X className="w-4 h-4 text-neutral-400" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto scrollbar-thin">
                  {abnormalBatches.length === 0 && testingBatches.length === 0 ? (
                    <div className="py-8 text-center text-neutral-500">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                      <p className="text-sm">暂无异常提醒</p>
                    </div>
                  ) : (
                    <>
                      {abnormalBatches.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-red-50">
                            <span className="text-xs font-semibold text-red-700">检测异常 / 已拒签 ({abnormalBatches.length})</span>
                          </div>
                          {abnormalBatches.map((batch) => {
                            const latestTest = getTestRecordsByBatchId(batch.id)[0];
                            const notes = getNotesByBatchId(batch.id);
                            const packagingNote = notes.find((n) => n.role === 'packaging');

                            return (
                              <button
                                key={batch.id}
                                onClick={() => handleNotificationClick(batch.id)}
                                className="w-full text-left px-4 py-3 hover:bg-neutral-50 border-b border-neutral-100 transition-colors"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-neutral-800">{batch.productName}</span>
                                  <StatusBadge status={batch.currentStatus} />
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                                  <span className="font-mono">{batch.batchNo}</span>
                                  <span>{batch.tankNo}</span>
                                </div>
                                {packagingNote && (
                                  <p className="text-xs text-warning-orange truncate">
                                    品控备注: {packagingNote.content}
                                  </p>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {testingBatches.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-blue-50">
                            <span className="text-xs font-semibold text-blue-700">检测中 ({testingBatches.length})</span>
                          </div>
                          {testingBatches.map((batch) => (
                            <button
                              key={batch.id}
                              onClick={() => handleNotificationClick(batch.id)}
                              className="w-full text-left px-4 py-3 hover:bg-neutral-50 border-b border-neutral-100 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-neutral-800">{batch.productName}</span>
                                <StatusBadge status={batch.currentStatus} />
                              </div>
                              <div className="flex items-center gap-2 text-xs text-neutral-500">
                                <span className="font-mono">{batch.batchNo}</span>
                                <span>等待品控检测完成</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {totalAlerts > 0 && (
                  <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-200">
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <span>异常: {abnormalBatches.length}</span>
                      <span>检测中: {testingBatches.length}</span>
                      <span>待检测: {pendingBatches.length}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {currentUser && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-amber-900" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-neutral-800">{currentUser.name}</p>
                  <RoleBadge role={currentUser.role} />
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                title="退出登录"
              >
                <LogOut className="w-5 h-5 text-neutral-600" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
