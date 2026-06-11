import { House, HouseStatus } from '../types';
import { generateId } from '../utils/id';

const layouts = ['一室一厅', '两室一厅', '三室两厅', '四室两厅'];
const orientations = ['南北', '东西', '南', '北'];

function createHouse(
  building: string,
  unit: string,
  floor: string,
  room: string,
  layout: string,
  area: number,
  unitPrice: number,
  orientation: string,
  status: HouseStatus
): House {
  const houseNumber = `${building}-${unit}-${floor}${room.padStart(2, '0')}`;
  return {
    id: `h_${building}_${unit}_${floor}${room.padStart(2, '0')}`,
    houseNumber,
    building: `${building}号楼`,
    unit: `${unit}单元`,
    floor: `${floor}层`,
    room: `${room}室`,
    layout,
    area,
    unitPrice,
    totalPrice: Math.round(area * unitPrice),
    orientation,
    status,
  };
}

export const houses: House[] = [
  // 1号楼 - 10套
  createHouse('1', '1', '1', '1', '一室一厅', 60, 25000, '北', 'available'),
  createHouse('1', '1', '1', '2', '两室一厅', 80, 28000, '南', 'available'),
  createHouse('1', '1', '2', '1', '两室一厅', 85, 29000, '南北', 'locked'),
  createHouse('1', '1', '2', '2', '三室两厅', 120, 35000, '南北', 'available'),
  createHouse('1', '1', '3', '1', '三室两厅', 125, 36000, '南', 'sold'),
  createHouse('1', '1', '3', '2', '四室两厅', 160, 42000, '南北', 'available'),
  createHouse('1', '2', '1', '1', '一室一厅', 62, 26000, '北', 'available'),
  createHouse('1', '2', '1', '2', '两室一厅', 78, 27500, '南', 'locked'),
  createHouse('1', '2', '2', '1', '两室一厅', 82, 29500, '东西', 'available'),
  createHouse('1', '2', '2', '2', '三室两厅', 118, 34500, '南北', 'reserved'),

  // 2号楼 - 10套
  createHouse('2', '1', '1', '1', '两室一厅', 85, 29000, '南', 'available'),
  createHouse('2', '1', '1', '2', '三室两厅', 120, 35500, '南北', 'locked'),
  createHouse('2', '1', '2', '1', '三室两厅', 125, 36500, '南北', 'available'),
  createHouse('2', '1', '2', '2', '四室两厅', 165, 43000, '南', 'sold'),
  createHouse('2', '1', '3', '1', '四室两厅', 170, 44000, '南北', 'available'),
  createHouse('2', '1', '3', '2', '一室一厅', 65, 26500, '北', 'available'),
  createHouse('2', '2', '1', '1', '两室一厅', 80, 28500, '东西', 'locked'),
  createHouse('2', '2', '1', '2', '三室两厅', 115, 34000, '南', 'available'),
  createHouse('2', '2', '2', '1', '三室两厅', 122, 35800, '南北', 'sold'),
  createHouse('2', '2', '2', '2', '四室两厅', 158, 41500, '南', 'locked'),

  // 3号楼 - 10套
  createHouse('3', '1', '1', '1', '一室一厅', 63, 25800, '北', 'available'),
  createHouse('3', '1', '1', '2', '两室一厅', 88, 29800, '南', 'available'),
  createHouse('3', '1', '2', '1', '两室一厅', 83, 28800, '南北', 'locked'),
  createHouse('3', '1', '2', '2', '三室两厅', 128, 37000, '南北', 'available'),
  createHouse('3', '1', '3', '1', '三室两厅', 130, 37500, '南', 'sold'),
  createHouse('3', '1', '3', '2', '四室两厅', 175, 45000, '南北', 'locked'),
  createHouse('3', '2', '1', '1', '一室一厅', 61, 25500, '北', 'available'),
  createHouse('3', '2', '1', '2', '两室一厅', 79, 28200, '东西', 'sold'),
  createHouse('3', '2', '2', '1', '两室一厅', 86, 29200, '南', 'locked'),
  createHouse('3', '2', '2', '2', '三室两厅', 180, 38000, '南北', 'reserved'),
];

export const getHouseById = (id: string): House | undefined => {
  return houses.find(h => h.id === id);
};

export const getHousesByBuilding = (building: string): House[] => {
  return houses.filter(h => h.building === building);
};

export const getHousesByStatus = (status: HouseStatus): House[] => {
  return houses.filter(h => h.status === status);
};

export const getHousesByLayout = (layout: string): House[] => {
  return houses.filter(h => h.layout === layout);
};
