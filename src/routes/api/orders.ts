import { createWorkOrder, getWorkOrders } from '$server/db';
import type { WorkOrder } from '$lib/types';

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const plateNumber = url.searchParams.get('plateNumber') || undefined;
  const customerName = url.searchParams.get('customerName') || undefined;
  const status = url.searchParams.get('status') || undefined;
  
  const orders = getWorkOrders({ plateNumber, customerName, status });
  
  return new Response(JSON.stringify({
    success: true,
    data: orders
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200
  });
}

export async function POST(request: Request): Promise<Response> {
  const data = await request.json();
  
  const orderId = createWorkOrder(data);
  
  return new Response(JSON.stringify({
    success: true,
    orderId
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 201
  });
}
