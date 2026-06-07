import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StorageItem, HistoryNote, TemperatureRecord, BackupRecord } from '@/types';
import { mockStorageItems } from '@/data/mockData';
import dayjs from 'dayjs';

interface StoreState {
  items: StorageItem[];
  backups: BackupRecord[];
  currentUser: string;
  
  addItem: (item: Omit<StorageItem, 'id' | 'temperatureRecords' | 'historyNotes'>) => void;
  updateItem: (id: string, updates: Partial<StorageItem>) => void;
  getItemById: (id: string) => StorageItem | undefined;
  
  addTemperatureRecord: (storageId: string, record: Omit<TemperatureRecord, 'id' | 'storageId'>) => void;
  addTemperatureRecordWithAbnormal: (
    storageId: string,
    record: Omit<TemperatureRecord, 'id' | 'storageId'>,
    abnormalDescription?: string
  ) => void;
  addHistoryNote: (storageId: string, note: Omit<HistoryNote, 'id' | 'storageId'>) => void;
  
  markAsAbnormal: (id: string, description: string) => void;
  markAsCompleted: (id: string) => void;
  
  createBackup: (description: string) => void;
  restoreFromBackup: (backupId: string) => void;
  deleteBackup: (backupId: string) => void;
  exportBackup: (backupId: string) => void;
  importBackup: (file: File) => Promise<void>;
  
