import { useExceptionStore } from '../store/exceptionStore';
import { useWorkOrderStore } from '../store/workOrderStore';
import { Exception } from '../types';

export interface ExceptionStats {
  total: number;
  byStatus: {
    open: number;
    analyzing: number;
    handling: number;
    resolved: number;
    escalated: number;
    closed: number;
  };
  byType: {
    wrong_model: number;
    warranty_dispute: number;
    inventory_issue: number;
    other: number;
  };
  allExceptions: Exception[];
}

export function useExceptionStats(): ExceptionStats {
  const exceptions = useExceptionStore((state) => state.exceptions);
  const orders = useWorkOrderStore((state) => state.orders);

  const allExceptions: Exception[] = [
    ...exceptions,
    ...orders.flatMap((order) =>
      order.exceptions.filter(
        (exc) => !exceptions.find((e) => e.id === exc.id)
      )
    ),
  ];

  return {
    total: allExceptions.length,
    byStatus: {
      open: allExceptions.filter((e) => e.status === 'open').length,
      analyzing: allExceptions.filter((e) => e.status === 'analyzing').length,
      handling: allExceptions.filter((e) => e.status === 'handling').length,
      resolved: allExceptions.filter((e) => e.status === 'resolved').length,
      escalated: allExceptions.filter((e) => e.status === 'escalated').length,
      closed: allExceptions.filter((e) => e.status === 'closed').length,
    },
    byType: {
      wrong_model: allExceptions.filter((e) => e.type === 'wrong_model').length,
      warranty_dispute: allExceptions.filter((e) => e.type === 'warranty_dispute').length,
      inventory_issue: allExceptions.filter((e) => e.type === 'inventory_issue').length,
      other: allExceptions.filter((e) => e.type === 'other').length,
    },
    allExceptions,
  };
}
