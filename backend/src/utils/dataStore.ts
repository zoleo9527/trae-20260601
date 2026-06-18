import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');

export class DataStore {
  private cache: Map<string, any> = new Map();

  async read<T>(filename: string): Promise<T> {
    if (this.cache.has(filename)) {
      return this.cache.get(filename);
    }

    const filePath = path.join(DATA_DIR, filename);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      this.cache.set(filename, parsed);
      return parsed as T;
    } catch (error) {
      return [] as T;
    }
  }

  async write<T>(filename: string, data: T): Promise<void> {
    const filePath = path.join(DATA_DIR, filename);
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    this.cache.set(filename, data);
  }

  async update<T>(
    filename: string,
    predicate: (item: T) => boolean,
    updater: (item: T) => T
  ): Promise<T | null> {
    const data = await this.read<T[]>(filename);
    const index = data.findIndex(predicate);

    if (index === -1) return null;

    data[index] = updater(data[index]);
    await this.write(filename, data);

    return data[index];
  }

  async find<T>(
    filename: string,
    predicate: (item: T) => boolean
  ): Promise<T | null> {
    const data = await this.read<T[]>(filename);
    return data.find(predicate) || null;
  }

  async findAll<T>(
    filename: string,
    predicate?: (item: T) => boolean
  ): Promise<T[]> {
    const data = await this.read<T[]>(filename);
    return predicate ? data.filter(predicate) : data;
  }

  async create<T extends { id: string }>(
    filename: string,
    item: T
  ): Promise<T> {
    const data = await this.read<T[]>(filename);
    data.push(item);
    await this.write(filename, data);
    return item;
  }

  async delete<T>(
    filename: string,
    predicate: (item: T) => boolean
  ): Promise<boolean> {
    const data = await this.read<T[]>(filename);
    const index = data.findIndex(predicate);

    if (index === -1) return false;

    data.splice(index, 1);
    await this.write(filename, data);
    return true;
  }
}

export const dataStore = new DataStore();
