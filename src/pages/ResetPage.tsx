import { useState } from 'react';
import { AlertTriangle, RotateCcw, CheckCircle, Database } from 'lucide-react';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';

export default function ResetPage() {
  const { resetAllData, employees, statusLogs, trainingRecords, documents, riskFlags } = useStore();
  const [confirmStep, setConfirmStep] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  const handleReset = () => {
    setIsResetting(true);
    setTimeout(() => {
      resetAllData();
      setIsResetting(false);
      setResetComplete(true);
      setConfirmStep(0);
      setTimeout(() => setResetComplete(false), 3000);
    }, 800);
  };

  const stats = [
    { label: '员工记录', count: employees.length, color: 'text-brand-600' },
    { label: '状态日志', count: statusLogs.length, color: 'text-amber' },
    { label: '培训记录', count: trainingRecords.length, color: 'text-emerald' },
    { label: '证件记录', count: documents.length, color: 'text-ink-600' },
    { label: '风险标记', count: riskFlags.length, color: 'text-rose' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-ink-900">数据重置</h1>
        <p className="text-sm text-ink-500 mt-1">
          重置所有演示数据，恢复到初始状态
        </p>
      </div>

      <div className="card p-6 border-l-4 border-l-amber">
        <div className="flex items-start gap-4">
          <AlertTriangle size={24} className="text-amber mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-ink-800">危险操作</div>
            <div className="text-sm text-ink-500 mt-1">
              此操作将永久删除所有操作记录，包括员工信息、培训记录、证件收集状态和风险标记。
              重置后数据将无法恢复，请谨慎操作。
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-serif font-semibold text-ink-800 mb-4">当前数据统计</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-4 bg-ink-50 rounded-[4px]">
              <div className={cn('text-3xl font-serif font-semibold tabular-nums', stat.color)}>
                {stat.count}
              </div>
              <div className="text-xs text-ink-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {resetComplete && (
        <div className="card p-5 border-l-4 border-l-emerald bg-emerald/5 animate-slide-up">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-emerald" />
            <div>
              <div className="font-medium text-ink-800 text-sm">数据重置成功</div>
              <div className="text-xs text-ink-500 mt-0.5">
                所有数据已恢复到初始演示状态
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card p-6">
        <h2 className="font-serif font-semibold text-ink-800 mb-4">重置确认</h2>

        {confirmStep === 0 && (
          <div className="space-y-4">
            <div className="text-sm text-ink-600">
              请确认您了解此操作的后果：
            </div>
            <ul className="space-y-2 text-sm text-ink-500">
              <li className="flex items-start gap-2">
                <span className="text-amber">•</span>
                所有员工的状态将恢复为初始值
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber">•</span>
                所有培训记录和证件收集状态将被清空
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber">•</span>
                所有风险标记将被清除
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber">•</span>
                所有状态变更日志将被重置
              </li>
            </ul>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setConfirmStep(1)}
            >
              <RotateCcw size={14} />
              我了解后果，继续重置
            </button>
          </div>
        )}

        {confirmStep === 1 && (
          <div className="space-y-4 animate-slide-up">
            <div className="text-sm text-ink-600">
              为了确保您不是误操作，请再次确认：
            </div>
            <div className="p-4 bg-rose/5 rounded-[4px] border border-rose/20">
              <div className="text-sm text-rose font-medium">
                确认要重置所有数据吗？此操作不可撤销。
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setConfirmStep(0)}
              >
                取消
              </button>
              <button
                className={cn(
                  'btn btn-danger btn-sm',
                  isResetting && 'opacity-50 cursor-wait'
                )}
                onClick={handleReset}
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <Database size={14} className="animate-pulse" />
                    重置中...
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    确认重置所有数据
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="font-serif font-semibold text-ink-800 mb-4">重置后数据</h2>
        <div className="text-sm text-ink-500 mb-4">
          重置后系统将包含以下初始演示数据：
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-ink-50 rounded-[4px]">
            <div className="font-medium text-ink-800 text-sm mb-2">员工列表（8人）</div>
            <ul className="text-xs text-ink-500 space-y-1">
              <li>• 王建国 - 恒信物流 - 仓库分拣员（待培训）</li>
              <li>• 李秀英 - 恒信物流 - 仓管辅助（培训中）</li>
              <li>• 张大勇 - 盛达电子 - 生产线操作员（待收证）</li>
              <li>• 赵美玲 - 盛达电子 - 质检辅助（收集中）</li>
              <li>• 刘志强 - 恒信物流 - 叉车驾驶员（培训异常）</li>
              <li>• 陈小红 - 众联餐饮 - 后厨辅助（已完成）</li>
              <li>• 孙海涛 - 众联餐饮 - 配送员（待培训）</li>
              <li>• 周芳芳 - 盛达电子 - 包装工（培训中）</li>
            </ul>
          </div>
          <div className="p-4 bg-ink-50 rounded-[4px]">
            <div className="font-medium text-ink-800 text-sm mb-2">预设场景</div>
            <ul className="text-xs text-ink-500 space-y-1">
              <li>• 刘志强：叉车证过期 - 培训异常 + 工资扣款风险</li>
              <li>• 赵美玲：健康证即将到期 - 证件收集中 + 考勤争议</li>
              <li>• 张大勇：返聘员工 - 待补社保证明和背景调查</li>
              <li>• 陈小红：已完成全流程 - 含历史临时缺岗记录</li>
              <li>• 王建国、孙海涛：新录入员工 - 待安排培训</li>
              <li>• 李秀英、周芳芳：正在培训中</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
