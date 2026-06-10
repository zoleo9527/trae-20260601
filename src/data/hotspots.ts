import type { Hotspot } from '../types';

export const hotspots: Hotspot[] = [
  {
    id: 'HS-001',
    name: '中关村大街商圈',
    center: { lat: 39.9842, lng: 116.3074 },
    radius: 500,
    complaintCount: 12,
    complaintIds: ['CMP-2026-001', 'CMP-2026-005', 'CMP-2026-007'],
    trend: 'rising'
  },
  {
    id: 'HS-002',
    name: '西二旗地铁站',
    center: { lat: 40.0499, lng: 116.3013 },
    radius: 300,
    complaintCount: 8,
    complaintIds: ['CMP-2026-002'],
    trend: 'stable'
  },
  {
    id: 'HS-003',
    name: '王府井商业街',
    center: { lat: 39.9087, lng: 116.3912 },
    radius: 400,
    complaintCount: 5,
    complaintIds: ['CMP-2026-003'],
    trend: 'declining'
  },
  {
    id: 'HS-004',
    name: '国贸CBD',
    center: { lat: 39.9087, lng: 116.4500 },
    radius: 600,
    complaintCount: 7,
    complaintIds: ['CMP-2026-004'],
    trend: 'rising'
  },
  {
    id: 'HS-005',
    name: '五道口地铁站',
    center: { lat: 39.9929, lng: 116.3386 },
    radius: 350,
    complaintCount: 4,
    complaintIds: ['CMP-2026-008'],
    trend: 'declining'
  }
];

export const getHotspotById = (id: string): Hotspot | undefined => {
  return hotspots.find(h => h.id === id);
};
