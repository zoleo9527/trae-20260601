declare global {
	namespace App {
		interface Locals {
			user: {
				id: number;
				username: string;
				role: 'roaster' | 'cupper' | 'cs';
				display_name: string;
			} | null;
		}
	}
}

export {};
