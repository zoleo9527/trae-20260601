import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { Accommodation } from '../types';
import { STORAGE_KEYS } from '../constants';
import { getFromStorage, setToStorage, generateId } from '../storage';

function createAccommodationStore() {
  const initial: Accommodation[] = browser ? getFromStorage(STORAGE_KEYS.ACCOMMODATIONS, []) : [];
  
  const { subscribe, set, update } = writable<Accommodation[]>(initial);
  
  return {
    subscribe,
    init: () => {
      if (browser) {
        const data = getFromStorage(STORAGE_KEYS.ACCOMMODATIONS, []);
        set(data);
      }
    },
    add: (accommodation: Omit<Accommodation, 'id' | 'created_at' | 'updated_at'>) => {
      update(items => {
        const newAccommodation: Accommodation = {
          ...accommodation,
          id: generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const updated = [...items, newAccommodation];
        if (browser) setToStorage(STORAGE_KEYS.ACCOMMODATIONS, updated);
        return updated;
      });
    },
    checkOut: (id: string) => {
      update(items => {
        const updated = items.map(item => {
          if (item.id === id) {
            return {
              ...item,
              status: 'checked_out',
              check_out_time: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          }
          return item;
        });
        if (browser) setToStorage(STORAGE_KEYS.ACCOMMODATIONS, updated);
        return updated;
      });
    },
    getById: (id: string) => {
      let result: Accommodation | undefined;
      subscribe(items => {
        result = items.find(item => item.id === id);
      })();
      return result;
    }
  };
}

export const accommodations = createAccommodationStore();

export const checkedInAccommodations = derived(accommodations, $accommodations => 
  $accommodations.filter(a => a.status === 'checked_in')
);

export const checkedOutAccommodations = derived(accommodations, $accommodations => 
  $accommodations.filter(a => a.status === 'checked_out')
);