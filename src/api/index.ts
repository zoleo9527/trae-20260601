import { invoke } from '@tauri-apps/api/tauri';
import type {
  BookingRecord,
  CreateBooking,
  BookingFilter,
  BookingSupplement,
  MemberVerify,
  TodoList,
  Court,
  Coach,
  MemberCard,
} from '../types';

export const api = {
  createBooking: (data: CreateBooking): Promise<BookingRecord> =>
    invoke('create_booking', { booking: data }),

  getBookings: (filter: BookingFilter): Promise<BookingRecord[]> =>
    invoke('get_bookings', { filter }),

  getBookingById: (id: number): Promise<BookingRecord> =>
    invoke('get_booking_by_id', { id }),

  returnBooking: (id: number, reason: string, operator: string): Promise<BookingRecord> =>
    invoke('return_booking', { id, reason, operator }),

  supplementBooking: (id: number, supplement: BookingSupplement, operator: string): Promise<BookingRecord> =>
    invoke('supplement_booking', { id, supplement, operator }),

  reviewBooking: (id: number, approved: boolean, reviewNote: string | null, operator: string): Promise<BookingRecord> =>
    invoke('review_booking', { id, approved, reviewNote: reviewNote || undefined, operator }),

  verifyMember: (id: number, verify: MemberVerify, operator: string): Promise<BookingRecord> =>
    invoke('verify_member', { id, verify, operator }),

  getTodos: (role: string): Promise<TodoList> =>
    invoke('get_todos', { role }),

  getCourts: (): Promise<Court[]> =>
    invoke('get_courts'),

  getCoaches: (): Promise<Coach[]> =>
    invoke('get_coaches'),

  getMembers: (): Promise<MemberCard[]> =>
    invoke('get_members'),

  getVerificationHistory: (): Promise<BookingRecord[]> =>
    invoke('get_verification_history'),
};
