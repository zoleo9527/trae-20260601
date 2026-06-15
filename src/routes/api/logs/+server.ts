import { createOperationLog, getOperationLogs } from '$server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const workOrderId = url.searchParams.get('workOrderId') || undefined;
  
  const logs = getOperationLogs(workOrderId);
  
  return new Response(JSON.stringify({
    success: true,
    data: logs
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200
  });
};

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  
  createOperationLog(data);
  
  return new Response(JSON.stringify({
    success: true
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 201
  });
};
