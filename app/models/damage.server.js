import { damageRecords, deliveryRecords, salesOrders, users } from '~/data/mockData';

export async function getDamageRecords() {
  return damageRecords.map(dr => {
    const delivery = deliveryRecords.find(d => d.id === dr.deliveryRecordId);
    const order = salesOrders.find(o => o.id === dr.salesOrderId);
    const reporter = users.find(u => u.id === dr.reporterId);
    return { ...dr, delivery, order, reporter };
  });
}

export async function getDamageRecordById(id) {
  const dr = damageRecords.find(r => r.id === id);
  if (!dr) return null;
  
  const delivery = deliveryRecords.find(d => d.id === dr.deliveryRecordId);
  const order = salesOrders.find(o => o.id === dr.salesOrderId);
  const reporter = users.find(u => u.id === dr.reporterId);
  
  return { ...dr, delivery, order, reporter };
}

export async function getPendingDamageRecords() {
  return damageRecords
    .filter(dr => dr.status === 'pending')
    .map(dr => {
      const delivery = deliveryRecords.find(d => d.id === dr.deliveryRecordId);
      const order = salesOrders.find(o => o.id === dr.salesOrderId);
      const reporter = users.find(u => u.id === dr.reporterId);
      return { ...dr, delivery, order, reporter };
    });
}

export async function getProcessingDamageRecords() {
  return damageRecords
    .filter(dr => dr.status === 'processing')
    .map(dr => {
      const delivery = deliveryRecords.find(d => d.id === dr.deliveryRecordId);
      const order = salesOrders.find(o => o.id === dr.salesOrderId);
      const reporter = users.find(u => u.id === dr.reporterId);
      return { ...dr, delivery, order, reporter };
    });
}

export async function createDamageRecord(data) {
  const newRecord = {
    id: `DM${Date.now()}`,
    ...data,
    status: 'pending',
    reportedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    history: [],
  };
  
  damageRecords.push(newRecord);
  return newRecord;
}

export async function updateDamageRecord(id, data) {
  const index = damageRecords.findIndex(dr => dr.id === id);
  if (index === -1) return null;
  
  damageRecords[index] = {
    ...damageRecords[index],
    ...data,
  };
  
  return damageRecords[index];
}

export async function addDamageHistory(id, historyItem) {
  const index = damageRecords.findIndex(dr => dr.id === id);
  if (index === -1) return null;
  
  damageRecords[index].history.push(historyItem);
  return damageRecords[index];
}
