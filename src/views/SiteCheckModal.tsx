import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useStore';
import { SiteCheckItem, SiteConditionRecord } from '../types';
import { hasOrderChanges as checkHasOrderChanges } from '../utils/mockData';
import { X, Camera, CheckCircle, XCircle, AlertTriangle, Save } from 'lucide-react';

interface SiteCheckModalProps {
  orderId: string;
  onClose: () => void;
}

const defaultCheckItems: { name: string }[] = [
  { name: '进水管道是否到位' },
  { name: '排水管道是否通畅' },
  { name: '电路插座是否符合要求' },
  { name: '安装空间是否充足' },
  { name: '墙体是否承重' },
  { name: '地面是否平整' },
  { name: '产品配件是否齐全' },
  { name: '现场是否有其他障碍物' },
];

const SiteCheckModal: React.FC<SiteCheckModalProps> = ({ orderId, onClose }) => {
  const { addSiteCheck, getOrderById, currentUser } = useAppStore();
  const order = getOrderById(orderId);

  const [checkItems, setCheckItems] = useState<SiteCheckItem[]>([]);
  const [notes, setNotes] = useState('');
  const [overallResult, setOverallResult] = useState<'passed' | 'failed' | 'pending'>('pending');

  useEffect(() => {
    const items: SiteCheckItem[] = defaultCheckItems.map((item, index) => ({
      id: `item-${index}`,
      name: item.name,
      passed: null,
      remark: '',
    }));
    setCheckItems(items);
  }, []);

  useEffect(() => {
    const passedCount = checkItems.filter((i) => i.passed === true).length;
    const failedCount = checkItems.filter((i) => i.passed === false).length;

    if (failedCount > 0) {
      setOverallResult('failed');
    } else if (passedCount === checkItems.length && checkItems.length > 0) {
      setOverallResult('passed');
    } else {
      setOverallResult('pending');
    }
  }, [checkItems]);

  const handleItemToggle = (id: string, passed: boolean | null) => {
    setCheckItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, passed } : item))
    );
  };

  const handleItemRemark = (id: string, remark: string) => {
    setCheckItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, remark } : item))
    );
  };

  const handleSubmit = () => {
    if (!currentUser) return;

    const siteCheck: Omit<SiteConditionRecord, 'id' | 'orderId' | 'checkedAt' | 'orderVersion' | 'appointmentVersion' | 'hasOrderChanges'> = {
      checkedBy: currentUser.id,
      overallResult,
      items: checkItems,
      photos: [],
      notes,
    };

    addSiteCheck(orderId, siteCheck);
    onClose();
  };

  const hasOrderChanges = order ? checkHasOrderChanges(order) : false;

  const passedCount = checkItems.filter((i) => i.passed === true).length;
  const failedCount = checkItems.filter((i) => i.passed === false).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ width: '600px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div className="modal-title">现场条件确认</div>
            <div className="text-xs text-muted mt-1">
              {order?.orderNo} · {order?.customerName}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {hasOrderChanges && (
          <div className="mx-4 mt-4 alert alert-warning">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} />
              <span className="font-medium">预约信息已变更</span>
            </div>
            <div className="text-sm mt-1">
              上次现场确认后，订单信息有更新，请仔细核对后重新确认。
            </div>
          </div>
        )}

        <div className="modal-body">
          <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-success" />
              <span className="text-sm">
                通过 <span className="font-semibold">{passedCount}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle size={16} className="text-danger" />
              <span className="text-sm">
                不通过 <span className="font-semibold">{failedCount}</span>
              </span>
            </div>
            <div className="ml-auto">
              {overallResult === 'passed' && (
                <span className="badge badge-success">全部通过</span>
              )}
              {overallResult === 'failed' && (
                <span className="badge badge-danger">有不通过项</span>
              )}
              {overallResult === 'pending' && (
                <span className="badge badge-gray">待确认</span>
              )}
            </div>
          </div>

          <div className="mb-4">
            <div className="font-medium text-sm mb-2">检查项目</div>
            <div className="space-y-2">
              {checkItems.map((item) => (
                <div
                  key={item.id}
                  className={`site-check-item ${item.passed === true ? 'passed' : item.passed === false ? 'failed' : ''}`}
                >
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                        item.passed === true
                          ? 'bg-success text-white'
                          : 'bg-white border border-gray-300 hover:border-success'
                      }`}
                      onClick={() => handleItemToggle(item.id, item.passed === true ? null : true)}
                      title="通过"
                    >
                      <CheckCircle size={14} />
                    </button>
                    <button
                      className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                        item.passed === false
                          ? 'bg-danger text-white'
                          : 'bg-white border border-gray-300 hover:border-danger'
                      }`}
                      onClick={() => handleItemToggle(item.id, item.passed === false ? null : false)}
                      title="不通过"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                  <div className="site-check-item-content">
                    <div className="site-check-item-name">{item.name}</div>
                    <input
                      className="w-full mt-1 text-xs p-1.5 border border-gray-200 rounded"
                      placeholder="添加备注说明..."
                      value={item.remark}
                      onChange={(e) => handleItemRemark(item.id, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">现场照片</label>
            <div className="flex gap-2 flex-wrap">
              <button className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors">
                <Camera size={20} />
                <span className="text-xs mt-1">添加照片</span>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">备注说明</label>
            <textarea
              className="textarea"
              placeholder="请输入现场情况说明..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={overallResult === 'pending'}
          >
            <Save size={16} />
            提交确认
          </button>
        </div>
      </div>
    </div>
  );
};

export default SiteCheckModal;
