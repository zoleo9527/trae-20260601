import React from 'react';
import { RoomStatus } from '../types/inventory';

interface StatusCardProps {
  status: RoomStatus | 'ALL';
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  label,
  count,
  isActive,
  onClick,
  icon,
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-sm border transition-all ${
        isActive
          ? 'bg-slate-800 text-white border-slate-800 shadow-md'
          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <span className={`${isActive ? 'text-blue-400' : 'text-gray-400'} w-4 h-4`}>{icon}</span>
      <div className="text-left">
        <div className="text-[11px] text-gray-400 leading-tight">{label}</div>
        <div className="text-lg font-semibold leading-tight">{count}</div>
      </div>
    </button>
  );
};
