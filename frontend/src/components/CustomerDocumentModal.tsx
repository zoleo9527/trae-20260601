import React, { useState, useEffect } from 'react';
import { DueDiligence, DueDiligenceAttachment, DUE_DILIGENCE_STATUS_LABELS } from '../types';
import { api } from '../api';
import { useApp } from '../context/AppContext';

interface Props {
  dueDiligence: DueDiligence | null;
  onClose: () => void;
}

interface HistoryData {
  customer: any;
  documents: any[];
  dueDiligence: DueDiligence;
  attachments: DueDiligenceAttachment[];
}

export default function CustomerDocumentModal({ dueDiligence, onClose }: Props) {
  const { user, refreshDueDiligences } = useApp();
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingNotes, setProcessingNotes] = useState(dueDiligence?.processing_notes || '');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (dueDiligence) {
      loadHistory();
    }
  }, [dueDiligence]);

  const loadHistory = async () => {
    if (!dueDiligence) return;
    const res = await api.dueDiligence.getHistory(dueDiligence.id);
    if (res.success && res.data) {
      setHistory(res.data);
    }
  };

  const handleAddAttachment = async () => {
    if (!dueDiligence) return;
    setLoading(true);
    try {
      await api.dueDiligence.addAttachment(dueDiligence.id, {
        file_name: `附件_${Date.now()}.pdf`,
        file_size: 1024 * 100,
        file_type: 'application/pdf',
        notes: '新增附件',
      });
      loadHistory();
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!dueDiligence) return;
    setLoading(true);
    try {
      await api.dueDiligence.update(dueDiligence.id, {
        processing_notes: processingNotes,
        status,
        assigned_to: dueDiligence.assigned_to,
      });
      refreshDueDiligences();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">尽调补件处理</h2>
            <p className="text-sm text-gray-500 mt-1">
              {dueDiligence?.customer_name || `客户 #${dueDiligence?.customer_id}`} · 尽调补件 #{dueDiligence?.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h4 className="font-medium text-blue-800 mb-2">继承的备注（来自客户资料处理）</h4>
                <div className="bg-white rounded p-3 text-sm text-gray-700 whitespace-pre-wrap">
                  {dueDiligence?.inherited_notes || '无继承备注'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-4">尽调处理备注</h3>
            <textarea
              value={processingNotes}
              onChange={(e) => setProcessingNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={6}
              placeholder="记录尽调补件处理过程中的备注..."
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">附件</h3>
              <button
                onClick={handleAddAttachment}
                disabled={loading}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                添加附件
              </button>
            </div>
            <div className="space-y-2">
              {history?.attachments && history.attachments.length > 0 ? (
                history.attachments.map((attachment) => (
                  <div key={attachment.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{attachment.file_name}</p>
                        <p className="text-xs text-gray-500">
                          {(attachment.file_size / 1024).toFixed(1)} KB · {attachment.file_type}
                        </p>
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm">
                      下载
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>暂无附件</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full"
            >
              <h3 className="font-semibold text-gray-800">历史记录</h3>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${showHistory ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showHistory && history && (
              <div className="mt-4 space-y-4">
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">客户资料</h4>
                  <p className="text-sm text-gray-600">
                    客户：{history.customer?.name} · {history.customer?.business_type}
                  </p>
                </div>

                {history.documents && history.documents.length > 0 && (
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">资料审核记录</h4>
                    <div className="space-y-2">
                      {history.documents.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{doc.document_type}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                            doc.status === 'uploaded' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">尽调补件记录</h4>
                  <p className="text-sm text-gray-600">
                    状态：{DUE_DILIGENCE_STATUS_LABELS[history.dueDiligence?.status as keyof typeof DUE_DILIGENCE_STATUS_LABELS]}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    创建时间：{new Date(history.dueDiligence?.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>

                {history.dueDiligence?.inherited_notes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">继承备注（来自客户资料）</h4>
                    <p className="text-sm text-yellow-700 whitespace-pre-wrap">
                      {history.dueDiligence.inherited_notes}
                    </p>
                  </div>
                )}

                {history.dueDiligence?.processing_notes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">处理备注</h4>
                    <p className="text-sm text-blue-700 whitespace-pre-wrap">
                      {history.dueDiligence.processing_notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
          <button
            onClick={() => handleStatusChange('rejected')}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            驳回
          </button>
          <button
            onClick={() => handleStatusChange('submitted')}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            提交审核
          </button>
          <button
            onClick={() => handleStatusChange('processing')}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            保存并继续
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
