import { createWorkOrder, getWorkOrders } from '$server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
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
};

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  
  const orderId = createWorkOrder(data);
  
  return new Response(JSON.stringify({
    success: true,
    orderId
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 201
  });
};
