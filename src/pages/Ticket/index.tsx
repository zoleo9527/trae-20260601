import React, { useState } from 'react';
import {
  Ticket,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  RefreshCw,
  Upload,
  AlertCircle,
  Check,
  X,
  FileText,
  DollarSign,
} from 'lucide-react';
import { useTicketStore } from '@/store/ticketStore';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/common/Modal';
import { formatDateTime } from '@/utils/date';
import type { TicketStatus } from '@/types/common';

const TicketCenter: React.FC = () => {
  const { tickets, batchCheckTickets, checkTicket, verifyTicket, applyRefund, approveRefund, getTicketLogs } = useTicketStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [checkModalOpen, setCheckModalOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);

  const [singleCode, setSingleCode] = useState('');
  const [batchCodes, setBatchCodes] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [batchResult, setBatchResult] = useState<any>(null);
  const [verifyResult, setVerifyResult] = useState<any>(null);

  const filteredTickets = tickets
    .filter((t) => {
      const matchesSearch = t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.scheduleName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const statusOptions: { value: TicketStatus | 'all'; label: string }[] = [
    { value: 'all', label: '全部状态' },
    { value: 'unused', label: '未使用' },
    { value: 'checked', label: '已核销' },
    { value: 'refunding', label: '退票中' },
    { value: 'refunded', label: '已退票' },
  ];

  const handleVerify = () => {
    if (!singleCode.trim()) {
      setError('请输入票券编号');
      return;
    }
    const result = verifyTicket(singleCode.trim());
    setVerifyResult(result);
    setError(null);
  };

  const handleSingleCheck = () => {
    if (!singleCode.trim()) {
      setError('请输入票券编号');
      return;
    }
    const result = checkTicket(singleCode.trim());
    if (result.success) {
      setSuccess('核销成功');
      setCheckModalOpen(false);
      setSingleCode('');
      setVerifyResult(null);
      setTimeout(() => setSuccess(null), 2000);
    } else {
      setError(result.reason || '核销失败');
    }
  };

  const handleBatchCheck = () => {
    const codes = batchCodes.split('\n').filter((c) => c.trim());
    if (codes.length === 0) {
      setError('请输入票券编号');
      return;
    }
    const result = batchCheckTickets(codes);
    setBatchResult(result);
  };

  const openRefundModal = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setRefundModalOpen(true);
  };

  const handleApplyRefund = () => {
    if (!refundReason.trim()) {
      setError('请填写退票原因');
      return;
    }
    if (selectedTicketId) {
      const success = applyRefund(selectedTicketId, refundReason);
      if (success) {
        setSuccess('退票申请已提交');
        setRefundModalOpen(false);
        setRefundReason('');
        setSelectedTicketId(null);
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError('退票申请失败');
      }
    }
  };

  const openApproveModal = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setApproveModalOpen(true);
  };

  const handleApproveRefund = () => {
    if (selectedTicketId) {
      const success = approveRefund(selectedTicketId);
      if (success) {
        setSuccess('退票已完成');
        setApproveModalOpen(false);
        setSelectedTicketId(null);
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError('退票审核失败');
      }
    }
  };

  const stats = {
    total: tickets.length,
    unused: tickets.filter((t) => t.status === 'unused').length,
    checked: tickets.filter((t) => t.status === 'checked').length,
    refunded: tickets.filter((t) => t.status === 'refunded').length,
  };

  return (
    <div className="space-y-6">
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-pulse">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">票务核销中心</h1>
        <p className="text-gray-500 mt-1">团体票核销、退票处理、票务流水查询</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">票券总数</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Ticket className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待使用</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.unused}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已核销</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.checked}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已退票</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.refunded}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setCheckModalOpen(true);
                setError(null);
                setVerifyResult(null);
                setSingleCode('');
              }}
              className="btn-primary"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              单张核销
            </button>
            <button
              onClick={() => {
                setBatchModalOpen(true);
                setError(null);
                setBatchResult(null);
                setBatchCodes('');
              }}
              className="btn-secondary"
            >
              <Upload className="w-4 h-4 mr-2" />
              批量核销
            </button>
          </div>
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索票券编号或场次..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'all')}
              className="input w-36"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="card p-12 text-center">
          <Ticket className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无票券记录</h3>
          <p className="text-gray-500">请先在排片详情页生成票券</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">票券编号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">场次</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">票价</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTickets.slice(0, 20).map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-medium text-gray-900">{ticket.code}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{ticket.scheduleName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {ticket.type === 'group' ? '团体票' : '普通票'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 font-medium">¥{ticket.price}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge type="ticket" status={ticket.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(ticket.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {ticket.status === 'unused' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const result = checkTicket(ticket.code);
                              if (result.success) {
                                setSuccess('核销成功');
                                setTimeout(() => setSuccess(null), 2000);
                              }
                            }}
                            className="text-green-600 hover:text-green-800"
                          >
                            核销
                          </button>
                          <button
                            onClick={() => openRefundModal(ticket.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            退票
                          </button>
                        </div>
                      )}
                      {ticket.status === 'refunding' && (
                        <button
                          onClick={() => openApproveModal(ticket.id)}
                          className="text-amber-600 hover:text-amber-800"
                        >
                          审核退票
                        </button>
                      )}
                      {(ticket.status === 'checked' || ticket.status === 'refunded') && (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredTickets.length > 20 && (
            <div className="px-6 py-4 border-t text-center text-sm text-gray-500">
              显示前 20 条，共 {filteredTickets.length} 条记录
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={checkModalOpen}
        onClose={() => {
          setCheckModalOpen(false);
          setError(null);
          setVerifyResult(null);
        }}
        title="单张票核销"
        footer={
          <>
            <button
              onClick={() => {
                setCheckModalOpen(false);
                setError(null);
                setVerifyResult(null);
              }}
              className="btn-secondary"
            >
              取消
            </button>
            {verifyResult?.valid ? (
              <button onClick={handleSingleCheck} className="btn-success">
                <Check className="w-4 h-4 mr-2" />
                确认核销
              </button>
            ) : (
              <button onClick={handleVerify} className="btn-primary">
                验票
              </button>
            )}
          </>
        }
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">票券编号</label>
            <input
              type="text"
              value={singleCode}
              onChange={(e) => {
                setSingleCode(e.target.value);
                setVerifyResult(null);
              }}
              placeholder="请输入票券编号"
              className="input font-mono"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !verifyResult?.valid) {
                  handleVerify();
                }
              }}
            />
          </div>
          {verifyResult && (
            <div className={`p-4 rounded-xl ${
              verifyResult.valid
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {verifyResult.valid ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-medium ${
                  verifyResult.valid ? 'text-green-800' : 'text-red-800'
                }`}>
                  {verifyResult.valid ? '票券有效' : verifyResult.reason}
                </span>
              </div>
              {verifyResult.ticket && (
                <div className="mt-3 space-y-1 text-sm">
                  <p className="text-gray-600">
                    <span className="text-gray-500">场次：</span>
                    {verifyResult.ticket.scheduleName}
                  </p>
                  <p className="text-gray-600">
                    <span className="text-gray-500">类型：</span>
                    {verifyResult.ticket.type === 'group' ? '团体票' : '普通票'}
                  </p>
                  <p className="text-gray-600">
                    <span className="text-gray-500">票价：</span>
                    ¥{verifyResult.ticket.price}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={batchModalOpen}
        onClose={() => {
          setBatchModalOpen(false);
          setError(null);
          setBatchResult(null);
        }}
        title="批量核销"
        size="lg"
        footer={
          <>
            <button
              onClick={() => {
                setBatchModalOpen(false);
                setError(null);
                setBatchResult(null);
              }}
              className="btn-secondary"
            >
              关闭
            </button>
            {!batchResult && (
              <button onClick={handleBatchCheck} className="btn-primary">
                <Check className="w-4 h-4 mr-2" />
                批量核销
              </button>
            )}
          </>
        }
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        {!batchResult ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                票券编号（每行一个）
              </label>
              <textarea
                value={batchCodes}
                onChange={(e) => setBatchCodes(e.target.value)}
                placeholder="请输入票券编号，每行一个&#10;例如：&#10;G1234560001&#10;G1234560002&#10;G1234560003"
                rows={8}
                className="input resize-none font-mono"
              />
            </div>
            <p className="text-sm text-gray-500">
              提示：支持批量输入多个票券编号，系统将自动进行批量核销
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-gray-900">{batchResult.total}</p>
                <p className="text-sm text-gray-500">总计</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-green-600">{batchResult.success}</p>
                <p className="text-sm text-green-600">成功</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-red-600">{batchResult.failed}</p>
                <p className="text-sm text-red-600">失败</p>
              </div>
            </div>
            {batchResult.failedItems.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">失败列表：</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {batchResult.failedItems.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded text-sm">
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="font-mono text-red-800">{item.code}</span>
                      <span className="text-red-600">- {item.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={refundModalOpen}
        onClose={() => {
          setRefundModalOpen(false);
          setError(null);
          setRefundReason('');
          setSelectedTicketId(null);
        }}
        title="申请退票"
        footer={
          <>
            <button
              onClick={() => {
                setRefundModalOpen(false);
                setError(null);
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button onClick={handleApplyRefund} className="btn-danger">
              提交申请
            </button>
          </>
        }
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">退票原因</label>
          <textarea
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            placeholder="请填写退票原因..."
            rows={4}
            className="input resize-none"
          />
        </div>
      </Modal>

      <Modal
        isOpen={approveModalOpen}
        onClose={() => {
          setApproveModalOpen(false);
          setError(null);
          setSelectedTicketId(null);
        }}
        title="审核退票"
        footer={
          <>
            <button
              onClick={() => {
                setApproveModalOpen(false);
                setError(null);
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button onClick={handleApproveRefund} className="btn-primary">
              确认退票
            </button>
          </>
        }
      >
        <p className="text-gray-600">确定要批准此退票申请吗？</p>
      </Modal>
    </div>
  );
};

export default TicketCenter;
