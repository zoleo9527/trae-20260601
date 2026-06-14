import { writable } from 'svelte/store';

export const user = writable(null);
export const currentView = writable('list');
export const selectedSample = writable(null);
export const notifications = writable([]);

export function showNotification(notif) {
  notifications.update(n => [notif, ...n]);
  setTimeout(() => {
    notifications.update(n => n.filter(item => item.id !== notif.id));
  }, 5000);
}
