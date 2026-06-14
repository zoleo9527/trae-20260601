import React from 'react';
import type { ComplaintStatus, VisitStatus } from '@/types';
import { COMPLAINT_STATUS_LABEL, VISIT_STATUS_LABEL } from '@/types';
import { Badge } from '@/components/ui/Badge';

export function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  const toneMap: Record<ComplaintStatus, 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple'> = {
    registered: 'default',
    assigned: 'primary',
    investigating: 'info',
    pending_verification: 'warning',
    resolved: 'success',
    rejected: 'danger',
    escalated: 'danger',
  };
  return <Badge tone={toneMap[status]} dot>{COMPLAINT_STATUS_LABEL[status]}</Badge>;
}

export function VisitStatusBadge({ status }: { status: VisitStatus }) {
  const toneMap: Record<VisitStatus, 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    pending: 'warning',
    in_progress: 'primary',
    verified: 'success',
    unverified: 'info',
    returned: 'danger',
  };
  return <Badge tone={toneMap[status]} dot>{VISIT_STATUS_LABEL[status]}</Badge>;
}
