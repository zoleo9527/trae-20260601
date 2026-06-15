import { deliveryRecords, salesOrders } from '~/data/mockData';

export async function getDeliveryRecords() {
  return deliveryRecords.map(dr => {
    const order = salesOrders.find(o => o.id === dr.salesOrderId);
    return { ...dr, order };
  });
}

export async function getDeliveryRecordById(id) {
  const dr = deliveryRecords.find(r => r.id === id);
  if (!dr) return null;
  const order = salesOrders.find(o => o.id === dr.salesOrderId);
  return { ...dr, order };
}

export async function getPendingDeliveries() {
  return deliveryRecords
    .filter(dr => dr.status === 'pending')
    .map(dr => {
      const order = salesOrders.find(o => o.id === dr.salesOrderId);
      return { ...dr, order };
    });
}

export async function getDeliveriesInTransit() {
  return deliveryRecords
    .filter(dr => dr.status === 'in_transit')
    .map(dr => {
      const order = salesOrders.find(o => o.id === dr.salesOrderId);
      return { ...dr, order };
    });
}

export async function updateDeliveryStatus(id, status, data = {}) {
  const index = deliveryRecords.findIndex(dr => dr.id === id);
  if (index === -1) return null;
  
  deliveryRecords[index] = {
    ...deliveryRecords[index],
    status,
    ...data,
  };
  
  return deliveryRecords[index];
}
