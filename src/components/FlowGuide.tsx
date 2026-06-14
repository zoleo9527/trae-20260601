import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  Archive,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface FlowGuideProps {
  className?: string;
}

export function FlowGuide({ className }: FlowGuideProps) {
  const navigate = useNavigate();

  const flows = [
    {
      type: 'smooth',
      label: '顺利流',
      description: '材料齐全，一次通过',
      example: '张伟 · 委托公证',
      exampleId: 'app-001',
      icon: CheckCircle2,
      color: 'emerald',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      iconColor: 'text-emerald-500',
      labelColor: 'text-emerald-700',
      descColor: 'text-emerald-600',
    },
    {
      type: 'problem',
      label: '问题流',
      description: '材料缺失，需补正',
      example: '王建国 · 继承公证',
      exampleId: 'app-003',
      icon: AlertTriangle,
      color: 'amber',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-500',
      labelColor: 'text-amber-700',
      descColor: 'text-amber-600',
    },
    {
      type: 'archive',
      label: '归档回看',
      description: '已归档，可回溯查看',
      example: '查看全部归档记录',
      exampleId: null,
      icon: Archive,
      color: 'navy',
      bgColor: 'bg-navy-50',
      borderColor: 'border-navy-200',
      iconColor: 'text-navy-500',
      labelColor: 'text-navy-700',
      descColor: 'text-navy-600',
    },
  ];

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-1.5 mb-1">
        <Shield className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          样例流程
        </span>
      </div>
      {flows.map((flow) => {
        const Icon = flow.icon;
        const handleClick = () => {
          if (flow.exampleId) {
            navigate(`/review/${flow.exampleId}`);
          } else {
            navigate('/archive');
          }
        };

        return (
          <button
            key={flow.type}
            onClick={handleClick}
            className={cn(
              'w-full flex items-center gap-2.5 p-2.5 rounded-lg border transition-all duration-200 text-left hover:shadow-sm group',
              flow.bgColor,
              flow.borderColor
            )}
          >
            <div className="w-7 h-7 rounded-md bg-white/80 flex items-center justify-center flex-shrink-0">
              <Icon className={cn('w-3.5 h-3.5', flow.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-[11px] font-semibold', flow.labelColor)}>
                {flow.label}
              </p>
              <p className={cn('text-[10px]', flow.descColor)}>
                {flow.description}
              </p>
            </div>
            <ArrowRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </button>
        );
      })}
    </div>
  );
}
