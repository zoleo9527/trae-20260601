import { useState } from 'react';
import { ChevronDown, ChevronUp, X, Phone, Edit, Gift, FileCheck } from 'lucide-react';
import type { Complaint } from '../types';
import { complaintTypeMap, complaintStatusMap, compensateTypeMap } from '../data/mockData';

interface ComplaintTableProps {
  complaints: Complaint[];
  title: string;
  statusFilter: string;
  onAddCompensation?: (complaint: Complaint) => void;
  onVerifyCompensation?: (compensationId: string, verifiedBy: string) => void;
  onAddFollowup?: (complaint: Complaint) => void;
}

export function ComplaintTable({ 
  complaints, 
  title, 
  statusFilter, 
  onAddCompensation,
  onVerifyCompensation,
  onAddFollowup
}: ComplaintTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [verifyBy, setVerifyBy] = useState('');

  const filteredComplaints = statusFilter === 'all' 
    ? complaints 
    : complaints.filter(c => c.status === statusFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-red-500';
      case 'compensated': return 'bg-green-500';
      case 'followup': return 'bg-yellow-500';
      case 'resolved': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getCompensateStatus = (compensate?: Complaint['compensate']) => {
    if (!compensate) return '未处理';
    if (compensate.isAbnormal) return '异常';
    if (compensate.verifiedBy) return '已核销';
    return '待核销';
  };

  const getCompensateStatusColor = (compensate?: Complaint['compensate']) => {
    if (!compensate) return 'text-gray-400';
    if (compensate.isAbnormal) return 'text-orange-400';
    if (compensate.verifiedBy) return 'text-green-400';
    return 'text-yellow-400';
  };

  const handleVerify = (compensationId: string) => {
    if (verifyBy && onVerifyCompensation) {
      onVerifyCompensation(compensationId, verifyBy);
      setVerifyBy('');
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-gray-400 mt-1">共 {filteredComplaints.length} 条记录</p>
      </div>

      {filteredComplaints.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-500">
          暂无记录
        </div>
      ) : (
        <div className="divide-y divide-slate-700">
          {filteredComplaints.map((complaint) => (
            <div key={complaint.id} className="hover:bg-slate-700/30 transition-colors">
              <div 
                className="px-6 py-4 cursor-pointer" 
                onClick={() => setExpandedId(expandedId === complaint.id ? null : complaint.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(complaint.status)} text-white`}>
                      {complaintStatusMap[complaint.status]}
                    </span>
                    <span className="text-sm text-gray-400">#{complaint.id}</span>
                    <span className="text-white font-medium">桌位 {complaint.tableNumber}</span>
                    <span className="text-gray-300">{complaint.customerName}</span>
                    <span className="px-2 py-0.5 text-xs rounded bg-purple-500/20 text-purple-300">
                      {complaintTypeMap[complaint.complaintType]}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={getCompensateStatusColor(complaint.compensate)}>
                      {getCompensateStatus(complaint.compensate)}
                    </span>
                    {expandedId === complaint.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400"/>
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400"/>
                    )}
                  </div>
                </div>
              </div>

              {expandedId === complaint.id && (
                <div className="px-6 pb-4 bg-slate-800/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                    <div>
                      <p className="text-sm text-gray-400">投诉原因</p>
                      <p className="text-white mt-1">{complaint.complaintReason}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">联系方式</p>
                      <p className="text-white mt-1 flex items-center space-x-1">
                        <Phone className="h-4 w-4"/>
                        {complaint.customerPhone}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">区域/负责人</p>
                      <p className="text-white mt-1">{complaint.tableArea} / {complaint.managerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">创建时间</p>
                      <p className="text-white mt-1">{complaint.createdAt}</p>
                    </div>
                  </div>

                  {complaint.compensate && (
                    <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-white">补偿信息</h3>
                        {complaint.compensate.isAbnormal && (
                          <span className="px-2 py-1 text-xs rounded bg-orange-500/20 text-orange-400">
                            异常: {complaint.compensate.abnormalReason}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <p className="text-xs text-gray-400">类型</p>
                          <p className="text-white">{compensateTypeMap[complaint.compensate.type]}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">数量/金额</p>
                          <p className="text-white">{complaint.compensate.amount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">描述</p>
                          <p className="text-white">{complaint.compensate.description}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">授权人/时间</p>
                          <p className="text-white">{complaint.compensate.authorizedBy} / {complaint.compensate.authorizedAt}</p>
                        </div>
                        {complaint.compensate.verifiedBy && (
                          <>
                            <div className="col-span-2 md:col-span-4">
                              <p className="text-xs text-gray-400">核销人/时间</p>
                              <p className="text-green-400">{complaint.compensate.verifiedBy} / {complaint.compensate.verifiedAt}</p>
                            </div>
                          </>
                        )}
                      </div>

                      {!complaint.compensate.verifiedBy && !complaint.compensate.isAbnormal && (
                        <div className="mt-4 flex items-center space-x-3">
                          <input
                            type="text"
                            placeholder="输入核销人姓名"
                            value={verifyBy}
                            onChange={(e) => setVerifyBy(e.target.value)}
                            className="flex-1 px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                          />
                          <button
                            onClick={() => handleVerify(complaint.compensate!.id)}
                            disabled={!verifyBy}
                            className="flex items-center space-x-1 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-sm text-white transition-colors"
                          >
                            <FileCheck className="h-4 w-4"/>
                            <span>确认核销</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {complaint.followup && (
                    <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                      <h3 className="text-sm font-medium text-white mb-3">回访记录</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <p className="text-xs text-gray-400">回访人</p>
                          <p className="text-white">{complaint.followup.followupBy}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">回访结果</p>
                          <p className={`${complaint.followup.followupResult === 'resolved' ? 'text-green-400' : 'text-yellow-400'}`}>
                            {complaint.followup.followupResult === 'resolved' ? '已解决' : '待跟进'}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-400">回访内容</p>
                          <p className="text-white">{complaint.followup.followupNote}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">回访时间</p>
                          <p className="text-white">{complaint.followup.followupAt}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end space-x-3 mt-4 pt-4 border-t border-slate-700">
                    {complaint.status === 'pending' && onAddCompensation && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onAddCompensation(complaint); }}
                        className="flex items-center space-x-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm text-white transition-colors"
                      >
                        <Gift className="h-4 w-4"/>
                        <span>添加补偿</span>
                      </button>
                    )}
                    {complaint.status === 'compensated' && !complaint.compensate?.isAbnormal && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onAddFollowup?.(complaint); }}
                        className="flex items-center space-x-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-sm text-white transition-colors"
                      >
                        <Phone className="h-4 w-4"/>
                        <span>标记待回访</span>
                      </button>
                    )}
                    {complaint.status === 'followup' && onAddFollowup && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onAddFollowup(complaint); }}
                        className="flex items-center space-x-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white transition-colors"
                      >
                        <Phone className="h-4 w-4"/>
                        <span>记录回访</span>
                      </button>
                    )}
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center space-x-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm text-white transition-colors"
                    >
                      <Edit className="h-4 w-4"/>
                      <span>编辑</span>
                    </button>
                    {complaint.status !== 'resolved' && (
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center space-x-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm text-white transition-colors"
                      >
                        <X className="h-4 w-4"/>
                        <span>关闭</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}