
import { create } from 'zustand';
import type { User } from '../../shared/types';

interface UserState {
  user: User | null;
  token: string | null;
  setUser: (user: User, token: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  token: null,
  setUser: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));

const savedUser = localStorage.getItem('user');
const savedToken = localStorage.getItem('token');
if (savedUser && savedToken) {
  useUserStore.setState({
    user: JSON.parse(savedUser),
    token: savedToken,
  });
}
