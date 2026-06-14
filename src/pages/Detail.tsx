import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { STATUS_LABELS, STATUS_COLORS } from '../types';
import { ArrowLeft, Camera, Clock, User, FileText, AlertCircle, CheckCircle, XCircle, RefreshCw, Lock, History } from 'lucide-react';

const Detail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getRecordDetail, updateRecord, addHistory, user } = useAppStore();

  const [record, setRecord] = useState(getRecordDetail(id || '') || null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    const detail = getRecordDetail(id || '');
    if (detail) {
      setRecord(detail);
    }
  }, [id, getRecordDetail]);

  const handleClose = () => {
    if (!user || user.role !== 'finance') {
      alert('只有财务可以关闭记录');
      return;
    }

    const now = new Date();
    const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);
    const historyId = `H${String(now.getTime()).slice(-4)}`;

    updateRecord(id || '', {
      status: 'closed',
    });

    addHistory({
      id: historyId,
      recordId: id || '',
      statusFrom: record?.status || 'approved',
      statusTo: 'closed',
      operatorId: user.id,
      operatorName: user.name,
      remark: '财务确认完成，记录关闭',
      createdAt: timeStr,
    });

    alert('记录已关闭！');
    navigate('/');
  };

  const handleRecheck = () => {
    if (!user || user.role !== 'finance') {
      alert('只有财务可以发起回查');
      return;
    }

    const now = new Date();
    const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);
    const historyId = `H${String(now.getTime()).slice(-4)}`;

    updateRecord(id || '', {
      status: 'recheck',
    });

    addHistory({
      id: historyId,
      recordId: id || '',
      statusFrom: record?.status || 'approved',
      statusTo: 'recheck',
      operatorId: user.id,
      operatorName: user.name,
      remark: '财务发起回查',
      createdAt: timeStr,
    });

    alert('已发起回查！');
    navigate('/');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'reviewing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'closed':
        return <Lock className="w-4 h-4" />;
      case 'recheck':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (!record) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">记录不存在</p>
      </div>
    );
  }

  const isFinance = user?.role === 'finance';
  const canClose = isFinance && (record.status === 'approved' || record.status === 'recheck');
  const canRecheck = isFinance && record.status === 'approved';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回</span>
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">记录详情</h1>
              <span className={`status-badge ${STATUS_COLORS[record.status]}`}>
                {STATUS_LABELS[record.status]}
              </span>
            </div>
            <div className="flex gap-2">
              {canRecheck && (
                <button
                  onClick={handleRecheck}
                  className="btn-secondary flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  发起回查
                </button>
              )}
              {canClose && (
                <button
                  onClick={handleClose}
                  className="btn-primary flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  关闭记录
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">当品信息</h2>
              
              {record.photos.length > 0 && (
                <div className="mb-4">
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 mb-2">
                    <img
                      src={record.photos[activePhotoIndex]}
                      alt={record.model}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {record.photos.length > 1 && (
                    <div className="flex gap-2">
                      {record.photos.map((photo, index) => (
                        <button
                          key={index}
                          onClick={() => setActivePhotoIndex(index)}
                          className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                            activePhotoIndex === index ? 'border-primary-500' : 'border-transparent'
                          }`}
                        >
                          <img
                            src={photo}
                            alt={`缩略图${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">编号</span>
                  </div>
                  <p className="font-medium text-gray-900">{record.id}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">品类</span>
                  </div>
                  <p className="font-medium text-gray-900">{record.category}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">品牌</span>
                  </div>
                  <p className="font-medium text-gray-900">{record.brand || '-'}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">型号</span>
                  </div>
                  <p className="font-medium text-gray-900">{record.model}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">成色</span>
                  </div>
                  <p className="font-medium text-gray-900">{record.condition}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">重量</span>
                  </div>
                  <p className="font-medium text-gray-900">{record.weight}g</p>
                </div>
                {record.estimatedValue && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">估价金额</span>
                    </div>
                    <p className="font-semibold text-gold-600">¥{record.estimatedValue.toLocaleString()}</p>
                  </div>
                )}
                {record.rejectReason && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-red-500">退回原因</span>
                    </div>
                    <p className="font-medium text-red-600">{record.rejectReason}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">备注信息</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{record.remark || '暂无备注'}</p>
            </div>

            <div className="card">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">补充备注历史</h2>
              {record.notes.length === 0 ? (
                <p className="text-gray-400 text-center py-4">暂无补充备注</p>
              ) : (
                <div className="space-y-3">
                  {record.notes.map((note) => (
                    <div key={note.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{note.operatorName}</span>
                        <span className="text-xs text-gray-400">{note.createdAt}</span>
                      </div>
                      <p className="text-sm text-gray-600">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
                <History className="w-4 h-4 inline mr-2" />
                状态流转
              </h2>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-4">
                  {record.history.map((item, index) => (
                    <div key={item.id} className="relative pl-10">
                      <div className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center ${
                        STATUS_COLORS[item.statusTo]
                      }`}>
                        {getStatusIcon(item.statusTo)}
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <span className={`status-badge ${STATUS_COLORS[item.statusTo]}`}>
                            {STATUS_LABELS[item.statusTo]}
                          </span>
                          {item.statusFrom && (
                            <span className="text-xs text-gray-400">
                              从 {STATUS_LABELS[item.statusFrom]} 变更
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{item.operatorName}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">{item.createdAt}</span>
                        </div>
                        {item.remark && (
                          <p className="text-sm text-gray-600 mt-2">{item.remark}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">操作信息</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">登记人</span>
                  <span className="text-sm font-medium text-gray-900">{record.operatorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">登记时间</span>
                  <span className="text-sm font-medium text-gray-900">{record.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">最后更新</span>
                  <span className="text-sm font-medium text-gray-900">{record.updatedAt}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Detail;
