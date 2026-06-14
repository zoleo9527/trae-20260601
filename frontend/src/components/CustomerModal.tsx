import React, { useState, useEffect } from 'react';
import { Customer, CustomerDocument, DOC_STATUS_LABELS, DocumentStatus } from '../types';
import { api } from '../api';
import { useApp } from '../context/AppContext';

interface Props {
  customer: Customer | null;
  onClose: () => void;
  onSave?: (data: any) => void;
}

export default function CustomerModal({ customer, onClose, onSave }: Props) {
  const { user, refreshCustomers, refreshDueDiligences } = useApp();
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    business_type: customer?.business_type || '开户',
    urgency: customer?.urgency || 'normal',
  });
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      loadDocuments();
    }
  }, [customer]);

  const loadDocuments = async () => {
    if (!customer) return;
    const res = await api.customers.getDocuments(customer.id);
    if (res.success && res.data) {
      setDocuments(res.data);
    }
  };

  const handleSave = async () => {
    if (!customer || !onSave) return;
    setLoading(true);
    try {
      await api.customers.update(customer.id, {
        ...formData,
        assigned_to: customer.assigned_to,
      });
      refreshCustomers();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!onSave) return;
    setLoading(true);
    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentStatusChange = async (docId: number, status: DocumentStatus, notes: string) => {
    await api.documents.update(docId, { status, notes });
    loadDocuments();
  };

  const handleApprove = async () => {
    if (!customer) return;
    setLoading(true);
    try {
      await api.customers.update(customer.id, {
        ...formData,
        status: 'completed',
        assigned_to: customer.assigned_to,
      });
      refreshCustomers();
      refreshDueDiligences();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!customer) return;
    setLoading(true);
    try {
      await api.customers.update(customer.id, {
        ...formData,
        status: 'rejected',
        assigned_to: customer.assigned_to,
      });
      refreshCustomers();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            {customer ? '客户资料处理' : '新建客户'}
          </h2>
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
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-4">基本信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">姓名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!!customer}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">手机号</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!!customer}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">业务类型</label>
                <input
                  type="text"
                  value={formData.business_type}
                  onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!!customer}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">紧急程度</label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!!customer}
                >
                  <option value="normal">普通</option>
                  <option value="urgent">紧急</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
            </div>
          </div>

          {customer && documents.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-4">客户资料</h3>
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="bg-white rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">{doc.document_type}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                        doc.status === 'uploaded' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {DOC_STATUS_LABELS[doc.status as DocumentStatus]}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        placeholder="添加备注..."
                        defaultValue={doc.notes}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        onBlur={(e) => {
                          if (e.target.value !== doc.notes) {
                            handleDocumentStatusChange(doc.id, doc.status as DocumentStatus, e.target.value);
                          }
                        }}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDocumentStatusChange(doc.id, 'uploaded', doc.notes)}
                        className={`px-3 py-1 rounded text-sm ${
                          doc.status === 'uploaded' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        已上传
                      </button>
                      <button
                        onClick={() => handleDocumentStatusChange(doc.id, 'approved', doc.notes)}
                        className={`px-3 py-1 rounded text-sm ${
                          doc.status === 'approved' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        审核通过
                      </button>
                      <button
                        onClick={() => handleDocumentStatusChange(doc.id, 'rejected', doc.notes)}
                        className={`px-3 py-1 rounded text-sm ${
                          doc.status === 'rejected' 
                            ? 'bg-red-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        驳回
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {customer && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-medium text-blue-800 mb-1">提示</h4>
                  <p className="text-sm text-blue-700">
                    审核通过后，系统将自动创建尽调补件任务，备注信息将自动继承到尽调补件中。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
          {customer ? (
            <>
              <button
                onClick={handleReject}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                驳回
              </button>
              <button
                onClick={handleApprove}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                审核通过
              </button>
            </>
          ) : (
            <button
              onClick={handleCreate}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              创建
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
