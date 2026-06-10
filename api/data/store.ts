import { getSeedData, type AppData } from './seedData.js';

let data: AppData = getSeedData();

export const getData = (): AppData => data;

export const setData = (newData: AppData): void => {
  data = newData;
};

export const resetData = (): void => {
  data = getSeedData();
};

export const generateId = (prefix: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
};
