import { createOperationLog, getOperationLogs } from '$server/db';

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const workOrderId = url.searchParams.get('workOrderId') || undefined;
  
  const logs = getOperationLogs(workOrderId);
  
  return new Response(JSON.stringify({
    success: true,
    data: logs
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200
  });
}

export async function POST(request: Request): Promise<Response> {
  const data = await request.json();
  
  createOperationLog(data);
  
  return new Response(JSON.stringify({
    success: true
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 201
  });
}
