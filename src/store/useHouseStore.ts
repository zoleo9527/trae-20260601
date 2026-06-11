import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { House, HouseFilters, HouseStatus } from '../types';
import { houses } from '../data';

interface HouseStore {
  houses: House[];
  filters: HouseFilters;
  selectedHouse: House | null;
  loading: boolean;
  filteredHouses: House[];
  setFilters: (filters: Partial<HouseFilters>) => void;
  resetFilters: () => void;
  setSelectedHouse: (house: House | null) => void;
  updateHouseStatus: (houseId: string, status: HouseStatus) => void;
  getHouseById: (id: string) => House | undefined;
  getHousesByStatus: (status: HouseStatus) => House[];
  setLoading: (loading: boolean) => void;
}

const defaultFilters: HouseFilters = {
  keyword: '',
  building: '',
  unit: '',
  floor: '',
  layout: '',
  status: undefined,
  minArea: undefined,
  maxArea: undefined,
  minPrice: undefined,
  maxPrice: undefined,
};

function filterHouses(houses: House[], filters: HouseFilters): House[] {
  return houses.filter((house) => {
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      const matchKeyword =
        house.houseNumber.toLowerCase().includes(keyword) ||
        house.building.toLowerCase().includes(keyword) ||
        house.layout.toLowerCase().includes(keyword);
      if (!matchKeyword) return false;
    }
    if (filters.building && house.building !== filters.building) return false;
    if (filters.unit && house.unit !== filters.unit) return false;
    if (filters.floor && house.floor !== filters.floor) return false;
    if (filters.layout && house.layout !== filters.layout) return false;
    if (filters.status && house.status !== filters.status) return false;
    if (filters.minArea !== undefined && house.area < filters.minArea) return false;
    if (filters.maxArea !== undefined && house.area > filters.maxArea) return false;
    if (filters.minPrice !== undefined && house.totalPrice < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && house.totalPrice > filters.maxPrice) return false;
    return true;
  });
}

export const useHouseStore = create<HouseStore>()(
  persist(
    (set, get) => ({
      houses,
      filters: defaultFilters,
      selectedHouse: null,
      loading: false,
      filteredHouses: houses,
      setFilters: (newFilters) => {
        const updatedFilters = { ...get().filters, ...newFilters };
        const filtered = filterHouses(get().houses, updatedFilters);
        set({ filters: updatedFilters, filteredHouses: filtered });
      },
      resetFilters: () => {
        set({ filters: defaultFilters, filteredHouses: get().houses });
      },
      setSelectedHouse: (house) => set({ selectedHouse: house }),
      updateHouseStatus: (houseId, status) => {
        const updatedHouses = get().houses.map((h) =>
          h.id === houseId ? { ...h, status } : h
        );
        const filtered = filterHouses(updatedHouses, get().filters);
        set({ houses: updatedHouses, filteredHouses: filtered });
      },
      getHouseById: (id) => get().houses.find((h) => h.id === id),
      getHousesByStatus: (status) => get().houses.filter((h) => h.status === status),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'house-store',
    }
  )
);
