import type { RequestHandler } from './$types';
import prisma from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
  const status = url.searchParams.get('status') || 'PENDING';
  const priority = url.searchParams.get('priority');
  
  try {
    const todos = await prisma.todoItem.findMany({
      where: {
        status,
        ...(priority ? { priority } : {})
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' }
      ],
      take: 10
    });
    
    const formattedTodos = todos.map(todo => ({
      id: todo.id,
      type: todo.type,
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      dueDate: todo.dueDate?.toISOString(),
      status: todo.status,
      relatedId: todo.relatedId
    }));
    
    return new Response(
      JSON.stringify({ todos: formattedTodos }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '获取待办事项失败' }),
      { status: 500 }
    );
  }
};