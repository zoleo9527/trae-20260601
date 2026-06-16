import { Store } from '../types';
import { stores } from '../data/database';

export const getAllStores = (): Store[] => {
  return stores;
};

export const getStoreById = (id: number): Store | undefined => {
  return stores.find(s => s.id === id);
};
