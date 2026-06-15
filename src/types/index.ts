export interface Remark {
  id: string;
  claimId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}

export interface Claim {
  id: string;
  orderId: string;
  vehicleId: string;
  customerName: string;
  customerPhone: string;
  damageDescription: string;
  damagePhotos: string[];
  responsibility: 'company' | 'customer' | 'third_party' | 'undetermined';
  status: 'pending' | 'processing' | 'review' | 'approved' | 'paid' | 'archived' | 'exception';
  remarks: Remark[];
  createdAt: Date;
  updatedAt: Date;
  exceptionReason?: string;
}

export interface Payment {
  id: string;
  claimId: string;
  amount: number;
  method: 'bank' | 'wechat' | 'alipay';
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  approvedAt?: Date;
  paidAt?: Date;
  remarks: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  addressFrom: string;
  addressTo: string;
  scheduledDate: Date;
  vehicleId: string;
  driverName: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  status: 'available' | 'assigned' | 'maintenance';
}

export type ClaimStatus = Claim['status'];
export type Responsibility = Claim['responsibility'];
export type PaymentMethod = Payment['method'];
export type PaymentStatus = Payment['status'];
