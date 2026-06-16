import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import type { Inventory, InventoryEstimate } from '../types';
import { STORAGE_KEYS } from '../constants';
import { getFromStorage, setToStorage, generateId } from '../storage';

function createInventoryStore() {
  const initial: Inventory[] = browser ? getFromStorage(STORAGE_KEYS.INVENTORY, []) : [];
  
  const { subscribe, set, update } = writable<Inventory[]>(initial);
  
  return {
    subscribe,
    init: () => {
      if (browser) {
        const data = getFromStorage(STORAGE_KEYS.INVENTORY, []);
        set(data);
      }
    },
    updateQuantity: (id: string, quantity: number) => {
      update(items => {
        const updated = items.map(item => {
          if (item.id === id) {
            return {
              ...item,
              current_quantity: quantity,
              last_updated: new Date().toISOString()
            };
          }
          return item;
        });
        if (browser) setToStorage(STORAGE_KEYS.INVENTORY, updated);
        return updated;
      });
    },
    add: (inventory: Omit<Inventory, 'id' | 'last_updated'>) => {
      update(items => {
        const newInventory: Inventory = {
          ...inventory,
          id: generateId(),
          last_updated: new Date().toISOString()
        };
        const updated = [...items, newInventory];
        if (browser) setToStorage(STORAGE_KEYS.INVENTORY, updated);
        return updated;
      });
    },
    getById: (id: string) => {
      let result: Inventory | undefined;
      subscribe(items => {
        result = items.find(item => item.id === id);
      })();
      return result;
    }
  };
}

export const inventory = createInventoryStore();

export const lowInventory = derived(inventory, $inventory => 
  $inventory.filter(i => i.current_quantity <= i.warning_threshold)
);

export const inventoryEstimates = derived(inventory, $inventory => {
  const estimates: InventoryEstimate[] = [];
  
  $inventory.forEach(item => {
    if (item.current_quantity <= item.warning_threshold) {
      const needed = item.warning_threshold * 2 - item.current_quantity;
      estimates.push({
        id: generateId(),
        ingredient_name: item.ingredient_name,
        estimated_consumption: needed,
        reason: `当前库存${item.current_quantity}${item.unit}，低于预警阈值${item.warning_threshold}${item.unit}`,
        created_at: new Date().toISOString()
      });
    }
  });
  
  return estimates;
});