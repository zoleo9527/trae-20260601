import { users } from '~/data/mockData';

export async function login(username, password) {
  const user = users.find(u => u.username === username && u.password === password);
  return user || null;
}

export async function getUserById(id) {
  return users.find(u => u.id === id) || null;
}

export async function getUserByUsername(username) {
  return users.find(u => u.username === username) || null;
}
