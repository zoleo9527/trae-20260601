import { getDb } from '$lib/server/db';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return { user: null, pendingRecharges: 0, pendingTimeGifts: 0, pendingRepairs: 0, myPendingRecharges: 0, myPendingTimeGifts: 0 };
	}

	const db = getDb();

	const pendingRecharges = (
		db.prepare("SELECT COUNT(*) as c FROM recharges WHERE status = 'pending'").get() as { c: number }
	).c;

	const pendingTimeGifts = (
		db.prepare("SELECT COUNT(*) as c FROM time_gifts WHERE status = 'pending'").get() as { c: number }
	).c;

	const pendingRepairs = (
		db.prepare("SELECT COUNT(*) as c FROM equipment_repairs WHERE status IN ('reported', 'in_progress')").get() as { c: number }
	).c;

	let myPendingRecharges = 0;
	let myPendingTimeGifts = 0;

	if (locals.user.role === 'operator' || locals.user.role === 'tournament') {
		myPendingRecharges = (
			db.prepare("SELECT COUNT(*) as c FROM recharges WHERE status = 'pending' AND operator_id = ?").get(locals.user.id) as { c: number }
		).c;

		myPendingTimeGifts = (
			db.prepare("SELECT COUNT(*) as c FROM time_gifts WHERE status = 'pending' AND operator_id = ?").get(locals.user.id) as { c: number }
		).c;
	}

	return {
		user: locals.user,
		pendingRecharges,
		pendingTimeGifts,
		pendingRepairs,
		myPendingRecharges,
		myPendingTimeGifts
	};
};
