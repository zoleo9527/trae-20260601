import { GroupTicket, FilterParams, GroupTicketStatus } from '../types';
import { STATUS_LABELS, STATUS_COLORS, ROLE_LABELS } from './statusFlow';

export function filterGroupTickets(
  tickets: GroupTicket[],
  params: FilterParams
): GroupTicket[] {
  return tickets.filter(ticket => {
    if (params.status && ticket.status !== params.status) {
      return false;
    }
    if (params.handler && ticket.currentHandler !== params.handler) {
      return false;
    }
    if (params.hasReject !== undefined) {
      const hasReject = ticket.rejectRecords.length > 0;
      if (hasReject !== params.hasReject) {
        return false;
      }
    }
    if (params.hasSupplementary !== undefined) {
      const hasSupplementary = !!ticket.supplementaryRemark;
      if (hasSupplementary !== params.hasSupplementary) {
        return false;
      }
    }
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      const matches =
        ticket.orderNo.toLowerCase().includes(keyword) ||
        ticket.companyName.toLowerCase().includes(keyword) ||
        ticket.movieName.toLowerCase().includes(keyword) ||
        ticket.contactName.toLowerCase().includes(keyword) ||
        ticket.contactPhone.includes(keyword);
      if (!matches) {
        return false;
      }
    }
    return true;
  });
}

export interface EnrichedGroupTicket extends GroupTicket {
  statusLabel: string;
  statusColor: string;
  currentHandlerLabel: string;
  hasReject: boolean;
  hasSupplementary: boolean;
}

export function enrichGroupTicket(ticket: GroupTicket): EnrichedGroupTicket {
  return {
    ...ticket,
    statusLabel: STATUS_LABELS[ticket.status],
    statusColor: STATUS_COLORS[ticket.status],
    currentHandlerLabel: ROLE_LABELS[ticket.currentHandler],
    hasReject: ticket.rejectRecords.length > 0,
    hasSupplementary: !!ticket.supplementaryRemark,
  };
}
