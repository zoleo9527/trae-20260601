import { addLog, getDb } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	if (locals.user.role !== 'operator' && locals.user.role !== 'admin') throw redirect(302, '/dashboard');

	const db = getDb();
	const members = db.prepare('SELECT id, name, phone, balance, bonus_minutes FROM members ORDER BY name').all();
	return { members };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/login');

		const formData = await request.formData();
		const memberId = Number(formData.get('member_id'));
		const amount = Number(formData.get('amount'));
		const bonusMinutes = Number(formData.get('bonus_minutes') || 0);
		const paymentMethod = formData.get('payment_method') as string;

		if (!memberId || !amount || amount <= 0) {
			return fail(400, { error: '请选择会员并输入有效金额' });
		}

		const db = getDb();

		const result = db.transaction(() => {
			const rechargeResult = db.prepare(`
				INSERT INTO recharges (member_id, amount, bonus_minutes, payment_method, status, operator_id)
				VALUES (?, ?, ?, ?, 'pending', ?)
			`).run(memberId, amount, bonusMinutes, paymentMethod || 'cash', locals.user!.id);

			const rechargeId = Number(rechargeResult.lastInsertRowid);
			const paymentLabel = paymentMethod === 'cash' ? '现金' : paymentMethod === 'wechat' ? '微信' : '支付宝';

			addLog('recharge', rechargeId, 'create', locals.user!.id,
				`提交会员充值：金额${amount}元${bonusMinutes > 0 ? '，赠送' + bonusMinutes + '分钟' : ''}，支付方式：${paymentLabel}`);

			if (bonusMinutes > 0) {
				const giftResult = db.prepare(`
					INSERT INTO time_gifts (member_id, minutes, reason, source_type, recharge_id, status, operator_id)
					VALUES (?, ?, ?, 'recharge_bonus', ?, 'pending', ?)
				`).run(memberId, bonusMinutes, `充值赠送：随充值单#${rechargeId}附赠`, rechargeId, locals.user!.id);

				addLog('time_gift', Number(giftResult.lastInsertRowid), 'create', locals.user!.id,
					`自动创建：随充值单#${rechargeId}附赠${bonusMinutes}分钟`);
			}

			return rechargeId;
		})();

		throw redirect(302, `/recharges/${result}`);
	}
};
