import { json, error } from '@sveltejs/kit';
import { addIssue, resolveIssue, getRecordById } from '$lib/data/store';

export async function POST({ request, params }: { request: Request; params: { id: string } }) {
  const body = await request.json();
  const { type, reason, supplementaryNotes, createdBy, createdByRole, relatedScheduleId, relatedServiceId } = body;
  
  if (!type || !reason || !createdBy || !createdByRole) {
    throw error(400, '缺少必要参数');
  }
  
  const record = addIssue(params.id, {
    type,
    reason,
    supplementaryNotes: supplementaryNotes || '',
    createdBy,
    createdByRole,
    relatedScheduleId,
    relatedServiceId
  });
  
  if (!record) {
    throw error(404, '记录不存在');
  }
  
  return json(record);
}

export async function PATCH({ request, params }: { request: Request; params: { id: string } }) {
  const body = await request.json();
  const { issueId, resolvedBy, action } = body;
  
  if (!issueId || !resolvedBy) {
    throw error(400, '缺少必要参数');
  }
  
  if (action === 'resolve') {
    const record = resolveIssue(params.id, issueId, resolvedBy);
    if (!record) {
      throw error(404, '记录或问题不存在');
    }
    return json(record);
  }
  
  throw error(400, '无效的操作');
}

export function GET({ params }: { params: { id: string } }) {
  const record = getRecordById(params.id);
  if (!record) {
    throw error(404, '记录不存在');
  }
  return json(record.issues);
}
