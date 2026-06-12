import { useNavigate, useParams } from 'react-router-dom';
import {
  ClipboardList,
  Receipt,
  Users,
  CheckCircle2,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { classNames } from '@/utils/formatters';
import { StatusBadge } from './StatusBadge';

interface StepNavProps {
  currentStep: number;
}

const STEPS = [
  { key: 'application', label: '退租申请', icon: FileText, path: '' },
  { key: 'inspection', label: '退场验收', icon: ClipboardList, path: 'inspection' },
  { key: 'cost', label: '费用明细', icon: Receipt, path: 'cost' },
  { key: 'confirm', label: '客户确认', icon: Users, path: 'confirm' },
  { key: 'completed', label: '流程完成', icon: CheckCircle2, path: '' },
];

export default function StepNavigator({ currentStep }: StepNavProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const app = useAppStore((s) => s.getApplicationById(id || ''));

  if (!app) return null;

  const getStepStatus = (index: number) => {
    if (index < currentStep) return 'done';
    if (index === currentStep) return 'current';
    return 'pending';
  };

  const handleClick = (index: number, path: string) => {
    if (!id) return;
    if (index <= currentStep) {
      if (path === '') {
        navigate(`/application/${id}`);
      } else {
        navigate(`/application/${id}/${path}`);
      }
    }
  };

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-serif text-lg font-semibold text-navy-800">
              {app.tenant.companyName}
            </h2>
            <p className="text-sm text-navy-500">
              {app.contract.floorRoom} · 合同号 {app.contract.contractNo}
            </p>
          </div>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <div className="flex items-center">
        {STEPS.slice(0, 4).map((step, index) => {
          const status = getStepStatus(index);
          const Icon = step.icon;
          const isClickable = index <= currentStep;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => handleClick(index, step.path)}
                disabled={!isClickable}
                className={classNames(
                  'flex items-center gap-2 transition-all duration-200 group',
                  isClickable ? 'cursor-pointer' : 'cursor-default opacity-50'
                )}
              >
                <div
                  className={classNames(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                    status === 'done' &&
                      'bg-sage-500 text-white shadow-md shadow-sage-200',
                    status === 'current' &&
                      'bg-gradient-to-br from-navy-600 to-navy-700 text-white shadow-md shadow-navy-200 ring-4 ring-navy-100',
                    status === 'pending' && 'bg-navy-100 text-navy-400'
                  )}
                >
                  <Icon className="w-4.5 h-4.5" strokeWidth={2} />
                </div>
                <div className="hidden sm:block">
                  <p
                    className={classNames(
                      'text-sm font-medium transition-colors',
                      status === 'current'
                        ? 'text-navy-800'
                        : status === 'done'
                        ? 'text-sage-700'
                        : 'text-navy-400'
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              </button>
              {index < 3 && (
                <div className="flex-1 mx-2 sm:mx-4">
                  <ChevronRight
                    className={classNames(
                      'w-4 h-4 mx-auto transition-colors',
                      index < currentStep ? 'text-sage-400' : 'text-navy-200'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
