import React, { useState } from 'react';
import { Check, ChevronRight, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import type { AuditNode, DispatchNode } from '../data/types';
import { formatDateTime } from '../utils/date';

interface AuditProcessStepsProps {
  nodes: AuditNode[];
  currentNode: number;
  onNodeClick?: (node: AuditNode, index: number) => void;
}

export function AuditProcessSteps({ nodes, currentNode, onNodeClick }: AuditProcessStepsProps) {
  const getNodeIcon = (node: AuditNode, index: number) => {
    if (node.status === 'completed') {
      return <Check className="w-4 h-4" />;
    }
    if (node.status === 'stuck' || node.status === 'failed') {
      return <AlertTriangle className="w-4 h-4" />;
    }
    if (node.status === 'processing') {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    return <span className="w-4 h-4 text-xs font-mono">{index + 1}</span>;
  };

  const getNodeStyles = (node: AuditNode, index: number) => {
    const isActive = index === currentNode;
    const isCompleted = node.status === 'completed';
    const isFailed = node.status === 'stuck' || node.status === 'failed';
    const isPending = node.status === 'pending';

    return {
      circle: cn(
        'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
        isCompleted && 'bg-emerald-500 border-emerald-500 text-white',
        isActive && !isFailed && 'bg-blue-500 border-blue-500 text-white',
        isFailed && 'bg-red-500 border-red-500 text-white animate-pulse-alert',
        isPending && 'bg-white border-slate-300 text-slate-400'
      ),
      connector: cn(
        'h-0.5 flex-1 mx-2 transition-all',
        isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
      ),
      label: cn(
        'text-xs font-medium mt-2 whitespace-nowrap',
        isCompleted && 'text-emerald-700',
        isActive && !isFailed && 'text-blue-700',
        isFailed && 'text-red-700',
        isPending && 'text-slate-400'
      ),
    };
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-thin pb-4">
      <div className="flex items-center min-w-max px-2">
        {nodes.map((node, index) => {
          const styles = getNodeStyles(node, index);
          return (
            <React.Fragment key={node.id}>
              <div
                className={cn(
                  'flex flex-col items-center cursor-pointer group',
                  onNodeClick && 'hover:opacity-80'
                )}
                onClick={() => onNodeClick?.(node, index)}
              >
                <div className={styles.circle}>
                  {getNodeIcon(node, index)}
                </div>
                <span className={styles.label}>{node.name}</span>
                {(node.status === 'stuck' || node.stuckReason) && (
                  <span className="text-[10px] text-red-600 mt-1 max-w-[100px] text-center">
                    {node.stuckReason || '已卡住'}
                  </span>
                )}
                {node.endTime && (
                  <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    {formatDateTime(node.endTime).split(' ')[1]}
                  </span>
                )}
              </div>
              {index < nodes.length - 1 && <div className={styles.connector} />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

interface DispatchProcessStepsProps {
  nodes: DispatchNode[];
  onNodeClick?: (node: DispatchNode, index: number) => void;
  expandedNodeId?: string | null;
}

export function DispatchProcessSteps({ nodes, onNodeClick, expandedNodeId }: DispatchProcessStepsProps) {
  const getNodeIcon = (node: DispatchNode) => {
    if (node.status === 'success') {
      return <Check className="w-4 h-4" />;
    }
    if (node.status === 'failed') {
      return <AlertTriangle className="w-4 h-4" />;
    }
    if (node.status === 'processing') {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    return <ChevronRight className="w-4 h-4" />;
  };

  const getNodeStyles = (node: DispatchNode) => {
    const isFailed = node.status === 'failed';
    const isSuccess = node.status === 'success';
    const isProcessing = node.status === 'processing';
    const isExpanded = expandedNodeId === node.id;

    return {
      container: cn(
        'relative pl-8 pb-6 last:pb-0',
        isExpanded && 'pb-8'
      ),
      circle: cn(
        'absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center border-2 z-10',
        isSuccess && 'bg-emerald-500 border-emerald-500 text-white',
        isProcessing && 'bg-blue-500 border-blue-500 text-white',
        isFailed && 'bg-red-500 border-red-500 text-white',
        !isSuccess && !isProcessing && !isFailed && 'bg-white border-slate-300 text-slate-400'
      ),
      connector: cn(
        'absolute left-[15px] top-8 bottom-0 w-0.5',
        isSuccess ? 'bg-emerald-300' : 'bg-slate-200'
      ),
      content: cn(
        'bg-slate-50 rounded-lg p-3 border transition-all cursor-pointer hover:bg-slate-100',
        isFailed && 'border-red-200 bg-red-50 hover:bg-red-50',
        isExpanded && 'ring-2 ring-blue-300'
      ),
    };
  };

  return (
    <div className="relative">
      {nodes.map((node, index) => {
        const styles = getNodeStyles(node);
        const isExpanded = expandedNodeId === node.id;
        const isLast = index === nodes.length - 1;

        return (
          <div key={node.id} className={styles.container}>
            <div className={styles.circle}>
              {getNodeIcon(node)}
            </div>
            {!isLast && <div className={styles.connector} />}

            <div
              className={styles.content}
              onClick={() => onNodeClick?.(node, index)}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{node.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                    {node.target}
                  </span>
                </div>
                {node.endTime && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatDateTime(node.endTime)}
                  </span>
                )}
              </div>

              {node.status === 'failed' && (
                <div className="mt-2 text-xs text-red-600">
                  <div className="font-medium mb-0.5">
                    {node.errorCode && <span className="font-mono">[{node.errorCode}]</span>}
                    {node.errorMessage}
                  </div>
                </div>
              )}

              {isExpanded && node.rawLog && (
                <div className="mt-3 p-2 bg-slate-900 rounded overflow-x-auto">
                  <pre className="text-[10px] text-emerald-400 font-mono whitespace-pre-wrap">
                    {node.rawLog}
                  </pre>
                </div>
              )}

              {isExpanded && node.startTime && (
                <div className="mt-2 flex gap-4 text-[10px] text-slate-500">
                  <span>开始: {formatDateTime(node.startTime)}</span>
                  {node.endTime && <span>结束: {formatDateTime(node.endTime)}</span>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
