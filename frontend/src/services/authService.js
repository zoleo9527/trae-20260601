import api from './api.js';

const STORAGE_KEY = {
  TOKEN: 'judicial_token',
  USER: 'judicial_user'
};

export const authService = {
  async login(username, password) {
    const response = await api.post('/auth/login', { username, password });
    if (response.success && response.data) {
      localStorage.setItem(STORAGE_KEY.TOKEN, response.data.token);
      localStorage.setItem(STORAGE_KEY.USER, JSON.stringify(response.data.user));
    }
    return response;
  },

  logout() {
    localStorage.removeItem(STORAGE_KEY.TOKEN);
    localStorage.removeItem(STORAGE_KEY.USER);
  },

  getCurrentUser() {
    const userStr = localStorage.getItem(STORAGE_KEY.USER);
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken() {
    return localStorage.getItem(STORAGE_KEY.TOKEN);
  },

  isAuthenticated() {
    return !!localStorage.getItem(STORAGE_KEY.TOKEN);
  },

  async verifyToken() {
    try {
      const response = await api.get('/auth/verify');
      return response.success;
    } catch (error) {
      this.logout();
      return false;
    }
  }
};
