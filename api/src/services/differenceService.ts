import { Difference, CreateDifferenceDTO, UpdateDifferenceStatusDTO } from '../types';
import { differences, getNextId } from '../data/database';

export const getAllDifferences = (): Difference[] => {
  return differences;
};

export const getDifferenceById = (id: number): Difference | undefined => {
  return differences.find(d => d.id === id);
};

export const getDifferencesByInspectionId = (inspectionId: number): Difference[] => {
  return differences.filter(d => d.inspectionId === inspectionId);
};

export const createDifference = (dto: CreateDifferenceDTO): Difference => {
  const newDifference: Difference = {
    ...dto,
    id: getNextId('difference'),
    status: 'pending',
    handlerId: null,
    processedAt: null,
    processingResult: null,
  };
  differences.push(newDifference);
  return newDifference;
};

export const updateDifferenceStatus = (id: number, dto: UpdateDifferenceStatusDTO): Difference | undefined => {
  const index = differences.findIndex(d => d.id === id);
  if (index === -1) return undefined;

  const updatedDifference: Difference = {
    ...differences[index],
    status: dto.status,
    handlerId: dto.handlerId ?? differences[index].handlerId,
    processingResult: dto.processingResult ?? differences[index].processingResult,
    processedAt: dto.status === 'resolved' ? new Date().toISOString() : differences[index].processedAt,
  };

  differences[index] = updatedDifference;
  return updatedDifference;
};

export const getDifferencesByStatus = (status: Difference['status']): Difference[] => {
  return differences.filter(d => d.status === status);
};
