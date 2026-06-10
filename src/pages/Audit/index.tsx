import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileCheck,
  ArrowLeft,
  Check,
  X,
  Clock,
  User,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Car,
  AlertTriangle,
  MessageSquare,
  Send,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { AuditProcessSteps } from '../../components/ProcessSteps';
import { useRecent } from '../../hooks/useRecent';
import { formatDateTime, formatDate, timeAgo } from '../../utils/date';
import { cn } from '../../lib/utils';
import type { AuditNode } from '../../data/types';

export default function AuditList() {
  const navigate = useNavigate();
  const { addRecentVisit } = useRecent();
  const { audits, rentals } = useStore();

  const getRental = (auditId: string) => {
    return rentals.find(r => r.auditId === auditId);
  };

  const handleRowClick = (auditId: string) => {
    const rental = getRental(auditId);
    if (rental) {
      addRecentVisit({
        type: 'audit',
        title: rental.plateNumber,
        subtitle: `${rental.ownerName} · ${rental.parkingLot}`,
        path: `/audit/${auditId}`,
      });
    }
    navigate(`/audit/${auditId}`);
  };

  const getStuckNode = (audit: typeof audits[0]) => {
    return audit.nodes.find(n => n.status === 'stuck');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">月租车审核</h1>
          <p className="text-sm text-slate-500">跟踪审核流程，处理卡住节点</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  车牌号
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  车主信息
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  停车场
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  费用
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  当前节点
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  处理人
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  申请时间
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {audits.map((audit) => {
                const rental = getRental(audit.id);
                const stuckNode = getStuckNode(audit);
                if (!rental) return null;

                const currentNode = audit.nodes[audit.currentNode];

                return (
                  <tr
                    key={audit.id}
                    onClick={() => handleRowClick(audit.id)}
                    className={cn(
                      'hover:bg-orange-50/30 cursor-pointer transition-colors',
                      stuckNode && 'bg-red-50/30 hover:bg-red-50/50'
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          <Car className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-mono font-medium text-slate-800">
                            {rental.plateNumber}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {rental.plateType === 'blue' && '蓝牌'}
                            {rental.plateType === 'green' && '绿牌'}
                            {rental.plateType === 'yellow' && '黄牌'}
                            {rental.plateType === 'none' && '无牌'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-800">{rental.ownerName}</div>
                      <div className="text-xs text-slate-400">{rental.ownerPhone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-700">{rental.parkingLot}</div>
                      <div className="text-[10px] text-slate-400">
                        {formatDate(rental.startDate)} → {formatDate(rental.endDate)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono font-medium text-slate-800">
                        ¥{rental.amount}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={rental.status} />
                    </td>
                    <td className="px-4 py-3">
                      {stuckNode ? (
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                          <span className="text-sm text-red-600 font-medium">
                            {stuckNode.name} 卡住
                          </span>
                        </div>
                      ) : currentNode ? (
                        <div>
                          <div className="text-sm text-slate-700">{currentNode.name}</div>
                          <div className="text-[10px] text-slate-400">
                            第 {audit.currentNode + 1}/{audit.nodes.length} 步
                          </div>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {currentNode?.handlerName || (
                        <span className="text-sm text-slate-400">未分配</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-600 font-mono">
                        {timeAgo(rental.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                        查看详情
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AuditDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addRecentVisit } = useRecent();
  const { audits, rentals, currentUser, actions } = useStore();
  const [remark, setRemark] = useState('');
  const [selectedNode, setSelectedNode] = useState<AuditNode | null>(null);

  const audit = audits.find(a => a.id === id);
  const rental = rentals.find(r => r.auditId === id);

  if (!audit || !rental) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500">未找到该审核记录</p>
          <button
            onClick={() => navigate('/audit')}
            className="mt-4 text-orange-600 hover:text-orange-700"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  const currentNode = audit.nodes[audit.currentNode];
  const stuckNode = audit.nodes.find(n => n.status === 'stuck');

  const handlePass = () => {
    actions.addActivity({
      type: 'audit_pass',
      title: '审核通过',
      description: `${rental.plateNumber} ${currentNode.name}通过`,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      relatedId: audit.id,
      relatedType: 'audit',
    });
    actions.advanceAuditNode(audit.id);
  };

  const handleReject = () => {
    actions.addActivity({
      type: 'audit_reject',
      title: '审核驳回',
      description: `${rental.plateNumber} ${currentNode.name}驳回: ${remark}`,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      relatedId: audit.id,
      relatedType: 'audit',
    });
    actions.updateAuditNode(audit.id, audit.currentNode, 'failed', remark);
  };

  const handleNodeClick = (node: AuditNode, index: number) => {
    setSelectedNode(node);
    addRecentVisit({
      type: 'audit',
      title: rental.plateNumber,
      subtitle: `${node.name} - ${rental.parkingLot}`,
      path: `/audit/${audit.id}`,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/audit')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-800">{rental.plateNumber}</h1>
            <StatusBadge status={rental.status} />
            {stuckNode && <PriorityBadge priority="high" />}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            审核编号：{audit.id} · 申请于 {formatDateTime(rental.createdAt)}
          </p>
        </div>
      </div>

      {stuckNode && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-red-800">审核流程已卡住</div>
            <div className="text-sm text-red-600 mt-1">
              <span className="font-medium">{stuckNode.name}：</span>
              {stuckNode.stuckReason || '原因待查'}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-orange-500" />
          审核流程
        </h2>
        <AuditProcessSteps
          nodes={audit.nodes}
          currentNode={audit.currentNode}
          onNodeClick={handleNodeClick}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">车辆与车主信息</h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-slate-500">车牌号</div>
                <div className="font-mono font-medium text-slate-800">{rental.plateNumber}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-xs text-slate-500">车辆类型</div>
                <div className="font-medium text-slate-800">
                  {rental.vehicleType === 'sedan' && '轿车'}
                  {rental.vehicleType === 'suv' && 'SUV'}
                  {rental.vehicleType === 'truck' && '货车'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-xs text-slate-500">车主姓名</div>
                <div className="font-medium text-slate-800">{rental.ownerName}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-xs text-slate-500">联系电话</div>
                <div className="font-mono text-slate-800">{rental.ownerPhone}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <div className="text-xs text-slate-500">停车场</div>
                <div className="font-medium text-slate-800">{rental.parkingLot}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-xs text-slate-500">租期</div>
                <div className="font-mono text-slate-800 text-sm">
                  {formatDate(rental.startDate)} → {formatDate(rental.endDate)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">当前处理</h2>
            </div>
            <div className="p-4">
              <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">当前节点</div>
                <div className="font-medium text-slate-800">{currentNode?.name}</div>
                <div className="text-xs text-slate-400 mt-1">
                  处理人：{currentNode?.handlerName || '未分配'}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs text-slate-500 mb-1.5 block">
                  处理备注
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="输入审核意见或备注..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handlePass}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Check className="w-4 h-4" />
                  通过
                </button>
                <button
                  onClick={handleReject}
                  disabled={!remark}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <X className="w-4 h-4" />
                  驳回
                </button>
              </div>
            </div>
          </div>

          {selectedNode && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-slide-in">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">节点详情</h3>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div>
                  <span className="text-slate-500">节点名称：</span>
                  <span className="text-slate-800">{selectedNode.name}</span>
                </div>
                <div>
                  <span className="text-slate-500">状态：</span>
                  <StatusBadge status={selectedNode.status} />
                </div>
                <div>
                  <span className="text-slate-500">处理人：</span>
                  <span className="text-slate-800">{selectedNode.handlerName || '系统'}</span>
                </div>
                <div>
                  <span className="text-slate-500">开始时间：</span>
                  <span className="font-mono text-slate-700">
                    {formatDateTime(selectedNode.startTime)}
                  </span>
                </div>
                {selectedNode.endTime && (
                  <div>
                    <span className="text-slate-500">完成时间：</span>
                    <span className="font-mono text-slate-700">
                      {formatDateTime(selectedNode.endTime)}
                    </span>
                  </div>
                )}
                {selectedNode.remark && (
                  <div>
                    <span className="text-slate-500">备注：</span>
                    <span className="text-slate-700">{selectedNode.remark}</span>
                  </div>
                )}
                {selectedNode.stuckReason && (
                  <div className="p-3 bg-red-50 rounded-lg text-red-700">
                    <div className="font-medium mb-1">卡住原因</div>
                    <div className="text-sm">{selectedNode.stuckReason}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
