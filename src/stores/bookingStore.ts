import { create } from 'zustand';
import { Booking, BookingStatus, Room } from '../types';
import { storage, generateId } from '../utils/storage';
import { mockBookings, mockRooms } from '../data/mockData';
import { useAuditStore } from './auditStore';

interface BookingStore {
  bookings: Booking[];
  rooms: Room[];
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  updateBookingStatus: (id: string, status: BookingStatus, note?: string) => void;
  deleteBooking: (id: string) => void;
  getBookingById: (id: string) => Booking | undefined;
  getBookingsByRoom: (roomNumber: string) => Booking[];
  getBookingsByDate: (date: Date) => Booking[];
  checkRoomConflict: (roomNumber: string, startTime: string, endTime: string, excludeId?: string) => Booking[];
  getTodayBookings: () => Booking[];
}

const initialBookings = storage.get<Booking[]>('bookings', mockBookings);
const initialRooms = storage.get<Room[]>('rooms', mockRooms);

export const useBookingStore = create<BookingStore>((set, get) => ({
  bookings: initialBookings,
  rooms: initialRooms,
  
  addBooking: (bookingData) => {
    const now = new Date().toISOString();
    const booking: Booking = {
      ...bookingData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    const bookings = [...get().bookings, booking];
    set({ bookings });
    storage.set('bookings', bookings);
    
    useAuditStore.getState().addLog(
      'booking',
      booking.id,
      'create',
      undefined,
      booking as unknown as Record<string, unknown>,
      '创建预订'
    );
    
    return booking.id;
  },
  
  updateBooking: (id, updates) => {
    const bookings = get().bookings.map((b) => {
      if (b.id === id) {
        const updated = { ...b, ...updates, updatedAt: new Date().toISOString() };
        
        useAuditStore.getState().addLog(
          'booking',
          id,
          'update',
          b as unknown as Record<string, unknown>,
          updated as unknown as Record<string, unknown>
        );
        
        return updated;
      }
      return b;
    });
    set({ bookings });
    storage.set('bookings', bookings);
  },
  
  updateBookingStatus: (id, status, note) => {
    const bookings = get().bookings.map((b) => {
      if (b.id === id) {
        const beforeData = { status: b.status };
        const updated = { ...b, status, updatedAt: new Date().toISOString() };
        
        useAuditStore.getState().addLog(
          'booking',
          id,
          'status_change',
          beforeData,
          { status },
          note
        );
        
        return updated;
      }
      return b;
    });
    set({ bookings });
    storage.set('bookings', bookings);
  },
  
  deleteBooking: (id) => {
    const booking = get().bookings.find((b) => b.id === id);
    const bookings = get().bookings.filter((b) => b.id !== id);
    set({ bookings });
    storage.set('bookings', bookings);
    
    if (booking) {
      useAuditStore.getState().addLog(
        'booking',
        id,
        'delete',
        booking as unknown as Record<string, unknown>,
        undefined,
        '删除预订'
      );
    }
  },
  
  getBookingById: (id) => {
    return get().bookings.find((b) => b.id === id);
  },
  
  getBookingsByRoom: (roomNumber) => {
    return get().bookings.filter((b) => b.roomNumber === roomNumber)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  },
  
  getBookingsByDate: (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return get().bookings.filter((b) => {
      const bookingDate = b.startTime.split('T')[0];
      return bookingDate === dateStr;
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  },
  
  checkRoomConflict: (roomNumber, startTime, endTime, excludeId) => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    
    return get().bookings.filter((b) => {
      if (b.id === excludeId) return false;
      if (b.roomNumber !== roomNumber) return false;
      if (b.status === 'cancelled') return false;
      
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      
      return start < bEnd && end > bStart;
    });
  },
  
  getTodayBookings: () => {
    const today = new Date();
    return get().getBookingsByDate(today);
  },
}));