  resetData: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 10);

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      items: mockStorageItems,
      backups: [],
      currentUser: '张建国',

      addItem: (itemData) => {
        const newItem: StorageItem = {
          ...itemData,
          id: `RK${dayjs().format('YYYYMMDD')}${String(get().items.length + 1).padStart(3, '0')}`,
          temperatureRecords: [
            {
              id: generateId(),
              storageId: '',
              timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
              temperature: itemData.initialTemperature,
              status: 'normal',
              recordedBy: get().currentUser,
              remark: '入库初始温度检测',
            },
          ],
          historyNotes: [
            {
              id: generateId(),
              storageId: '',
              timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
              operator: get().currentUser,
              action: '入库登记',
              content: `${itemData.productName} ${itemData.quantity}${itemData.unit}入库，来源：${itemData.source}`,
            },
          ],
        };
        newItem.temperatureRecords[0].storageId = newItem.id;
        newItem.historyNotes[0].storageId = newItem.id;
        
        set((state) => ({
          items: [newItem, ...state.items],
        }));
      },

      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },

      getItemById: (id) => {
        return get().items.find((item) => item.id === id);
      },

      addTemperatureRecord: (storageId, record) => {
        const newRecord: TemperatureRecord = {
          ...record,
          id: generateId(),
          storageId,
        };
        
        set((state) => ({
          items: state.items.map((item) =>
            item.id === storageId
              ? {
                  ...item,
                  currentTemperature: record.temperature,
                  temperatureRecords: [...item.temperatureRecords, newRecord],
                }
              : item
          ),
        }));
      },

      addTemperatureRecordWithAbnormal: (storageId, record, abnormalDescription) => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        const newRecord: TemperatureRecord = {
          ...record,
          id: generateId(),
          storageId,
        };
        
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== storageId) return item;
            
            const isAbnormal = record.status === 'warning' || record.status === 'critical';
            const shouldUpdateAbnormal = isAbnormal && abnormalDescription;
            
            const updatedItem = {
              ...item,
              currentTemperature: record.temperature,
              temperatureRecords: [...item.temperatureRecords, newRecord],
            };
            
            if (shouldUpdateAbnormal) {
              return {
                ...updatedItem,
                status: 'abnormal' as const,
                abnormalDescription,
                abnormalTime: now,
                handler: get().currentUser,
                historyNotes: [
                  ...item.historyNotes,
                  {
                    id: generateId(),
                    storageId,
                    timestamp: now,
                    operator: get().currentUser,
                    action: '温度异常',
                    content: abnormalDescription,
                  },
                ],
              };
            }
            
            return updatedItem;
          }),
        }));
      },

      addHistoryNote: (storageId, note) => {
        const newNote: HistoryNote = {
          ...note,
          id: generateId(),
          storageId,
        };
        
        set((state) => ({
          items: state.items.map((item) =>
            item.id === storageId
              ? { ...item, historyNotes: [...item.historyNotes, newNote] }
              : item
          ),
        }));
      },

      markAsAbnormal: (id, description) => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: 'abnormal',
                  abnormalDescription: description,
                  abnormalTime: now,
                  handler: get().currentUser,
                  historyNotes: [
                    ...item.historyNotes,
                    {
                      id: generateId(),
                      storageId: id,
                      timestamp: now,
                      operator: get().currentUser,
                      action: '异常标记',
                      content: description,
                    },
                  ],
                }
              : item
          ),
        }));
      },

      markAsCompleted: (id) => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: 'completed',
                  completeTime: now,
                  historyNotes: [
                    ...item.historyNotes,
                    {
                      id: generateId(),
                      storageId: id,
                      timestamp: now,
                      operator: get().currentUser,
                      action: '处理完成',
                      content: '该批次产品储存周期正常，所有记录完整，已标记为完成。',
                    },
                  ],
                }
              : item
          ),
        }));
      },

      createBackup: (description) => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        const items = get().items;
        const recordCount = items.reduce(
          (sum, item) => sum + item.temperatureRecords.length + item.historyNotes.length,
          0
        );
        
        const newBackup: BackupRecord = {
          id: generateId(),
          name: `备份-${dayjs().format('YYYYMMDD-HHmmss')}`,
          timestamp: now,
          description,
          itemCount: items.length,
          recordCount,
        };
        
        const backupData = {
          metadata: newBackup,
          items: items,
        };
        
        const backups = JSON.parse(localStorage.getItem('cold-storage-backups') || '[]');
        backups.push(backupData);
        localStorage.setItem('cold-storage-backups', JSON.stringify(backups));
        
        set((state) => ({
          backups: [...state.backups, newBackup],
        }));
      },

      restoreFromBackup: (backupId) => {
        const backups = JSON.parse(localStorage.getItem('cold-storage-backups') || '[]');
        const backup = backups.find((b: any) => b.metadata.id === backupId);
        
        if (backup) {
          set({
            items: backup.items,
          });
          
          get().addHistoryNote(backup.items[0]?.id || '', {
            timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            operator: get().currentUser,
            action: '数据恢复',
            content: `从备份"${backup.metadata.name}"恢复数据`,
          });
        }
      },

      deleteBackup: (backupId) => {
        const backups = JSON.parse(localStorage.getItem('cold-storage-backups') || '[]');
        const filtered = backups.filter((b: any) => b.metadata.id !== backupId);
        localStorage.setItem('cold-storage-backups', JSON.stringify(filtered));
        
        set((state) => ({
          backups: state.backups.filter((b) => b.id !== backupId),
        }));
      },

      exportBackup: (backupId) => {
        const backups = JSON.parse(localStorage.getItem('cold-storage-backups') || '[]');
        const backup = backups.find((b: any) => b.metadata.id === backupId);
        
        if (backup) {
          const blob = new Blob([JSON.stringify(backup, null, 2)], {
            type: 'application/json',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${backup.metadata.name}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }
      },

      importBackup: async (file) => {
        const text = await file.text();
        const backup = JSON.parse(text);
        
        if (backup.metadata && backup.items) {
          const backups = JSON.parse(localStorage.getItem('cold-storage-backups') || '[]');
          backup.metadata.id = generateId();
          backups.push(backup);
          localStorage.setItem('cold-storage-backups', JSON.stringify(backups));
          
          set((state) => ({
            backups: [...state.backups, backup.metadata],
          }));
        }
      },

      resetData: () => {
        set({
          items: mockStorageItems,
        });
      },
    }),
    {
      name: 'cold-storage-tracker',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
