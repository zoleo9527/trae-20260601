import { json, error } from '@sveltejs/kit';
import { getRecordById } from '$lib/data/store';

export function GET({ params }: { params: { id: string } }) {
  const record = getRecordById(params.id);
  if (!record) {
    throw error(404, '记录不存在');
  }
  return json(record);
}
