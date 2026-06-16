import { browser } from '$app/environment';
import { bookings } from './bookings';
import { procurements } from './procurements';
import { accommodations } from './accommodations';
import { inventory } from './inventory';
import { alerts } from './alerts';
import { USERS } from '../constants';

export function initializeSampleData() {
  if (!browser) return;
  
  const allBookings = bookings.getAll();
  if (allBookings.length === 0) {
    const booking1 = {
      customer_name: '张先生',
      phone: '13800138001',
      booking_time: new Date().toISOString(),
      guest_count: 8,
      room_number: '包间A',
      status: 'pending' as const,
      handler: USERS.MAID
    };
    bookings.add(booking1);
    
    const booking2 = {
      customer_name: '李女士',
      phone: '13900139002',
      booking_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      guest_count: 6,
      room_number: '包间B',
      status: 'confirmed' as const,
      handler: USERS.BOSS
    };
    bookings.add(booking2);
  }
  
  const allProcurements = procurements.getAll();
  if (allProcurements.length === 0) {
    const procurement1 = {
      applicant: USERS.KITCHEN,
      apply_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      approver: null,
      approve_time: null,
      status: 'pending' as const,
      items: [
        { ingredient_name: '土鸡', quantity: 10, unit: '斤', note: '散养土鸡' },
        { ingredient_name: '新鲜蔬菜', quantity: 20, unit: '斤', note: '时令蔬菜' }
      ]
    };
    procurements.add(procurement1);
    
    const procurement2 = {
      applicant: USERS.KITCHEN,
      apply_time: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      approver: USERS.BOSS,
      approve_time: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
      status: 'purchasing' as const,
      items: [
        { ingredient_name: '猪肉', quantity: 15, unit: '斤', note: '新鲜猪肉' }
      ]
    };
    procurements.add(procurement2);
  }
  
  const allAccommodations = accommodations.getAll();
  if (allAccommodations.length === 0) {
    const acc1 = {
      guest_name: '王先生',
      phone: '13700137003',
      room_number: '客房101',
      check_in_time: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      check_out_time: null,
      status: 'checked_in' as const,
      handler: USERS.MAID
    };
    accommodations.add(acc1);
    
    const acc2 = {
      guest_name: '赵女士',
      phone: '13600136004',
      room_number: '客房102',
      check_in_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      check_out_time: null,
      status: 'checked_in' as const,
      handler: USERS.MAID
    };
    accommodations.add(acc2);
  }
  
  const allInventory = inventory.getAll();
  if (allInventory.length === 0) {
    inventory.add({
      ingredient_name: '土鸡',
      current_quantity: 5,
      unit: '斤',
      warning_threshold: 10,
      last_updated: new Date().toISOString()
    });
    
    inventory.add({
      ingredient_name: '新鲜蔬菜',
      current_quantity: 8,
      unit: '斤',
      warning_threshold: 15,
      last_updated: new Date().toISOString()
    });
    
    inventory.add({
      ingredient_name: '猪肉',
      current_quantity: 20,
      unit: '斤',
      warning_threshold: 10,
      last_updated: new Date().toISOString()
    });
  }
  
  setTimeout(() => {
    createAlertsWithRelatedIds();
  }, 100);
}

function createAlertsWithRelatedIds() {
  const allBookings = bookings.getAll();
  const allProcurements = procurements.getAll();
  const allAccommodations = accommodations.getAll();
  
  if (allBookings.length > 0 && !alerts.getById('alert-booking-1')) {
    const pendingBooking = allBookings.find(b => b.status === 'pending');
    if (pendingBooking) {
      alerts.add({
        title: '预订待确认',
        description: `${pendingBooking.customer_name} 的预订等待确认，包间：${pendingBooking.room_number}`,
        severity: 'medium',
        type: 'booking',
        related_id: pendingBooking.id,
        status: 'active'
      });
    }
  }
  
  if (allProcurements.length > 0 && !alerts.getById('alert-procurement-1')) {
    const pendingProc = allProcurements.find(p => p.status === 'pending');
    if (pendingProc) {
      alerts.add({
        title: '采购申请待审批',
        description: `${pendingProc.applicant} 提交的采购申请（${pendingProc.items.length}项食材）等待审批`,
        severity: 'high',
        type: 'procurement',
        related_id: pendingProc.id,
        status: 'active'
      });
    }
    
    const purchasingProc = allProcurements.find(p => p.status === 'purchasing');
    if (purchasingProc) {
      alerts.add({
        title: '采购进行中',
        description: `采购单正在执行，包含${purchasingProc.items.length}项食材`,
        severity: 'low',
        type: 'procurement',
        related_id: purchasingProc.id,
        status: 'active'
      });
    }
  }
  
  if (allAccommodations.length > 0 && !alerts.getById('alert-accommodation-1')) {
    const checkedInAcc = allAccommodations.find(a => a.status === 'checked_in');
    if (checkedInAcc) {
      alerts.add({
        title: '客房入住提醒',
        description: `${checkedInAcc.guest_name} 已入住 ${checkedInAcc.room_number}`,
        severity: 'low',
        type: 'accommodation',
        related_id: checkedInAcc.id,
        status: 'active'
      });
    }
  }
  
  if (!alerts.getById('alert-inventory-1')) {
    alerts.add({
      title: '库存不足预警',
      description: '土鸡库存仅剩5斤，低于预警阈值10斤',
      severity: 'high',
      type: 'inventory',
      related_id: '',
      status: 'active'
    });
  }
}