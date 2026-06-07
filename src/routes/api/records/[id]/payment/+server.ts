import { error } from '@sveltejs/kit';

export async function POST() {
  throw error(403, '该接口已停用，请使用 /confirm-payment 收口接口');
}
