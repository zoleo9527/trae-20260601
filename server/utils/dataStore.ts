import type { Order, CustomsDocument, InventoryItem, TimelineEvent } from '../../types';
import { generateMockData } from '../data/mockData';

let orders: Order[] = [];
let customsDocuments: CustomsDocument[] = [];
let inventoryItems: InventoryItem[] = [];

function initializeData() {
  const mockData = generateMockData();
  orders = mockData.orders;
  customsDocuments = mockData.customsDocuments;
  inventoryItems = mockData.inventoryItems;
}

initializeData();

export function getDataStore() {
  return {
    getOrders: () => orders,
    getOrderById: (id: string) => orders.find(o => o.id === id),
    updateOrder: (id: string, updates: Partial<Order>) => {
      const index = orders.findIndex(o => o.id === id);
      if (index !== -1) {
        orders[index] = { ...orders[index], ...updates, updatedAt: new Date().toISOString() };
        return orders[index];
      }
      return null;
    },
    addOrderTimelineEvent: (orderId: string, event: Omit<TimelineEvent, 'id'>) => {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const newEvent: TimelineEvent = {
          ...event,
          id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        order.timeline.unshift(newEvent);
        order.updatedAt = new Date().toISOString();
        return newEvent;
      }
      return null;
    },
    
    getCustomsDocuments: () => customsDocuments,
    getCustomsDocumentById: (id: string) => customsDocuments.find(c => c.id === id),
    getCustomsDocumentsByOrderId: (orderId: string) => 
      customsDocuments.filter(c => c.orderId === orderId).sort((a, b) => b.version - a.version),
    createCustomsDocument: (doc: Omit<CustomsDocument, 'id' | 'createdAt' | 'updatedAt' | 'timeline'>) => {
      const newDoc: CustomsDocument = {
        ...doc,
        id: `cd_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: []
      };
      customsDocuments.unshift(newDoc);
      return newDoc;
    },
    updateCustomsDocument: (id: string, updates: Partial<CustomsDocument>) => {
      const index = customsDocuments.findIndex(c => c.id === id);
      if (index !== -1) {
        customsDocuments[index] = { 
          ...customsDocuments[index], 
          ...updates, 
          updatedAt: new Date().toISOString() 
        };
        return customsDocuments[index];
      }
      return null;
    },
    addCustomsTimelineEvent: (docId: string, event: Omit<TimelineEvent, 'id'>) => {
      const doc = customsDocuments.find(c => c.id === docId);
      if (doc) {
        const newEvent: TimelineEvent = {
          ...event,
          id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        doc.timeline.unshift(newEvent);
        doc.updatedAt = new Date().toISOString();
        return newEvent;
      }
      return null;
    },
    
    getInventoryItems: () => inventoryItems,
    
    resetAllData: () => {
      initializeData();
      return true;
    }
  };
}
