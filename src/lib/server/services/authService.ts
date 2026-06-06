import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import type { User } from '$lib/types';

export async function login(role: string, name: string): Promise<User> {
	const existingUser = await db
		.select()
		.from(users)
		.where(eq(users.name, name))
		.limit(1)
		.get();

	if (existingUser) {
		return existingUser as User;
	}

	const [newUser] = await db
		.insert(users)
		.values({
			name,
			role: role as 'consultant' | 'teacher' | 'admin'
		})
		.returning();

	return newUser as User;
}

export async function getUserById(id: string): Promise<User | null> {
	const user = await db
		.select()
		.from(users)
		.where(eq(users.id, id))
		.limit(1)
		.get();

	return (user as User) || null;
}
