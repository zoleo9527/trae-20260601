import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  FileText,
  User,
  Palette,
  Clock,
  Calendar,
  X,
  File,
  AlertCircle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/StatusBadge';
import { StatusTimeline } from '@/components/StatusTimeline';
import { RemarkChain } from '@/components/RemarkChain';
import { cn } from '@/lib/utils';

export default function CustomerServiceOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    initMockData,
    getOrderById,
    getAuditLogs,
    getRemarksByOrderId,
    getScanFiles,
    uploadScanFile,
    currentRole,
    currentUser,
    setCurrentRole,
    setCurrentUser,
    addRemark,
  } = useAppStore();

  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    initMockData();
    if (!currentRole) {
      setCurrentRole('CUSTOMER_SERVICE');
    }
    if (!currentUser) {
      setCurrentUser('客服小王');
    }
  }, [initMockData, currentRole, currentUser, setCurrentRole, setCurrentUser]);

  const order = id ? getOrderById(id) : undefined;
  const auditLogs = id ? getAuditLogs({ page: 1, pageSize: 100, orderId: id }).data : [];
  const remarks = id ? getRemarksByOrderId(id) : [];
  const scanFiles = id ? getScanFiles(id) : [];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const validateFile = (file: File): boolean => {
    const validExtensions = ['.stl', '.obj'];
    const fileName = file.name.toLowerCase();
    return validExtensions.some((ext) => fileName.endsWith(ext));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(validateFile);

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }

    const invalidFiles = files.filter((f) => !validateFile(f));
    if (invalidFiles.length > 0) {
      alert(`仅支持 .stl 和 .obj 格式文件，已跳过 ${invalidFiles.length} 个无效文件`);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(validateFile);

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }

    const invalidFiles = files.filter((f) => !validateFile(f));
    if (invalidFiles.length > 0) {
      alert(`仅支持 .stl 和 .obj 格式文件，已跳过 ${invalidFiles.length} 个无效文件`);
    }

    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleSubmit = async () => {
    if (!order || selectedFiles.length === 0) return;

    setIsSubmitting(true);
    try {
      for (const file of selectedFiles) {
        await new Promise((resolve) => setTimeout(resolve, 500));

        uploadScanFile(
          {
            orderId: order.id,
            fileName: file.name,
            fileUrl: `/mock/scans/${order.orderNo}/${file.name}`,
            fileType: file.type || 'application/octet-stream',
            fileSize: file.size,
            uploadedBy: currentUser || '客服小王',
            customerServiceRemark: remark.trim(),
          },
          remark.trim()
        );
      }

      setUploadSuccess(true);
      setTimeout(() => {
        navigate('/customer-service');
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddRemark = (content: string) => {
    if (!order || !currentRole) return;
    addRemark(order.id, content, currentRole, currentUser || '系统');
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-neutral-300 mb-4" />
          <p className="text-neutral-500 mb-4">订单不存在或已被删除</p>
          <button
            onClick={() => navigate('/customer-service')}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            返回订单列表
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
                onClick={() => navigate('/customer-service')}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <ArrowLeft size={20} className="text-neutral-600" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                <FileText size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary-700">订单详情</h1>
                <p className="text-xs text-neutral-500">扫描上传 · 订单号：{order.orderNo}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <StatusBadge status={order.status} />
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <User size={16} />
                <span>{currentUser || '未登录'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-transparent">
                <h2 className="text-base font-semibold text-neutral-800">订单基本信息</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <FileText size={18} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">订单号</p>
                      <p className="font-semibold text-primary-600">{order.orderNo}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">客户姓名</p>
                      <p className="font-medium text-neutral-800">{order.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <Palette size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">义齿类型</p>
                      <p className="font-medium text-neutral-800">{order.toothType}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-warning-50 flex items-center justify-center flex-shrink-0">
                      <Palette size={18} className="text-warning-600" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">色号</p>
                      <span className="inline-block px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 font-medium text-sm">
                        {order.shade}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-success-50 flex items-center justify-center flex-shrink-0">
                      <Calendar size={18} className="text-success-600" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">交付日期</p>
                      <p className="font-medium text-neutral-800">{order.deliveryDate}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                      <Clock size={18} className="text-neutral-600" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">创建时间</p>
                      <p className="font-medium text-neutral-800">
                        {new Date(order.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  {order.reworkCount > 0 && (
                    <div className="flex items-start gap-3 md:col-span-2">
                      <div className="w-10 h-10 rounded-lg bg-danger-50 flex items-center justify-center flex-shrink-0">
                        <AlertCircle size={18} className="text-danger-600" />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">返工次数</p>
                        <p className="font-medium text-danger-600">{order.reworkCount} 次</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {order.status === 'PENDING' ? (
              <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-transparent">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-neutral-800">扫描文件上传</h2>
                      <p className="text-xs text-neutral-500 mt-0.5">支持拖拽上传，仅接受 .stl 和 .obj 格式</p>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-warning-100 text-warning-700 text-xs rounded-full">
                      <AlertCircle size={12} />
                      待上传
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div
                    className={cn(
                      'relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200',
                      isDragOver
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-300 bg-neutral-50 hover:border-primary-300 hover:bg-primary-50/30'
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept=".stl,.obj"
                      multiple
                      onChange={handleFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="pointer-events-none">
                      <div
                        className={cn(
                          'w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center transition-colors',
                          isDragOver ? 'bg-primary-100' : 'bg-neutral-100'
                        )}
                      >
                        <Upload
                          size={32}
                          className={cn(
                            'transition-colors',
                            isDragOver ? 'text-primary-600' : 'text-neutral-400'
                          )}
                        />
                      </div>
                      <p
                        className={cn(
                          'text-base font-medium mb-2',
                          isDragOver ? 'text-primary-600' : 'text-neutral-700'
                        )}
                      >
                        {isDragOver ? '释放文件以上传' : '拖拽文件到此处'}
                      </p>
                      <p className="text-sm text-neutral-500">
                        或 <span className="text-primary-600 font-medium">点击选择文件</span>
                      </p>
                      <p className="text-xs text-neutral-400 mt-3">
                        支持格式：.stl、.obj | 单个文件建议不超过 100MB
                      </p>
                    </div>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="mt-5">
                      <h3 className="text-sm font-medium text-neutral-700 mb-3">
                        已选择 {selectedFiles.length} 个文件
                      </h3>
                      <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                                <File size={18} className="text-primary-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-neutral-800 truncate">
                                  {file.name}
                                </p>
                                <p className="text-xs text-neutral-500">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => removeFile(index)}
                              className="p-1.5 rounded-lg hover:bg-danger-50 text-neutral-400 hover:text-danger-500 transition-colors flex-shrink-0"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-5">
                    <div className="flex items-start gap-2 mb-2">
                      <label className="block text-sm font-medium text-neutral-700">
                        客服备注
                      </label>
                      <div className="group relative">
                        <Info size={14} className="text-neutral-400" />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-neutral-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          此备注将传递至后续派单环节
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg mb-3">
                      <p className="text-sm text-warning-700 flex items-start gap-2">
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>重要提示：</strong>此备注将传递至后续派单环节，设计师和技师都将看到此备注内容。
                        </span>
                      </p>
                    </div>
                    <textarea
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder="请输入备注内容，如特殊设计要求、色号注意事项、患者口腔情况等..."
                      rows={4}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                    />
                    <p className="text-xs text-neutral-400 mt-2 text-right">
                      {remark.length} / 500 字
                    </p>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => navigate('/customer-service')}
                      className="px-5 py-2.5 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={selectedFiles.length === 0 || isSubmitting || uploadSuccess}
                      className={cn(
                        'flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all duration-200',
                        uploadSuccess
                          ? 'bg-success-500 text-white'
                          : 'bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      {uploadSuccess ? (
                        <>
                          <CheckCircle2 size={18} />
                          上传成功，正在返回...
                        </>
                      ) : isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          上传中...
                        </>
                      ) : (
                        <>
                          <Upload size={18} />
                          提交上传
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-200 bg-gradient-to-r from-success-50 to-transparent">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-neutral-800">已上传扫描文件</h2>
                      <p className="text-xs text-neutral-500 mt-0.5">该订单已上传 {scanFiles.length} 个扫描文件</p>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-success-100 text-success-700 text-xs rounded-full">
                      <CheckCircle2 size={12} />
                      已上传
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  {scanFiles.length > 0 ? (
                    <div className="space-y-3">
                      {scanFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-primary-200 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                              <File size={24} className="text-primary-600" />
                            </div>
                            <div>
                              <p className="font-medium text-neutral-800">{file.fileName}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-neutral-500">
                                  {formatFileSize(file.fileSize)}
                                </span>
                                <span className="text-xs text-neutral-500">
                                  上传于 {new Date(file.uploadedAt).toLocaleString('zh-CN')}
                                </span>
                                <span className="text-xs text-neutral-500">
                                  上传人：{file.uploadedBy}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span
                            className={cn(
                              'px-3 py-1 rounded-full text-xs font-medium',
                              file.status === 'PROCESSED'
                                ? 'bg-success-100 text-success-700'
                                : 'bg-warning-100 text-warning-700'
                            )}
                          >
                            {file.status === 'PROCESSED' ? '已处理' : '待处理'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <File size={40} className="mx-auto text-neutral-300 mb-3" />
                      <p className="text-neutral-500 text-sm">暂无扫描文件</p>
                    </div>
                  )}
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
