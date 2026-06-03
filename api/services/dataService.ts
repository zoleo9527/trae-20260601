import { db } from '../data/mockData';
import type { Landlord, Property, Order, Expense, Repair, Advance, Bill, Dispute } from '../../shared/types';

export const getAllLandlords = (): Landlord[] => db.landlords;
export const getLandlordById = (id: string): Landlord | undefined => db.landlords.find(l => l.id === id);

export const getAllProperties = (): Property[] => db.properties;
export const getPropertyById = (id: string): Property | undefined => db.properties.find(p => p.id === id);
export const getPropertiesByLandlordId = (landlordId: string): Property[] => db.properties.filter(p => p.landlordId === landlordId);

export const getAllOrders = (): Order[] => db.orders;
export const getOrderById = (id: string): Order | undefined => db.orders.find(o => o.id === id);
export const getOrdersByPropertyId = (propertyId: string): Order[] => db.orders.filter(o => o.propertyId === propertyId);

export const getAllExpenses = (): Expense[] => db.expenses;
export const getExpenseById = (id: string): Expense | undefined => db.expenses.find(e => e.id === id);
export const getExpensesByPropertyId = (propertyId: string): Expense[] => db.expenses.filter(e => e.propertyId === propertyId);
export const addExpense = (expense: Omit<Expense, 'id'>): Expense => {
  const newExpense = { ...expense, id: `e${Date.now()}` } as Expense;
  db.expenses.push(newExpense);
  return newExpense;
};

export const getAllRepairs = (): Repair[] => db.repairs;
export const getRepairById = (id: string): Repair | undefined => db.repairs.find(r => r.id === id);
export const getRepairsByPropertyId = (propertyId: string): Repair[] => db.repairs.filter(r => r.propertyId === propertyId);
export const addRepair = (repair: Omit<Repair, 'id'>): Repair => {
  const newRepair = { ...repair, id: `r${Date.now()}` } as Repair;
  db.repairs.push(newRepair);
  return newRepair;
};

export const getAllAdvances = (): Advance[] => db.advances;
export const getAdvanceById = (id: string): Advance | undefined => db.advances.find(a => a.id === id);
export const getAdvancesByPropertyId = (propertyId: string): Advance[] => db.advances.filter(a => a.propertyId === propertyId);

export const getAllBills = (): Bill[] => db.bills;
export const getBillById = (id: string): Bill | undefined => db.bills.find(b => b.id === id);
export const getBillsByPropertyId = (propertyId: string): Bill[] => db.bills.filter(b => b.propertyId === propertyId);
export const getBillsByLandlordId = (landlordId: string): Bill[] => db.bills.filter(b => b.landlordId === landlordId);
export const updateBillStatus = (id: string, status: Bill['status']): Bill | undefined => {
  const bill = db.bills.find(b => b.id === id);
  if (bill) {
    bill.status = status;
  }
  return bill;
};

export const getAllDisputes = (): Dispute[] => db.disputes;
export const getDisputeById = (id: string): Dispute | undefined => db.disputes.find(d => d.id === id);
export const getDisputesByBillId = (billId: string): Dispute[] => db.disputes.filter(d => d.billId === billId);
export const getDisputesByLandlordId = (landlordId: string): Dispute[] => db.disputes.filter(d => d.landlordId === landlordId);
export const addDispute = (dispute: Omit<Dispute, 'id' | 'messages'>): Dispute => {
  const newDispute = {
    ...dispute,
    id: `d${Date.now()}`,
    messages: [],
  } as Dispute;
  db.disputes.push(newDispute);
  const bill = db.bills.find(b => b.id === dispute.billId);
  if (bill) {
    bill.status = 'disputed';
  }
  return newDispute;
};

export const addDisputeMessage = (disputeId: string, sender: 'landlord' | 'operator', content: string): Dispute | undefined => {
  const dispute = db.disputes.find(d => d.id === disputeId);
  if (dispute) {
    dispute.messages.push({
      id: `dm${Date.now()}`,
      sender,
      content,
      createdAt: new Date().toISOString(),
    });
  }
  return dispute;
};

export const resolveDispute = (id: string, status: 'resolved' | 'rejected', resolution: string): Dispute | undefined => {
  const dispute = db.disputes.find(d => d.id === id);
  if (dispute) {
    dispute.status = status;
    dispute.resolution = resolution;
    dispute.resolvedAt = new Date().toISOString();
    if (status === 'resolved') {
      const bill = db.bills.find(b => b.id === dispute.billId);
      if (bill) {
        bill.status = 'confirmed';
      }
    }
  }
  return dispute;
};

