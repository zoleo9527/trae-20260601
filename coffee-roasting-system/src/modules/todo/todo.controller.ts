import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { TodoService, TodoAggregation, TodoItem } from './todo.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('todos')
@UseGuards(AuthGuard('jwt'))
export class TodoController {
  constructor(private todoService: TodoService) {}

  @Get()
  async getTodos(@Request() req): Promise<TodoAggregation> {
    const role = req.user.role;
    return this.todoService.getTodosByRole(role);
  }

  @Get('pending')
  async getPendingTodos(@Request() req): Promise<TodoItem[]> {
    const role = req.user.role;
    return this.todoService.getPendingTodosByRole(role);
  }
}