import { createBalanceRecord, updateBalanceRecord } from '$server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  
  const recordId = createBalanceRecord(data);
  
  return new Response(JSON.stringify({
    success: true,
    recordId
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 201
  });
};

export const PUT: RequestHandler = async ({ request }) => {
  const { id, ...data } = await request.json();
  
  updateBalanceRecord(id, data);
  
  return new Response(JSON.stringify({
    success: true
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200
  });
};
