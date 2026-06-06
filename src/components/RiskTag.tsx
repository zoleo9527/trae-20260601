import React from 'react';

interface RiskTagProps {
  level: string;
}

const riskConfig: Record<string, { label: string; className: string }> = {
  none: { label: '无风险', className: 'bg-green-100 text-green-700' },
  low: { label: '低风险', className: 'bg-yellow-100 text-yellow-700' },
  medium: { label: '中风险', className: 'bg-orange-100 text-orange-700' },
  high: { label: '高风险', className: 'bg-red-100 text-red-700' },
};

export const RiskTag: React.FC<RiskTagProps> = ({ level }) => {
  const config = riskConfig[level] || riskConfig.none;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};
