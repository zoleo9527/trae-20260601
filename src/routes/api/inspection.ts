import { createInspectionRecord, updateInspectionRecord } from '$server/db';

export async function POST(request: Request): Promise<Response> {
  const data = await request.json();
  
  const recordId = createInspectionRecord(data);
  
  return new Response(JSON.stringify({
    success: true,
    recordId
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 201
  });
}

export async function PUT(request: Request): Promise<Response> {
  const { id, ...data } = await request.json();
  
  updateInspectionRecord(id, data);
  
  return new Response(JSON.stringify({
    success: true
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200
  });
}
