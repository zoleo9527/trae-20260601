import { getStorageData, setStorageData } from '../utils/storage';
import { generateId, getCurrentTime } from '../utils';

export class BaseService<T> {
  protected storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  protected getAll(): T[] {
    const data = getStorageData<T[]>(this.storageKey);
    return data || [];
  }

  protected saveAll(items: T[]): void {
    setStorageData(this.storageKey, items);
  }

  protected generateId(): string {
    return generateId();
  }

  protected getCurrentTime(): string {
    return getCurrentTime();
  }

  protected findById(items: T[], id: string, idField: string = 'id'): T | undefined {
    return items.find((item) => (item as Record<string, unknown>)[idField] === id);
  }

  protected filterItems(items: T[], filters: Record<string, unknown>): T[] {
    return items.filter((item) => {
      const recordItem = item as Record<string, unknown>;
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null || value === '') return true;
        return recordItem[key] === value;
      });
    });
  }

  protected paginate(items: T[], page: number = 1, pageSize: number = 10): { list: T[]; total: number; page: number; pageSize: number } {
    const total = items.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const list = items.slice(start, end);

    return {
      list,
      total,
      page,
      pageSize
    };
  }
}
