import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { Booking, BookingStatus } from '../types';
import { STORAGE_KEYS, BOOKING_STATUS_LABELS } from '../constants';
import { getFromStorage, setToStorage, generateId } from '../storage';
import { notifications } from './notifications';

function createBookingStore() {
  const initial: Booking[] = browser ? getFromStorage(STORAGE_KEYS.BOOKINGS, []) : [];
  
  const { subscribe, set, update } = writable<Booking[]>(initial);
  
  return {
    subscribe,
    init: () => {
      if (browser) {
        const data = getFromStorage(STORAGE_KEYS.BOOKINGS, []);
        set(data);
      }
    },
    add: (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at' | 'status_history'>) => {
      update(items => {
        const newBooking: Booking = {
          ...booking,
          id: generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status_history: [
            {
              id: generateId(),
              booking_id: '',
              status: booking.status,
              handler: booking.handler,
              note: '创建预订',
              created_at: new Date().toISOString()
            }
          ]
        };
        newBooking.status_history[0].booking_id = newBooking.id;
        const updated = [...items, newBooking];
        if (browser) setToStorage(STORAGE_KEYS.BOOKINGS, updated);
        return updated;
      });
    },
    updateStatus: (id: string, status: Booking['status'], handler: string, note: string) => {
      update(items => {
        const updated = items.map(item => {
          if (item.id === id) {
            const newStatus: BookingStatus = {
              id: generateId(),
              booking_id: id,
              status,
              handler,
              note,
              created_at: new Date().toISOString()
            };
            
            if (browser) {
              notifications.add({
                title: '预订状态更新',
                content: `${item.customer_name} 的预订状态已更新为 ${BOOKING_STATUS_LABELS[status]}，处理人：${handler}`,
                type: 'info'
              });
            }
            
            return {
              ...item,
              status,
              handler,
              updated_at: new Date().toISOString(),
              status_history: [...item.status_history, newStatus]
            };
          }
          return item;
        });
        if (browser) setToStorage(STORAGE_KEYS.BOOKINGS, updated);
        return updated;
      });
    },
    getById: (id: string) => {
      let result: Booking | undefined;
      subscribe(items => {
        result = items.find(item => item.id === id);
      })();
      return result;
    },
    getAll: () => {
      let result: Booking[] = [];
      subscribe(items => {
        result = items;
      })();
      return result;
    }
  };
}

export const bookings = createBookingStore();

export const pendingBookings = derived(bookings, $bookings => 
  $bookings.filter(b => b.status === 'pending')
);

export const activeBookings = derived(bookings, $bookings => 
  $bookings.filter(b => ['confirmed', 'arrived', 'dining', 'billing'].includes(b.status))
);

export const completedBookings = derived(bookings, $bookings => 
  $bookings.filter(b => b.status === 'completed')
);