import { useState, useMemo } from 'react';
import type { WorkOrder } from '../types';
import { roleLabels, statusLabels } from '../types';
import {
  AlertTriangle,
  Send,
  MapPin,
  RotateCcw,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Zap,
} from 'lucide-react';

interface TimelineProps {
  workOrder: WorkOrder;
}

interface TimelineNodeData {
  id: string;
  type: 'report' | 'dispatch' | 'onsite' | 'return' | 'complete';
  title: string;
  operator: string;
  operatorRole: 'inspector' | 'electrician' | 'dispatcher' | 'supervisor';
  time: string;
  remark?: string;
  isCurrent?: boolean;
}

export function Timeline({ workOrder }: TimelineProps) {
  const nodes = useMemo<TimelineNodeData[]>(() => {
    const result: TimelineNodeData[] = [];

    result.push({
      id: 'report',
      type: 'report',
      title: '夜巡上报',
      operator: workOrder.patrolRecord.inspectorName,
      operatorRole: 'inspector',
      time: workOrder.patrolRecord.reportTime,
      remark: workOrder.patrolRecord.description,
    });

    if (workOrder.dispatchTime) {
      result.push({
        id: 'dispatch',
        type: 'dispatch',
        title: '维修派工',
        operator: '陈调度',
        operatorRole: 'dispatcher',
        time: workOrder.dispatchTime,
        remark: workOrder.dispatchRemark,
      });
    }

    if (workOrder.onSiteTime) {
      result.push({
        id: 'onsite',
        type: 'onsite',
        title: '到场反馈',
        operator: workOrder.electricianName || '电工',
        operatorRole: 'electrician',
        time: workOrder.onSiteTime,
        remark: workOrder.onSiteRemark,
      });
    }

    if (workOrder.returnTime) {
      result.push({
        id: 'return',
        type: 'return',
        title: '退回申请',
        operator: workOrder.electricianName || '电工',
        operatorRole: 'electrician',
        time: workOrder.returnTime,
        remark: workOrder.returnReason,
      });
    }

    if (workOrder.completeTime) {
      result.push({
        id: 'complete',
        type: 'complete',
        title: '维修完成',
        operator: workOrder.electricianName || '电工',
        operatorRole: 'electrician',
        time: workOrder.completeTime,
        remark: workOrder.completeRemark,
      });
    }

    if (result.length > 0) {
      result[result.length - 1].isCurrent = true;
    }

    return result;
  }, [workOrder]);

  const initialExpanded = useMemo(() => {
    return new Set(nodes.map((n) => n.id));
  }, [nodes]);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(initialExpanded);

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const nodeIcons = {
    report: AlertTriangle,
    dispatch: Send,
    onsite: MapPin,
    return: RotateCcw,
    complete: CheckCircle,
  };

  const nodeColors = {
    report: 'bg-neutral-500 border-neutral-500',
    dispatch: 'bg-primary-600 border-primary-600',
    onsite: 'bg-warning-500 border-warning-500',
    return: 'bg-danger-500 border-danger-500',
    complete: 'bg-success-500 border-success-500',
  };

  const nodeBgColors = {
    report: 'bg-neutral-50',
    dispatch: 'bg-primary-50',
    onsite: 'bg-warning-50',
    return: 'bg-danger-50',
    complete: 'bg-success-50',
  };

  const nodeBorderColors = {
    report: 'border-neutral-200',
    dispatch: 'border-primary-200',
    onsite: 'border-warning-200',
    return: 'border-danger-200',
    complete: 'border-success-200',
  };

  const typeLabels = {
    report: '故障上报',
    dispatch: '派工处理',
    onsite: '现场处理',
    return: '退回流转',
    complete: '工单闭环',
  };

  const expandAll = () => {
    setExpandedNodes(new Set(nodes.map((n) => n.id)));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
          <span className="text-xs font-medium text-primary-600">
            当前状态：{statusLabels[workOrder.status]}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={expandAll}
            className="text-neutral-500 hover:text-primary-600 transition-colors"
          >
            全部展开
          </button>
          <span className="text-neutral-300">|</span>
          <button
            onClick={collapseAll}
            className="text-neutral-500 hover:text-primary-600 transition-colors"
          >
            全部收起
          </button>
        </div>
      </div>

      <div className="space-y-1">
        {nodes.map((node, index) => {
          const Icon = nodeIcons[node.type];
          const isExpanded = expandedNodes.has(node.id);
          const isLast = index === nodes.length - 1;
          const isCurrent = node.isCurrent;

          return (
            <div key={node.id} className="relative">
              {!isLast && (
                <div
                  className={`absolute left-4 top-10 w-0.5 ${
                    isCurrent ? 'bg-primary-300' : 'bg-neutral-200'
                  }`}
                  style={{ height: 'calc(100% + 4px)' }}
                />
              )}
              <div className="relative flex gap-3 pb-4">
                <div
                  className={`w-8 h-8 rounded-full border-2 ${nodeColors[node.type]} flex items-center justify-center flex-shrink-0 z-10 ${
                    isCurrent ? 'ring-4 ring-primary-100 scale-110' : ''
                  } transition-all duration-300`}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`rounded-lg border ${
                      nodeBorderColors[node.type]
                    } ${nodeBgColors[node.type]} transition-all duration-200 ${
                      isCurrent ? 'shadow-md ring-1 ring-primary-200' : 'hover:shadow-sm'
                    } cursor-pointer`}
                    onClick={() => toggleNode(node.id)}
                  >
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-neutral-800">
                              {node.title}
                            </h4>
                            {isCurrent && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-600 text-white text-xs font-medium rounded">
                                <Zap className="w-3 h-3" />
                                当前节点
                              </span>
                            )}
                            <span className="text-xs px-2 py-0.5 bg-white/60 rounded text-neutral-500">
                              {typeLabels[node.type]}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="text-xs text-neutral-500 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {node.operator} ({roleLabels[node.operatorRole]})
                            </span>
                            <span className="text-xs text-neutral-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {node.time}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-neutral-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-neutral-400" />
                          )}
                        </div>
                      </div>

                      {isExpanded && node.remark && (
                        <div className="mt-3 pt-3 border-t border-white/50">
                          <div className="bg-white/70 rounded-md p-3">
                            <p className="text-sm text-neutral-700 leading-relaxed">
                              {node.remark}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {workOrder.remarks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-dashed border-neutral-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
            <span className="text-xs font-medium text-neutral-600">
              共 {workOrder.remarks.length} 条历史备注
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
