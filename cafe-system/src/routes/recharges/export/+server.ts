import { getDb } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) throw redirect(302, '/login');

	const db = getDb();
	const status = url.searchParams.get('status') || '';
	const keyword = (url.searchParams.get('keyword') || '').trim();
	const mine = url.searchParams.get('mine') === '1';
	const dateFrom = url.searchParams.get('date_from') || '';
	const dateTo = url.searchParams.get('date_to') || '';

	let whereClauses: string[] = [];
	let params: any[] = [];

	if (status) {
		whereClauses.push('r.status = ?');
		params.push(status);
	}
	if (keyword) {
		whereClauses.push('(m.name LIKE ? OR m.phone LIKE ?)');
		params.push(`%${keyword}%`, `%${keyword}%`);
	}
	if (mine) {
		whereClauses.push('r.operator_id = ?');
		params.push(locals.user.id);
	}
	if (dateFrom) {
		whereClauses.push('date(r.created_at) >= date(?)');
		params.push(dateFrom);
	}
	if (dateTo) {
		whereClauses.push('date(r.created_at) <= date(?)');
		params.push(dateTo);
	}

	const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

	const rows = db.prepare(`
		SELECT r.*, m.name as member_name, m.phone as member_phone,
			u.display_name as operator_name, rv.display_name as reviewer_name
		FROM recharges r
		JOIN members m ON r.member_id = m.id
		JOIN users u ON r.operator_id = u.id
		LEFT JOIN users rv ON r.reviewer_id = rv.id
		${whereStr}
		ORDER BY r.created_at DESC
	`).all(...params) as any[];

	const statusMap: Record<string, string> = {
		pending: '待审核', approved: '已通过', rejected: '已退回', cancelled: '已取消'
	};
	const paymentMap: Record<string, string> = {
		cash: '现金', wechat: '微信', alipay: '支付宝'
	};

	const BOM = '\uFEFF';
	const headers = ['单据编号', '会员名', '手机号', '充值金额', '附赠分钟', '支付方式', '状态', '提交人', '审核人', '提交时间', '审核时间', '备注'];
	const csvRows = rows.map(r => [
		r.id,
		r.member_name,
		r.member_phone || '',
		r.amount,
		r.bonus_minutes,
		paymentMap[r.payment_method] || r.payment_method,
		statusMap[r.status] || r.status,
		r.operator_name,
		r.reviewer_name || '',
		r.created_at || '',
		r.reviewed_at || '',
		(r.review_note || '').replace(/"/g, '""')
	].map(v => {
		const s = String(v);
		return /[,"\n\r]/.test(s) ? `"${s}"` : s;
	}).join(','));

	const csv = BOM + [headers.join(','), ...csvRows].join('\n');

	const today = new Date().toISOString().substring(0, 10);
	const filename = `充值记录_${today}.csv`;

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`
		}
	});
};
