import React from 'react';
import {
  scheduleStatusLabels,
  scheduleStatusColors,
  hallStatusLabels,
  hallStatusColors,
  faultStatusLabels,
  faultStatusColors,
  ticketStatusLabels,
  ticketStatusColors,
} from '@/types/common';
import type { ScheduleStatus, HallStatus, FaultStatus, TicketStatus } from '@/types/common';

interface StatusBadgeProps {
  type: 'schedule' | 'hall' | 'fault' | 'ticket';
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, status }) => {
  const getLabel = () => {
    switch (type) {
      case 'schedule':
        return scheduleStatusLabels[status as ScheduleStatus] || status;
      case 'hall':
        return hallStatusLabels[status as HallStatus] || status;
      case 'fault':
        return faultStatusLabels[status as FaultStatus] || status;
      case 'ticket':
        return ticketStatusLabels[status as TicketStatus] || status;
      default:
        return status;
    }
  };

  const getColorClass = () => {
    switch (type) {
      case 'schedule':
        return scheduleStatusColors[status as ScheduleStatus] || 'bg-gray-100 text-gray-800';
      case 'hall':
        return hallStatusColors[status as HallStatus] || 'bg-gray-100 text-gray-800';
      case 'fault':
        return faultStatusColors[status as FaultStatus] || 'bg-gray-100 text-gray-800';
      case 'ticket':
        return ticketStatusColors[status as TicketStatus] || 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return <span className={`badge ${getColorClass()}`}>{getLabel()}</span>;
};
