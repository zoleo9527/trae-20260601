import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { NoteService } from './note.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('notes')
@UseGuards(AuthGuard('jwt'))
export class NoteController {
  constructor(private noteService: NoteService) {}

  @Get()
  async findAll() {
    return this.noteService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.noteService.findOne(id);
  }

  @Get('task/:taskId')
  async findByTaskId(@Param('taskId') taskId: string) {
    return this.noteService.findByTaskId(taskId);
  }

  @Get('author/:authorId')
  async findByAuthorId(@Param('authorId') authorId: string) {
    return this.noteService.findByAuthorId(authorId);
  }

  @Post()
  async create(@Body() body: { taskId: string; content: string; authorId: string; type?: string }) {
    const { taskId, content, authorId, type } = body;
    const task = { id: taskId } as any;
    const author = { id: authorId } as any;
    return this.noteService.create(task, content, author, type);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { content: string }) {
    return this.noteService.update(id, body.content);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.noteService.remove(id);
    return { message: '备注已删除' };
  }
}
