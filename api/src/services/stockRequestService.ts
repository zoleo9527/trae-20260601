import { StockRequest, RequestWithDetails, CreateStockRequestDTO, UpdateStockRequestStatusDTO } from '../types';
import { stockRequests, getNextId, stores, users, products, inspections, differences } from '../data/database';

export const getAllStockRequests = (): StockRequest[] => {
  return stockRequests;
};

export const getStockRequestById = (id: number): StockRequest | undefined => {
  return stockRequests.find(r => r.id === id);
};

export const getStockRequestWithDetails = (id: number): RequestWithDetails | undefined => {
  const request = stockRequests.find(r => r.id === id);
  if (!request) return undefined;

  const store = stores.find(s => s.id === request.storeId);
  const user = users.find(u => u.id === request.userId);
  const product = products.find(p => p.id === request.productId);
  const inspection = inspections.find(i => i.requestId === id);
  const diffs = differences.filter(d => d.inspectionId === inspection?.id);

  if (!store || !user || !product) return undefined;

  return {
    ...request,
    store,
    user,
    product,
    inspection,
    differences: diffs.length > 0 ? diffs : undefined,
  };
};

export const getAllStockRequestsWithDetails = (): RequestWithDetails[] => {
  const result: RequestWithDetails[] = [];
  stockRequests.forEach(request => {
    const store = stores.find(s => s.id === request.storeId);
    const user = users.find(u => u.id === request.userId);
    const product = products.find(p => p.id === request.productId);
    const inspection = inspections.find(i => i.requestId === request.id);
    const diffs = differences.filter(d => d.inspectionId === inspection?.id);

    if (store && user && product) {
      result.push({
        ...request,
        store,
        user,
        product,
        inspection,
        differences: diffs.length > 0 ? diffs : undefined,
      });
    }
  });
  return result;
};

export const createStockRequest = (dto: CreateStockRequestDTO): StockRequest => {
  const newRequest: StockRequest = {
    ...dto,
    id: getNextId('stockRequest'),
    status: 'pending',
    supervisorComment: null,
    confirmedQty: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  stockRequests.push(newRequest);
  return newRequest;
};

export const updateStockRequestStatus = (id: number, dto: UpdateStockRequestStatusDTO): StockRequest | undefined => {
  const index = stockRequests.findIndex(r => r.id === id);
  if (index === -1) return undefined;

  const updatedRequest: StockRequest = {
    ...stockRequests[index],
    status: dto.status,
    supervisorComment: dto.supervisorComment ?? stockRequests[index].supervisorComment,
    confirmedQty: dto.confirmedQty ?? stockRequests[index].confirmedQty,
    updatedAt: new Date().toISOString(),
  };

  stockRequests[index] = updatedRequest;
  return updatedRequest;
};

export const getStockRequestsByStatus = (status: StockRequest['status']): StockRequest[] => {
  return stockRequests.filter(r => r.status === status);
};

export const getStockRequestsByStore = (storeId: number): StockRequest[] => {
  return stockRequests.filter(r => r.storeId === storeId);
};
