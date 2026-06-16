import { Inspection, CreateInspectionDTO } from '../types';
import { inspections, getNextId, stockRequests } from '../data/database';
import { updateStockRequestStatus } from './stockRequestService';

export const getAllInspections = (): Inspection[] => {
  return inspections;
};

export const getInspectionById = (id: number): Inspection | undefined => {
  return inspections.find(i => i.id === id);
};

export const getInspectionByRequestId = (requestId: number): Inspection | undefined => {
  return inspections.find(i => i.requestId === requestId);
};

export const createInspection = (dto: CreateInspectionDTO): Inspection => {
  const newInspection: Inspection = {
    ...dto,
    id: getNextId('inspection'),
    inspectedAt: new Date().toISOString(),
  };
  inspections.push(newInspection);
  
  updateStockRequestStatus(dto.requestId, { status: 'inspected' });
  
  return newInspection;
};
