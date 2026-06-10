export type ComplaintStatus = 'pending' | 'assigned' | 'processing' | 'completed' | 'closed';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ComplaintSource = '12345热线' | '城市管理局' | '市民APP' | '巡查发现';

export type HotspotTrend = 'rising' | 'stable' | 'declining';

export interface Location {
  lat: number;
  lng: number;
  address: string;
  accuracy?: number;
  offset?: boolean;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  source: ComplaintSource;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  location: Location;
  bikeId: string;
  createTime: string;
  assignTime?: string;
  arriveTime?: string;
  processTime?: string;
  closeTime?: string;
  assignee?: string;
  photos: {
    before?: string[];
    after?: string[];
  };
  processNote?: string;
  closeReason?: string;
  repeatCount?: number;
  hotspotId?: string;
}

export interface Hotspot {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radius: number;
  complaintCount: number;
  complaintIds: string[];
  trend: HotspotTrend;
}

export interface TimelineNode {
  type: 'report' | 'assign' | 'arrive' | 'process' | 'close';
  title: string;
  description?: string;
  time: string;
  operator?: string;
  completed: boolean;
}

export type UserRole = 'dispatcher' | 'inspector' | 'manager';
