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
        return get()
          .records.filter((r) => r.childId === childId)
          .sort((a, b) => b.time.localeCompare(a.time));
      },

      getMessagesByChild: (childId) => {
        return get()
          .messages.filter((m) => m.childId === childId)
          .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      },

      getPhotosByChild: (childId) => {
        return get()
          .photos.filter((p) => p.childId === childId)
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
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
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

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
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        return get().records.filter(
          (r) =>
            (r.severity === 'warning' || r.severity === 'danger') &&
            r.time.startsWith(dateStr.slice(5))
        ).length;
      },

      getChildrenWithWarnings: () => {
        const records = get().records;
        const warningChildIds = new Set(
          records
            .filter((r) => r.severity === 'warning' || r.severity === 'danger')
            .map((r) => r.childId)
        );
        return get().children.filter((c) => warningChildIds.has(c.id));
      },

      getHighPriorityMessages: () => {
        return get()
          .messages.filter(
            (m) => m.sender === 'parent' && !m.isRead && m.priority === 'high'
          )
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
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
