import { writable } from 'svelte/store';

export interface User {
  id: number;
  username: string;
  role: string;
}

export const currentUser = writable<User | null>(null);

export async function fetchCurrentUser(): Promise<void> {
  try {
    const response = await fetch('/api/user');
    if (response.ok) {
      const { user } = await response.json();
      currentUser.set(user);
    } else {
      currentUser.set(null);
    }
  } catch {
    currentUser.set(null);
  }
}

export async function loginUser(username: string, password: string): Promise<boolean> {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (response.ok) {
      const { user } = await response.json();
      currentUser.set(user);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch('/api/user', { method: 'POST' });
    currentUser.set(null);
  } catch {
    currentUser.set(null);
  }
}
