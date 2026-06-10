import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Shelter } from '@/types';
import { shelterList } from '@/mock/data';

export const useSheltersStore = defineStore('shelters', () => {
  const shelters = ref<Shelter[]>(JSON.parse(JSON.stringify(shelterList)));

  const readyCount = computed(() => shelters.value.filter((s) => s.status === 'READY').length);
  const abnormalCount = computed(() => shelters.value.filter((s) => s.status === 'ABNORMAL').length);
  const harvestedCount = computed(() => shelters.value.filter((s) => s.status === 'HARVESTED').length);
  const immatureCount = computed(() => shelters.value.filter((s) => s.status === 'IMMATURE').length);

  function getShelterById(id: string) {
    return shelters.value.find((s) => s.id === id);
  }

  function harvestShelter(id: string, qty: number) {
    const s = getShelterById(id);
    if (!s) return;
    s.availableQty = Math.max(0, s.availableQty - qty);
    if (s.availableQty === 0) {
      s.status = 'HARVESTED';
      const pad = (n: number) => n.toString().padStart(2, '0');
      const now = new Date();
      s.actualDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    }
  }

  return {
    shelters,
    readyCount,
    abnormalCount,
    harvestedCount,
    immatureCount,
    getShelterById,
    harvestShelter,
  };
});
