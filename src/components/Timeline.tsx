import { useState, useMemo } from 'react';
import type { WorkOrder, Remark } from '../types';
import { roleLabels, statusLabels, remarkTypeLabels } from '../types';
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
  MessageSquare,
  Wrench,
} from 'lucide-react';

interface TimelineProps {
  workOrder: WorkOrder;
}

type TimelineNodeType =
  | 'report'
  | 'dispatch'
  | 'onsite'
  | 'in_progress'
  | 'return'
  | 'complete'
  | 'remark';

interface TimelineNodeData {
  id: string;
  type: TimelineNodeType;
  title: string;
  operator: string;
  operatorRole: 'inspector' | 'electrician' | 'dispatcher' | 'supervisor';
  time: string;
  remark?: string;
  isCurrent?: boolean;
  isMainNode: boolean;
  roundNumber?: number;
  remarkType?: string;
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
      isMainNode: true,
      roundNumber: 0,
    });

    let currentRound = 0;

    const sortedRemarks = [...workOrder.remarks].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sortedRemarks.forEach((remark: Remark, index: number) => {
      if (remark.type === 'dispatch') {
        currentRound += 1;
        result.push({
          id: `dispatch-${index}`,
          type: 'dispatch',
          title: currentRound > 1 ? `二次派工` : '维修派工',
          operator: remark.authorName,
          operatorRole: remark.authorRole,
          time: remark.timestamp,
          remark: remark.content,
          isMainNode: true,
          roundNumber: currentRound,
          remarkType: remark.type,
        });
      } else if (remark.type === 'onsite') {
        result.push({
          id: `onsite-${index}`,
          type: 'onsite',
          title: '到场反馈',
          operator: remark.authorName,
          operatorRole: remark.authorRole,
          time: remark.timestamp,
          remark: remark.content,
          isMainNode: true,
          roundNumber: currentRound,
          remarkType: remark.type,
        });

        if (workOrder.status === 'in_progress') {
          result.push({
            id: `in-progress-${index}`,
            type: 'in_progress',
            title: '维修处理中',
            operator: remark.authorName,
            operatorRole: remark.authorRole,
            time: remark.timestamp,
            remark: '正在进行故障排查和维修作业',
            isMainNode: true,
            roundNumber: currentRound,
          });
        }
      } else if (remark.type === 'return') {
        result.push({
          id: `return-${index}`,
          type: 'return',
          title: '退回申请',
          operator: remark.authorName,
          operatorRole: remark.authorRole,
          time: remark.timestamp,
          remark: remark.content,
          isMainNode: true,
          roundNumber: currentRound,
          remarkType: remark.type,
        });
      } else if (remark.type === 'complete') {
        result.push({
          id: `complete-${index}`,
          type: 'complete',
          title: '维修完成',
          operator: remark.authorName,
          operatorRole: remark.authorRole,
          time: remark.timestamp,
          remark: remark.content,
          isMainNode: true,
          roundNumber: currentRound,
          remarkType: remark.type,
        });
      } else if (remark.type === 'supplement') {
        result.push({
          id: `remark-${index}`,
          type: 'remark',
          title: '补充备注',
          operator: remark.authorName,
          operatorRole: remark.authorRole,
          time: remark.timestamp,
          remark: remark.content,
          isMainNode: false,
          roundNumber: currentRound,
          remarkType: remark.type,
        });
      }
    });

    result.sort((a, b) => {
      const timeDiff = new Date(a.time).getTime() - new Date(b.time).getTime();
      if (timeDiff !== 0) return timeDiff;
      const typeOrder: Record<string, number> = {
        report: 0,
        dispatch: 1,
        onsite: 2,
        in_progress: 3,
        remark: 4,
        return: 5,
        complete: 6,
      };
      return (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0);
    });

    let lastMainNodeIndex = -1;
    for (let i = result.length - 1; i >= 0; i--) {
      if (result[i].isMainNode) {
        lastMainNodeIndex = i;
        break;
      }
    }
    if (lastMainNodeIndex >= 0) {
      result[lastMainNodeIndex].isCurrent = true;
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
    in_progress: Wrench,
    return: RotateCcw,
    complete: CheckCircle,
    remark: MessageSquare,
  };

  const nodeColors = {
    report: 'bg-neutral-500 border-neutral-500',
    dispatch: 'bg-primary-600 border-primary-600',
    onsite: 'bg-warning-500 border-warning-500',
    in_progress: 'bg-info-500 border-info-500',
    return: 'bg-danger-500 border-danger-500',
    complete: 'bg-success-500 border-success-500',
    remark: 'bg-neutral-400 border-neutral-400',
  };

  const nodeBgColors = {
    report: 'bg-neutral-50',
    dispatch: 'bg-primary-50',
    onsite: 'bg-warning-50',
    in_progress: 'bg-info-50',
    return: 'bg-danger-50',
    complete: 'bg-success-50',
    remark: 'bg-neutral-50',
  };

  const nodeBorderColors = {
    report: 'border-neutral-200',
    dispatch: 'border-primary-200',
    onsite: 'border-warning-200',
    in_progress: 'border-info-200',
    return: 'border-danger-200',
    complete: 'border-success-200',
    remark: 'border-neutral-200',
  };

  const typeLabels = {
    report: '故障上报',
    dispatch: '派工处理',
    onsite: '现场处理',
    in_progress: '现场处理',
    return: '退回流转',
    complete: '工单闭环',
    remark: '沟通记录',
  };

  const expandAll = () => {
    setExpandedNodes(new Set(nodes.map((n) => n.id)));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const mainNodeCount = nodes.filter((n) => n.isMainNode).length;
  const remarkCount = nodes.filter((n) => !n.isMainNode).length;
  const roundCount = nodes.filter((n) => n.type === 'dispatch').length;

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
          <span className="text-xs font-medium text-primary-600">
            当前状态：{statusLabels[workOrder.status]}
          </span>
          {roundCount > 1 && (
            <span className="text-xs px-2 py-0.5 bg-warning-100 text-warning-700 rounded">
              第 {roundCount} 轮处理
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-400">
            {mainNodeCount} 个节点 · {remarkCount} 条备注
          </span>
          <span className="text-neutral-300">|</span>
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
          const isRemark = !node.isMainNode;

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
              <div className={`relative flex gap-3 ${isRemark ? 'pb-2' : 'pb-4'}`}>
                <div
                  className={`${
                    isRemark ? 'w-6 h-6 mt-1' : 'w-8 h-8'
                  } rounded-full border-2 ${nodeColors[node.type]} flex items-center justify-center flex-shrink-0 z-10 ${
                    isCurrent && !isRemark
                      ? 'ring-4 ring-primary-100 scale-110 animate-pulse-ring'
                      : ''
                  } transition-all duration-300`}
                >
                  <Icon
                    className={`${isRemark ? 'w-3 h-3' : 'w-4 h-4'} text-white`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`rounded-lg border ${
                      nodeBorderColors[node.type]
                    } ${nodeBgColors[node.type]} transition-all duration-200 ${
                      isCurrent && !isRemark
                        ? 'shadow-md ring-1 ring-primary-200'
                        : 'hover:shadow-sm'
                    } ${isRemark ? 'bg-white' : ''} cursor-pointer`}
                    onClick={() => toggleNode(node.id)}
                  >
                    <div className={`${isRemark ? 'p-2.5' : 'p-3'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4
                              className={`font-semibold text-neutral-800 ${
                                isRemark ? 'text-sm' : 'text-sm'
                              }`}
                            >
                              {node.title}
                            </h4>
                            {isCurrent && !isRemark && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-600 text-white text-xs font-medium rounded">
                                <Zap className="w-3 h-3" />
                                当前节点
                              </span>
                            )}
                            {!isRemark && (
                              <span className="text-xs px-2 py-0.5 bg-white/60 rounded text-neutral-500">
                                {typeLabels[node.type]}
                              </span>
                            )}
                            {node.roundNumber && node.roundNumber > 1 && node.type === 'dispatch' && (
                              <span className="text-xs px-1.5 py-0.5 bg-warning-100 text-warning-700 rounded">
                                第{node.roundNumber}轮
                              </span>
                            )}
                            {isRemark && node.remarkType && (
                              <span className="text-xs px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-500">
                                {remarkTypeLabels[node.remarkType as keyof typeof remarkTypeLabels] ||
                                  '备注'}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span
                              className={`text-neutral-500 flex items-center gap-1 ${
                                isRemark ? 'text-xs' : 'text-xs'
                              }`}
                            >
                              <User className="w-3 h-3" />
                              {node.operator} ({roleLabels[node.operatorRole]})
                            </span>
                            <span
                              className={`text-neutral-400 flex items-center gap-1 ${
                                isRemark ? 'text-xs' : 'text-xs'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              {node.time}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronUp
                              className={`${
                                isRemark ? 'w-3.5 h-3.5' : 'w-4 h-4'
                              } text-neutral-400`}
                            />
                          ) : (
                            <ChevronDown
                              className={`${
                                isRemark ? 'w-3.5 h-3.5' : 'w-4 h-4'
                              } text-neutral-400`}
                            />
                          )}
                        </div>
                      </div>

                      {isExpanded && node.remark && (
                        <div
                          className={`mt-2 pt-2 border-t ${
                            isRemark
                              ? 'border-neutral-100'
                              : 'border-white/50'
                          }`}
                        >
                          <div
                            className={`rounded-md p-2.5 ${
                              isRemark ? 'bg-neutral-50' : 'bg-white/70'
                            }`}
                          >
                            <p
                              className={`text-neutral-700 leading-relaxed ${
                                isRemark ? 'text-xs' : 'text-sm'
                              }`}
                            >
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

      {remarkCount > 0 && (
        <div className="mt-4 pt-4 border-t border-dashed border-neutral-200">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
            <span className="text-xs font-medium text-neutral-600">
              共 {mainNodeCount} 个流程节点 · {remarkCount} 条沟通备注
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
