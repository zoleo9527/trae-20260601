import { writable } from 'svelte/store';
import type { User } from './types';

function createCurrentUser() {
	const { subscribe, set } = writable<User | null>(null);

	return {
		subscribe,
		login: (user: User) => set(user),
		logout: () => set(null)
	};
}

export const currentUser = createCurrentUser();
