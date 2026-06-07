import { json, error } from '@sveltejs/kit';
import { addIssue, resolveIssue } from '$lib/data/store';
import type { IssueRecord, UserRole } from '$lib/types';

export async function POST({ params, request }: { params: { id: string }; request: Request }) {
  const body = await request.json();
  const issue = body as Omit<IssueRecord, 'id' | 'createdAt' | 'status'>;
  
  const booking = addIssue(params.id, issue);
  if (!booking) {
    throw error(404, '预订不存在');
  }
  
  return json(booking);
}

export async function PATCH({ params, request }: { params: { id: string }; request: Request }) {
  const body = await request.json();
  const { issueId, resolvedBy, action } = body;
  
  if (action === 'resolve') {
    const booking = resolveIssue(params.id, issueId, resolvedBy);
    if (!booking) {
      throw error(404, '预订不存在');
    }
    return json(booking);
  }
  
  throw error(400, '无效的操作');
}
