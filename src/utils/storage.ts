const STORAGE_KEY = 'labor-dispatch-user';

export const saveUserToStorage = (user: any) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to save user to storage:', error);
  }
};

export const loadUserFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load user from storage:', error);
    return null;
  }
};

export const clearUserFromStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear user from storage:', error);
  }
};