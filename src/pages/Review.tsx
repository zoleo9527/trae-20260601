import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { STATUS_LABELS, STATUS_COLORS, REJECT_REASONS, RecordStatus } from '../types';
import { ArrowLeft, Check, X, Save, Eye } from 'lucide-react';

const Review = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getRecordDetail, updateRecord, addHistory, addNote, user, records } = useAppStore();

  const [record, setRecord] = useState<ReturnType<typeof getRecordDetail> | null>(null);
  const [currentStatus, setCurrentStatus] = useState<RecordStatus>('pending');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [remark, setRemark] = useState('');
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const transitionToReviewing = useCallback(() => {
    if (!user || user.role !== 'warehouse') return false;
    
    const now = new Date();
    const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);

    updateRecord(id || '', { status: 'reviewing' });

    addHistory({
      recordId: id || '',
      statusFrom: 'pending',
      statusTo: 'reviewing',
      operatorId: user.id,
      operatorName: user.name,
      remark: '开始估价复核',
      createdAt: timeStr,
    });

    setCurrentStatus('reviewing');
    if (record) {
      setRecord({
        ...record,
        status: 'reviewing',
        history: [
          {
            id: `temp-${Date.now()}`,
            recordId: id || '',
            statusFrom: 'pending',
            statusTo: 'reviewing',
            operatorId: user.id,
            operatorName: user.name,
            remark: '开始估价复核',
            createdAt: timeStr,
          },
          ...record.history,
        ],
      });
    }
    return true;
  }, [id, user, updateRecord, addHistory, record]);

  useEffect(() => {
    const detail = getRecordDetail(id || '');
    if (detail) {
      setRecord(detail);
      setCurrentStatus(detail.status);
      if (detail.estimatedValue) {
        setEstimatedValue(detail.estimatedValue.toString());
      }
      if (detail.rejectReason) {
        setRejectReason(detail.rejectReason);
      }
      setRemark(detail.remark);

      if (user && user.role === 'warehouse' && detail.status === 'pending') {
        transitionToReviewing();
      }
    }
  }, [id, user, transitionToReviewing]);

  const handleApprove = () => {
    if (!user) {
      alert('请先登录');
      return;
    }

    const value = parseFloat(estimatedValue);
    if (!value || value <= 0) {
      alert('请输入有效的估价金额');
      return;
    }

    const now = new Date();
    const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);

    updateRecord(id || '', {
      status: 'approved',
      estimatedValue: value,
      rejectReason: null,
      remark: remark || record?.remark || '',
    });

    addHistory({
      recordId: id || '',
      statusFrom: currentStatus,
      statusTo: 'approved',
      operatorId: user.id,
      operatorName: user.name,
      remark: `评估完成，估价¥${value.toLocaleString()}`,
      createdAt: timeStr,
    });

    if (remark && remark !== record?.remark) {
      addNote({
        recordId: id || '',
        content: remark,
        operatorId: user.id,
        operatorName: user.name,
        createdAt: timeStr,
      });
    }

    alert('审核通过！');
    navigate('/');
  };

  const handleReject = () => {
    if (!user) {
      alert('请先登录');
      return;
    }

    if (!rejectReason) {
      alert('请选择退回原因');
      return;
    }

    const now = new Date();
    const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);

    updateRecord(id || '', {
      status: 'rejected',
      rejectReason,
      remark: remark || record?.remark || '',
    });

    addHistory({
      recordId: id || '',
      statusFrom: currentStatus,
      statusTo: 'rejected',
      operatorId: user.id,
      operatorName: user.name,
      remark: `退回：${rejectReason}`,
      createdAt: timeStr,
    });

    if (remark) {
      addNote({
        recordId: id || '',
        content: remark,
        operatorId: user.id,
        operatorName: user.name,
        createdAt: timeStr,
      });
    }

    alert('已退回！');
    navigate('/');
  };

  const handleResubmit = () => {
    if (!user) {
      alert('请先登录');
      return;
    }

    const now = new Date();
    const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);

    updateRecord(id || '', {
      status: 'pending',
      rejectReason: null,
      remark: remark || record?.remark || '',
    });

    addHistory({
      recordId: id || '',
      statusFrom: 'rejected',
      statusTo: 'pending',
      operatorId: user.id,
      operatorName: user.name,
      remark: '重新提交审核',
      createdAt: timeStr,
    });

    if (remark && remark !== record?.remark) {
      addNote({
        recordId: id || '',
        content: remark,
        operatorId: user.id,
        operatorName: user.name,
        createdAt: timeStr,
      });
    }

    alert('已重新提交！');
    navigate('/');
  };

  if (!record) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">记录不存在</p>
      </div>
    );
  }

  const displayStatus = currentStatus;
  const isWarehouse = user?.role === 'warehouse';
  const isCounter = user?.role === 'counter';
  const canApprove = isWarehouse && (displayStatus === 'pending' || displayStatus === 'reviewing');
  const canReject = isWarehouse && (displayStatus === 'pending' || displayStatus === 'reviewing');
  const canResubmit = isCounter && displayStatus === 'rejected';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回</span>
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">估价复核</h1>
              <span className={`status-badge ${STATUS_COLORS[displayStatus]}`}>
                {STATUS_LABELS[displayStatus]}
              </span>
            </div>
            <button
              onClick={() => navigate(`/detail/${id}`)}
              className="btn-secondary flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              查看详情
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">当品信息</h2>
            
            {record.photos.length > 0 && (
              <div className="mb-4">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
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
                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
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

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">编号</span>
                <span className="text-sm font-medium text-gray-900">{record.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">品类</span>
                <span className="text-sm font-medium text-gray-900">{record.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">品牌</span>
                <span className="text-sm font-medium text-gray-900">{record.brand || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">型号</span>
                <span className="text-sm font-medium text-gray-900">{record.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">成色</span>
                <span className="text-sm font-medium text-gray-900">{record.condition}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">重量</span>
                <span className="text-sm font-medium text-gray-900">{record.weight}g</span>
              </div>
              {record.estimatedValue && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">当前估价</span>
                  <span className="text-sm font-semibold text-gold-600">¥{record.estimatedValue.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">登记人</span>
                <span className="text-sm font-medium text-gray-900">{record.operatorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">登记时间</span>
                <span className="text-sm font-medium text-gray-900">{record.createdAt}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">复核操作</h2>

            {displayStatus === 'rejected' && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700 font-medium">退回原因</p>
                <p className="text-sm text-red-600 mt-1">{record.rejectReason}</p>
              </div>
            )}

            {canApprove && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">估价金额（元） <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  placeholder="请输入估价金额"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  className="input-field"
                />
              </div>
            )}

            {canReject && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">退回原因 <span className="text-red-500">*</span></label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="input-field"
                >
                  <option value="">请选择退回原因</option>
                  {REJECT_REASONS.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">补充备注</label>
              <textarea
                placeholder={`${record.remark ? '原备注: ' + record.remark + '\n\n' : ''}请输入补充备注，备注信息将被后续环节可见`}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={4}
                className="input-field resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                备注信息将在后续环节继续使用，建议详细记录评估意见
              </p>
            </div>

            <div className="flex gap-3">
              {canApprove && (
                <button
                  onClick={handleApprove}
                  className="flex-1 btn-gold flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  审核通过
                </button>
              )}
              {canReject && (
                <button
                  onClick={handleReject}
                  className="flex-1 btn-danger flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  退回修改
                </button>
              )}
              {canResubmit && (
                <button
                  onClick={handleResubmit}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  重新提交
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Review;