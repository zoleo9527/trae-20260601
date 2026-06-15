import React from 'react';
import { APPEAL_STATUS_MAP } from '../types';

interface StatusTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts: Record<string, number>;
}

export const StatusTabs: React.FC<StatusTabsProps> = ({ activeTab, onTabChange, counts }) => {
  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'pending_receipt', label: APPEAL_STATUS_MAP.pending_receipt },
    { key: 'pending_inspection', label: APPEAL_STATUS_MAP.pending_inspection },
    { key: 'pending_finance', label: APPEAL_STATUS_MAP.pending_finance },
    { key: 'pending_confirmation', label: APPEAL_STATUS_MAP.pending_confirmation },
    { key: 'resolved', label: APPEAL_STATUS_MAP.resolved },
    { key: 'rejected', label: APPEAL_STATUS_MAP.rejected },
    { key: 'returned', label: APPEAL_STATUS_MAP.returned },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === tab.key
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {tab.label}
          {counts[tab.key] !== undefined && counts[tab.key] > 0 && (
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === tab.key ? 'bg-blue-500' : 'bg-gray-200'
            }`}>
              {counts[tab.key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};