import { resetData } from '../data/store.js';

export const resetAllData = (): boolean => {
  resetData();
  return true;
};
