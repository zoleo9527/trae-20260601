import {
  User,
  Property,
  ViewingRecord,
  Quotation,
  Contract,
  HandoverForm,
  DepositRecord,
  OperationLog,
} from '../types';

interface Database {
  users: Map<string, User>;
  properties: Map<string, Property>;
  viewingRecords: Map<string, ViewingRecord>;
  quotations: Map<string, Quotation>;
  contracts: Map<string, Contract>;
  handoverForms: Map<string, HandoverForm>;
  depositRecords: Map<string, DepositRecord>;
  operationLogs: OperationLog[];
  userPasswords: Map<string, string>;
}

const db: Database = {
  users: new Map(),
  properties: new Map(),
  viewingRecords: new Map(),
  quotations: new Map(),
  contracts: new Map(),
  handoverForms: new Map(),
  depositRecords: new Map(),
  operationLogs: [],
  userPasswords: new Map(),
};

export default db;

export const getNextSequence = (prefix: string): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${prefix}${year}${month}${day}${random}`;
};
