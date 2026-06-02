
import { useEffect, useState } from 'react';
import { Search, MessageSquare, User, Phone, FileText } from 'lucide-react';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import type { Complaint } from '../../shared/types';

export function Complaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [handleNotes, setHandleNotes] = useState('');

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const params = statusFilter ? { status: statusFilter } : undefined;
        const data = await api.complaints.list(params);
        setComplaints(data);
      } catch (error) {
        console.error('Failed to fetch complaints:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [statusFilter]);

  const filteredComplaints = complaints.filter(
    (c) =>
      c.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProcess = async (status: string) => {
    if (!selectedComplaint) return;
    try {
      await api.complaints.update(selectedComplaint.id, {
        status: status as Complaint['status'],
        handler: '李客服',
        handleNotes,
      });
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === selectedComplaint.id
            ? { ...c, status: status as Complaint['status'], handler: '李客服', handleNotes, handledAt: new Date().toISOString() }
            : c
        )
      );
      setSelectedComplaint(null);
      setHandleNotes('');
    } catch (error) {
      console.error('Failed to update complaint:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 筛选栏 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索用户或投诉内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">状态：</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="resolved">已解决</option>
              <option value="closed">已关闭</option>
            </select>
          </div>
        </div>
      </div>

      {/* 投诉列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredComplaints.map((complaint) => (
          <div
            key={complaint.id}
            className="bg-white rounded-xl shadow-sm p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{complaint.userName}</span>
                    <StatusBadge type="complaint" status={complaint.status} />
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Phone className="w-3 h-3 mr-1" />
                    {complaint.userPhone}
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(complaint.createdAt).toLocaleDateString('zh-CN')}
              </span>
            </div>

            <div className="mb-4">
              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded mb-2">
                {complaint.type === 'device' && '设备故障'}
                {complaint.type === 'interrupt' && '充电中断'}
                {complaint.type === 'charge' && '费用异议'}
                {complaint.type === 'other' && '其他问题'}
              </span>
              <p className="text-gray-600 text-sm">{complaint.description}</p>
            </div>

            {complaint.handleNotes && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">处理记录：</p>
                <p className="text-sm text-gray-700">{complaint.handleNotes}</p>
                <p className="text-xs text-gray-500 mt-1">处理人：{complaint.handler}</p>
              </div>
            )}

            {complaint.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedComplaint(complaint);
                    setHandleNotes('');
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  处理投诉
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 处理弹窗 */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">处理投诉</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">投诉内容：</p>
              <p className="text-gray-900">{selectedComplaint.description}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">处理备注</label>
              <textarea
                value={handleNotes}
                onChange={(e) => setHandleNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={4}
                placeholder="请输入处理备注"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => handleProcess('processing')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                标记处理中
              </button>
              <button
                onClick={() => handleProcess('resolved')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                标记已解决
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
