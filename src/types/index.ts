export interface BookingRecord {
  id: number;
  booking_no: string;
  court_id: number;
  court_name: string;
  coach_id?: number;
  coach_name?: string;
  member_id?: number;
  member_name?: string;
  member_card_no?: string;
  booker_name: string;
  booker_phone: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  status_text: string;
  created_by: string;
  created_at: string;
  return_reason?: string;
  return_by?: string;
  return_at?: string;
  supplement_note?: string;
  supplement_by?: string;
  supplement_at?: string;
  review_result?: string;
  review_note?: string;
  review_by?: string;
  review_at?: string;
  verify_status?: string;
  verify_card_no?: string;
  verify_balance_before?: number;
  verify_balance_after?: number;
  verify_amount?: number;
  verify_by?: string;
  verify_at?: string;
  liability_flag?: string;
  remark?: string;
}

export interface CreateBooking {
  court_id: number;
  coach_id?: number;
  member_id?: number;
  booker_name: string;
  booker_phone: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  created_by: string;
  remark?: string;
}

export interface BookingFilter {
  status?: string;
  date_from?: string;
  date_to?: string;
  court_id?: number;
  keyword?: string;
}

export interface BookingSupplement {
  supplement_note: string;
  member_id?: number;
  coach_id?: number;
}



export interface TodoItem {
  id: number;
  booking_no: string;
  title: string;
  desc: string;
  status: string;
  priority: string;
  created_at: string;
}

export interface TodoList {
  pending: TodoItem[];
  in_progress: TodoItem[];
  today_count: number;
  total_count: number;
}

export interface Court {
  id: number;
  name: string;
  court_type: string;
  price_per_hour: number;
}

export interface Coach {
  id: number;
  name: string;
  phone: string;
  specialty: string;
}

export interface MemberCard {
  id: number;
  card_no: string;
  member_name: string;
  phone: string;
  balance: number;
  card_type: string;
}

export type RoleType = 'reception' | 'coach' | 'manager';
