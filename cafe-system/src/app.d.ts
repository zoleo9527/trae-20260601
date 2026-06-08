declare global {
	namespace App {
		interface Locals {
			user: {
				id: number;
				username: string;
				display_name: string;
				role: 'admin' | 'operator' | 'tournament';
			} | null;
		}
	}
}

export { };

