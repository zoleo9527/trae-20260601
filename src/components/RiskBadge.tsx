import { AlertTriangle } from 'lucide-react';
import type { RiskFlagType } from '@/types';
import { RISK_LABEL, RISK_COLOR } from '@/constants';

interface Props {
  type: RiskFlagType;
  showIcon?: boolean;
  pulse?: boolean;
}

export default function RiskBadge({ type, showIcon = true, pulse = true }: Props) {
  const cls = RISK_COLOR[type];
  return (
    <span
      className={`chip ${cls} ${pulse ? 'animate-shake' : ''}`}
      title={RISK_LABEL[type]}
    >
      {showIcon && <AlertTriangle size={11} strokeWidth={2.5} />}
      {RISK_LABEL[type]}
    </span>
  );
}
