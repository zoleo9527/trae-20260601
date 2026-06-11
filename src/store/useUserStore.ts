import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { users, user_liufang } from '../data';

interface UserStore {
  currentUser: User;
  users: User[];
  setCurrentUser: (user: User) => void;
  switchUser: (userId: string) => void;
  getUserById: (id: string) => User | undefined;
  getUsersByRole: (role: User['role']) => User[];
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      currentUser: users.find(u => u.id === user_liufang)!,
      users,
      setCurrentUser: (user) => set({ currentUser: user }),
      switchUser: (userId) => {
        const user = get().users.find(u => u.id === userId);
        if (user) {
          set({ currentUser: user });
        }
      },
      getUserById: (id) => get().users.find(u => u.id === id),
      getUsersByRole: (role) => get().users.filter(u => u.role === role),
    }),
    {
      name: 'user-store',
    }
  )
);
