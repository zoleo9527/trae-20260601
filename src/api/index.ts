import { 
  Store, 
  User, 
  Product, 
  StockRequest, 
  Inspection, 
  Difference,
  RequestWithDetails,
  CreateStockRequestDTO,
  UpdateStockRequestStatusDTO,
  CreateInspectionDTO,
  CreateDifferenceDTO,
  UpdateDifferenceStatusDTO
} from '../types';

const BASE_URL = 'http://localhost:3001/api';

export const api = {
  stores: {
    getAll: async (): Promise<Store[]> => {
      const response = await fetch(`${BASE_URL}/stores`);
      return response.json();
    },
    getById: async (id: number): Promise<Store> => {
      const response = await fetch(`${BASE_URL}/stores/${id}`);
      return response.json();
    },
  },

  users: {
    getAll: async (): Promise<User[]> => {
      const response = await fetch(`${BASE_URL}/users`);
      return response.json();
    },
    getById: async (id: number): Promise<User> => {
      const response = await fetch(`${BASE_URL}/users/${id}`);
      return response.json();
    },
  },

  products: {
    getAll: async (keyword?: string): Promise<Product[]> => {
      const url = keyword ? `${BASE_URL}/products?keyword=${encodeURIComponent(keyword)}` : `${BASE_URL}/products`;
      const response = await fetch(url);
      return response.json();
    },
    getById: async (id: number): Promise<Product> => {
      const response = await fetch(`${BASE_URL}/products/${id}`);
      return response.json();
    },
  },

  stockRequests: {
    getAll: async (): Promise<RequestWithDetails[]> => {
      const response = await fetch(`${BASE_URL}/stock-requests`);
      return response.json();
    },
    getById: async (id: number): Promise<RequestWithDetails> => {
      const response = await fetch(`${BASE_URL}/stock-requests/${id}`);
      return response.json();
    },
    create: async (dto: CreateStockRequestDTO): Promise<StockRequest> => {
      const response = await fetch(`${BASE_URL}/stock-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      return response.json();
    },
    updateStatus: async (id: number, dto: UpdateStockRequestStatusDTO): Promise<StockRequest> => {
      const response = await fetch(`${BASE_URL}/stock-requests/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      return response.json();
    },
  },

  inspections: {
    getAll: async (): Promise<Inspection[]> => {
      const response = await fetch(`${BASE_URL}/inspections`);
      return response.json();
    },
    getById: async (id: number): Promise<Inspection> => {
      const response = await fetch(`${BASE_URL}/inspections/${id}`);
      return response.json();
    },
    create: async (dto: CreateInspectionDTO): Promise<Inspection> => {
      const response = await fetch(`${BASE_URL}/inspections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      return response.json();
    },
  },

  differences: {
    getAll: async (): Promise<Difference[]> => {
      const response = await fetch(`${BASE_URL}/differences`);
      return response.json();
    },
    getById: async (id: number): Promise<Difference> => {
      const response = await fetch(`${BASE_URL}/differences/${id}`);
      return response.json();
    },
    create: async (dto: CreateDifferenceDTO): Promise<Difference> => {
      const response = await fetch(`${BASE_URL}/differences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      return response.json();
    },
    updateStatus: async (id: number, dto: UpdateDifferenceStatusDTO): Promise<Difference> => {
      const response = await fetch(`${BASE_URL}/differences/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      return response.json();
    },
  },
};
