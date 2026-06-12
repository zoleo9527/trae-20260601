import { create } from 'zustand';
import { authAPI } from '../services/api';
export const useAuthStore = create((set) => ({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null,
    login: async (username, password) => {
        set({ loading: true, error: null });
        try {
            const response = await authAPI.login(username, password);
            const { user, token } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            set({
                user,
                token,
                isAuthenticated: true,
                loading: false,
            });
        }
        catch (error) {
            set({
                error: error.response?.data?.error || '登录失败',
                loading: false,
            });
            throw error;
        }
    },
    logout: async () => {
        set({ loading: true });
        try {
            await authAPI.logout();
        }
        catch (error) {
            console.error('Logout error:', error);
        }
        finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            set({
                user: null,
                token: null,
                isAuthenticated: false,
                loading: false,
            });
        }
    },
    checkAuth: async () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                set({ user, token, isAuthenticated: true });
            }
            catch (error) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                set({ user: null, token: null, isAuthenticated: false });
            }
        }
    },
    clearError: () => set({ error: null }),
}));
