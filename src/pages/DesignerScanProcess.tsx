import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Wrench,
  User,
  File,
  Clock,
  Send,
  LogOut,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/StatusBadge';
import { StatusTimeline } from '@/components/StatusTimeline';
import { RemarkChain } from '@/components/RemarkChain';
import { cn } from '@/lib/utils';

export default function DesignerScanProcess() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    initMockData,
    getScanFileById,
    getOrderById,
    getAuditLogs,
    getRemarksByOrderId,
    getAvailableTechnicians,
    processScanFile,
    createAssignment,
    currentRole,
    currentUser,
    setCurrentRole,
    setCurrentUser,
    addRemark,
  } = useAppStore();

  const [designerRemark, setDesignerRemark] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [estimatedDays, setEstimatedDays] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  useEffect(() => {
    initMockData();
    if (!currentRole) {
      setCurrentRole('DESIGNER');
    }
    if (!currentUser) {
      setCurrentUser('设计师老李');
    }
  }, [initMockData, currentRole, currentUser, setCurrentRole, setCurrentUser]);

  const scanFile = id ? getScanFileById(id) : undefined;
  const order = scanFile ? getOrderById(scanFile.orderId) : undefined;
  const auditLogs = order ? getAuditLogs({ page: 1, pageSize: 100, orderId: order.id }).data : [];
  const remarks = order ? getRemarksByOrderId(order.id) : [];
  const technicians = getAvailableTechnicians();

  const handleProcess = async () => {
    if (!scanFile || scanFile.status !== 'UPLOADED') return;
    setIsProcessing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      processScanFile(scanFile.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssign = async () => {
    if (!scanFile || !order || !selectedTechnician) return;

    const technician = technicians.find((t) => t.id === selectedTechnician);
    if (!technician) return;

    setIsAssigning(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      createAssignment({
        scanFileId: scanFile.id,
        orderId: order.id,
        technicianId: technician.id,
        technicianName: technician.name,
        customerServiceRemark: scanFile.customerServiceRemark,
        designerRemark: designerRemark.trim(),
        estimatedDays,
      });

      setAssignSuccess(true);
      setTimeout(() => {
        navigate('/designer');
      }, 1500);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAddRemark = (content: string) => {
    if (!order || !currentRole) return;
    addRemark(order.id, content, currentRole, currentUser || '系统');
  };

  const handleLogout = () => {
    setCurrentRole(null);
    navigate('/');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (!scanFile || !order) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-neutral-300 mb-4" />
          <p className="text-neutral-500 mb-4">扫描文件不存在或已被删除</p>
          <button
            onClick={() => navigate('/designer')}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="container px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/designer')}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <ArrowLeft size={20} className="text-neutral-600" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                <Wrench size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary-700">扫描处理与派单</h1>
                <p className="text-xs text-neutral-500">订单号：{order.orderNo}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <StatusBadge status={order.status} />
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <User size={16} />
                <span>{currentUser || '未登录'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-600 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-transparent">
                <h2 className="text-base font-semibold text-neutral-800">扫描文件信息</h2>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center">
                    <File size={32} className="text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-800 truncate">{scanFile.fileName}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-neutral-500">
                        {formatFileSize(scanFile.fileSize)}
                      </span>
                      <span className="text-sm text-neutral-500">
                        上传于 {new Date(scanFile.uploadedAt).toLocaleString('zh-CN')}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          scanFile.status === 'PROCESSED'
                            ? 'bg-success-100 text-success-700'
                            : 'bg-warning-100 text-warning-700'
                        )}
                      >
                        {scanFile.status === 'PROCESSED' ? '已处理' : '待处理'}
                      </span>
                    </div>
                  </div>
                </div>

                {scanFile.customerServiceRemark && (
                  <div className="mt-4 p-4 bg-warning-50 border border-warning-200 rounded-lg">
                    <p className="text-sm font-medium text-warning-800 mb-1">客服备注：</p>
                    <p className="text-sm text-warning-700">{scanFile.customerServiceRemark}</p>
                  </div>
                )}

                {scanFile.status === 'UPLOADED' && (
                  <div className="mt-5 flex justify-end">
                    <button
                      onClick={handleProcess}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          处理中...
                        </>
                      ) : (
                        <>
                          <Wrench size={18} />
                          开始处理
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {scanFile.status === 'PROCESSED' && (
              <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-200 bg-gradient-to-r from-success-50 to-transparent">
                  <h2 className="text-base font-semibold text-neutral-800">智能派单</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      选择技师 <span className="text-danger-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {technicians.map((tech) => (
                        <div
                          key={tech.id}
                          onClick={() => setSelectedTechnician(tech.id)}
                          className={cn(
                            'p-4 rounded-lg border-2 cursor-pointer transition-all',
                            selectedTechnician === tech.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-neutral-200 hover:border-primary-300'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                              <User size={20} className="text-primary-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-neutral-800">{tech.name}</p>
                              <p className="text-sm text-neutral-500">{tech.specialty}</p>
                            </div>
                            <div
                              className={cn(
                                'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                                selectedTechnician === tech.id
                                  ? 'border-primary-500 bg-primary-500'
                                  : 'border-neutral-300'
                              )}
                            >
                              {selectedTechnician === tech.id && (
                                <CheckCircle2 size={14} className="text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      预计工期（天）
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={estimatedDays}
                      onChange={(e) => setEstimatedDays(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      设计师备注
                    </label>
                    <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg mb-3">
                      <p className="text-sm text-primary-700 flex items-start gap-2">
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>提示：</strong>此备注将与客服备注合并后传递给技师。
                        </span>
                      </p>
                    </div>
                    <textarea
                      value={designerRemark}
                      onChange={(e) => setDesignerRemark(e.target.value)}
                      placeholder="请输入设计说明、注意事项等..."
                      rows={4}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                    />
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => navigate('/designer')}
                      className="px-5 py-2.5 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleAssign}
                      disabled={!selectedTechnician || isAssigning || assignSuccess}
                      className={cn(
                        'flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all duration-200',
                        assignSuccess
                          ? 'bg-success-500 text-white'
                          : 'bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      {assignSuccess ? (
                        <>
                          <CheckCircle2 size={18} />
                          派单成功，正在返回...
                        </>
                      ) : isAssigning ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          派单中...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          确认派单
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <StatusTimeline logs={auditLogs} currentStatus={order.status} />
          </div>

          <div className="lg:col-span-1">
            <RemarkChain
              remarks={remarks}
              currentRole={currentRole}
              currentUser={currentUser || ''}
              onAddRemark={handleAddRemark}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