export const getDashboardStats = () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const monthlyOrders = db.orders.filter(o => {
    const date = new Date(o.checkIn);
    return date.getMonth() + 1 === 7 && date.getFullYear() === 2024;
  });

  const totalIncome = monthlyOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPlatformFees = monthlyOrders.reduce((sum, o) => sum + o.platformFee, 0);
  const totalRefunds = monthlyOrders.reduce((sum, o) => sum + o.refundAmount, 0);

  return {
    totalProperties: db.properties.length,
    totalOrders: monthlyOrders.length,
    totalIncome,
    totalPlatformFees,
    totalRefunds,
    totalExpenses: db.expenses.filter(e => e.date.startsWith('2024-07')).reduce((sum, e) => sum + e.amount, 0),
    totalRepairs: db.repairs.filter(r => r.date.startsWith('2024-07')).length,
    pendingDisputes: db.disputes.filter(d => d.status === 'pending' || d.status === 'reviewing').length,
  };
};

export const addAdvance = (advance: Omit<Advance, 'id'>): Advance => {
  const newAdvance = { ...advance, id: `a${Date.now()}` } as Advance;
  db.advances.push(newAdvance);
  return newAdvance;
};

export const generateBill = (propertyId: string, year: number, month: number): Bill | undefined => {
  const property = getPropertyById(propertyId);
  if (!property) return undefined;

  const existingBill = db.bills.find(b => b.propertyId === propertyId && b.year === year && b.month === month);
  if (existingBill) return existingBill;

  const monthStart = `${year}-${String(month).padStart(2, '0')}`;

  const monthOrders = db.orders.filter(o => {
    const checkInDate = new Date(o.checkIn);
    return o.propertyId === propertyId &&
      checkInDate.getFullYear() === year &&
      checkInDate.getMonth() + 1 === month;
  });

  const monthExpenses = db.expenses.filter(e =>
    e.propertyId === propertyId && e.date.startsWith(monthStart)
  );

  const monthRepairs = db.repairs.filter(r =>
    r.propertyId === propertyId && r.date.startsWith(monthStart)
  );

  const monthAdvances = db.advances.filter(a =>
    a.propertyId === propertyId && a.date.startsWith(monthStart)
  );

  const totalIncome = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRepairs = monthRepairs.reduce((sum, r) => sum + r.cost, 0);
  const totalAdvances = monthAdvances.reduce((sum, a) => sum + a.amount, 0);
  const platformFees = monthOrders.reduce((sum, o) => sum + o.platformFee, 0);
  const refundAmount = monthOrders.reduce((sum, o) => sum + o.refundAmount, 0);

  const netAmount = totalIncome - totalExpenses - totalRepairs - platformFees - refundAmount;

  const newBill: Bill = {
    id: `b${Date.now()}`,
    propertyId,
    landlordId: property.landlordId,
    year,
    month,
    totalIncome,
    totalExpenses,
    totalRepairs,
    totalAdvances,
    platformFees,
    refundAmount,
    netAmount,
    status: 'generated',
    createdAt: new Date().toISOString().split('T')[0],
  };

  db.bills.push(newBill);
  return newBill;
};

export const getLandlordSummary = (landlordId: string) => {
  const properties = getPropertiesByLandlordId(landlordId);
  const bills = getBillsByLandlordId(landlordId);

  const propertySummaries = properties.map(p => {
    const propertyOrders = getOrdersByPropertyId(p.id);
    const propertyExpenses = getExpensesByPropertyId(p.id);
    const propertyRepairs = getRepairsByPropertyId(p.id);
    const propertyBills = bills.filter(b => b.propertyId === p.id);

    return {
      property: p,
      totalOrders: propertyOrders.length,
      totalIncome: propertyOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      totalExpenses: propertyExpenses.reduce((sum, e) => sum + e.amount, 0),
      totalRepairs: propertyRepairs.reduce((sum, r) => sum + r.cost, 0),
      latestBill: propertyBills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0],
    };
  });

  return {
    landlord: getLandlordById(landlordId),
    properties: propertySummaries,
    totalIncome: propertySummaries.reduce((sum, p) => sum + p.totalIncome, 0),
    totalExpenses: propertySummaries.reduce((sum, p) => sum + p.totalExpenses, 0),
    netIncome: propertySummaries.reduce((sum, p) => sum + (p.totalIncome - p.totalExpenses - p.totalRepairs), 0),
    pendingDisputes: db.disputes.filter(d => d.landlordId === landlordId && (d.status === 'pending' || d.status === 'reviewing')).length,
  };
};
