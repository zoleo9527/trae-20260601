import { db } from '../database';
import { Table, TableStatus } from '../types';

export const tableService = {
  getAllTables: (): Table[] => {
    return db.getAllTables();
  },

  getTableById: (id: string): Table | null => {
    return db.getTableById(id);
  },

  createTable: (name: string, capacity: number, position?: string): Table => {
    return db.createTable(name, capacity, position);
  },

  updateTableStatus: (id: string, status: TableStatus): Table | null => {
    return db.updateTableStatus(id, status);
  },

  updateTable: (id: string, name?: string, capacity?: number, position?: string): Table | null => {
    return db.updateTable(id, name, capacity, position);
  },

  deleteTable: (id: string): boolean => {
    return db.deleteTable(id);
  },
};
