import { json, error } from '@sveltejs/kit';
import { addNote } from '$lib/data/store';
import type { Note, UserRole } from '$lib/types';

export async function POST({ params, request }: { params: { id: string }; request: Request }) {
  const body = await request.json();
  const note = body as Omit<Note, 'id' | 'createdAt'>;
  
  const booking = addNote(params.id, note);
  if (!booking) {
    throw error(404, '预订不存在');
  }
  
  return json(booking);
}
