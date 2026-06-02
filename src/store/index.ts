import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  User,
  Child,
  DailyRecord,
  Message,
  Photo,
  HealthAlert,
  Class,
  UserRole,
  QuickRecordForm,
} from '../types';
import { mockUsers } from '../data/mockUsers';
import { mockChildren } from '../data/mockChildren';
import { mockClasses } from '../data/mockClasses';
import { mockRecords } from '../data/mockRecords';
import { mockMessages } from '../data/mockMessages';
import { mockPhotos } from '../data/mockPhotos';
import { mockHealthAlerts } from '../data/mockHealthAlerts';

function getLocalDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isRecordToday(timeStr: string): boolean {
  const recordDate = new Date(timeStr);
  const today = new Date();
  return getLocalDateStr(recordDate) === getLocalDateStr(today);
}

function getTimeMs(timeStr: string): number {
  return new Date(timeStr).getTime();
}

function sortByTimeDesc<T extends { time?: string; timestamp?: string }>(
  items: T[],
  timeKey: 'time' | 'timestamp' = 'time'
): T[] {
  return [...items].sort((a, b) => {
    const timeA = getTimeMs((a[timeKey] as string) || '');
    const timeB = getTimeMs((b[timeKey] as string) || '');
    return timeB - timeA;
  });
}

function sortByTimeAsc<T extends { time?: string; timestamp?: string }>(
  items: T[],
  timeKey: 'time' | 'timestamp' = 'time'
): T[] {
  return [...items].sort((a, b) => {
    const timeA = getTimeMs((a[timeKey] as string) || '');
    const timeB = getTimeMs((b[timeKey] as string) || '');
    return timeA - timeB;
  });
}

interface AppState {
  currentUser: User | null;
  users: User[];
  classes: Class[];
  children: Child[];
  records: DailyRecord[];
  messages: Message[];
  photos: Photo[];
  healthAlerts: HealthAlert[];

  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;

  getChildrenByClass: (classId: string) => Child[];
  getChildById: (id: string) => Child | undefined;
  getRecordsByChild: (childId: string) => DailyRecord[];
  getMessagesByChild: (childId: string) => Message[];
  getPhotosByChild: (childId: string) => Photo[];
  getHealthAlertsByChild: (childId: string) => HealthAlert[];
  getClassById: (id: string) => Class | undefined;

  addRecord: (record: QuickRecordForm) => void;
  sendMessage: (childId: string, content: string, senderName: string) => void;
  markMessageAsRead: (messageId: string) => void;
  markAllMessagesAsRead: (childId: string) => void;

  getUnreadMessageCount: (childId?: string) => number;
  getPendingReplyCount: () => number;
  getWarningRecordsCount: () => number;
  getChildrenWithWarnings: () => Child[];
  getHighPriorityMessages: () => Message[];
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: mockUsers,
      classes: mockClasses,
      children: mockChildren,
      records: mockRecords,
      messages: mockMessages,
      photos: mockPhotos,
      healthAlerts: mockHealthAlerts,

      login: async (username, password) => {
        const user = get().users.find(
          (u) => u.name === username && u.password === password
        );
        if (user) {
          set({ currentUser: user });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ currentUser: null });
      },

      getChildrenByClass: (classId) => {
        return get().children.filter((c) => c.classId === classId);
      },

      getChildById: (id) => {
        return get().children.find((c) => c.id === id);
      },

      getRecordsByChild: (childId) => {
        return sortByTimeDesc(
          get().records.filter((r) => r.childId === childId)
        );
      },

      getMessagesByChild: (childId) => {
        return sortByTimeAsc(
          get().messages.filter((m) => m.childId === childId),
          'timestamp'
        );
      },

      getPhotosByChild: (childId) => {
        return sortByTimeDesc(
          get().photos.filter((p) => p.childId === childId),
          'timestamp'
        );
      },

      getHealthAlertsByChild: (childId) => {
        return get().healthAlerts.filter((a) => a.childId === childId && a.isActive);
      },

      getClassById: (id) => {
        return get().classes.find((c) => c.id === id);
      },

      addRecord: (form) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;

        const now = new Date();
        const timeStr = now.toISOString();

        const newRecord: DailyRecord = {
          id: generateId(),
          childId: form.childId,
          type: form.type,
          time: timeStr,
          content: form.content,
          tags: form.tags,
          severity: form.severity,
          photoIds: form.photoIds,
          createdBy: currentUser.name,
        };

        set((state) => ({
          records: [...state.records, newRecord],
        }));
      },

      sendMessage: (childId, content, senderName) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;

        const newMessage: Message = {
          id: generateId(),
          childId,
          sender: 'teacher',
          senderName,
          content,
          timestamp: new Date().toISOString(),
          isRead: true,
          priority: 'low',
        };

        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
      },

      markMessageAsRead: (messageId) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === messageId ? { ...m, isRead: true } : m
          ),
        }));
      },

      markAllMessagesAsRead: (childId) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.childId === childId && m.sender === 'parent'
              ? { ...m, isRead: true }
              : m
          ),
        }));
      },

      getUnreadMessageCount: (childId) => {
        const messages = get().messages;
        if (childId) {
          return messages.filter(
            (m) => m.childId === childId && m.sender === 'parent' && !m.isRead
          ).length;
        }
        return messages.filter((m) => m.sender === 'parent' && !m.isRead).length;
      },

      getPendingReplyCount: () => {
        return get().messages.filter(
          (m) => m.sender === 'parent' && !m.isRead
        ).length;
      },

      getWarningRecordsCount: () => {
        const warningChildIds = new Set(
          get()
            .records.filter(
              (r) =>
                (r.severity === 'warning' || r.severity === 'danger') &&
                isRecordToday(r.time)
            )
            .map((r) => r.childId)
        );
        return warningChildIds.size;
      },

      getChildrenWithWarnings: () => {
        const warningChildIds = new Set(
          get()
            .records.filter(
              (r) =>
                (r.severity === 'warning' || r.severity === 'danger') &&
                isRecordToday(r.time)
            )
            .map((r) => r.childId)
        );
        return get().children.filter((c) => warningChildIds.has(c.id));
      },

      getHighPriorityMessages: () => {
        return sortByTimeDesc(
          get().messages.filter(
            (m) => m.sender === 'parent' && !m.isRead && m.priority === 'high'
          ),
          'timestamp'
        );
      },
    }),
    {
      name: 'nursery-workplace-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        records: state.records,
        messages: state.messages,
      }),
    }
  )
);
