import { getWorkOrderById, updateWorkOrder } from '$server/db';

export async function GET(request: Request, params: { id: string }): Promise<Response> {
  const order = getWorkOrderById(params.id);
  
  if (order) {
    return new Response(JSON.stringify({
      success: true,
      data: order
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  }
  
  return new Response(JSON.stringify({
    success: false,
    message: '工单不存在'
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 404
  });
}

export async function PUT(request: Request, params: { id: string }): Promise<Response> {
  const data = await request.json();
  
  updateWorkOrder(params.id, data);
  
  return new Response(JSON.stringify({
    success: true
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200
  });
}
