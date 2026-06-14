import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { ExportService } from './export.service';
import { AuthGuard, RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../common/types/user.type';
import { CreateExportTaskDto, QueryExportListDto } from './dto/export.dto';

@ApiTags('导出任务')
@ApiHeader({ name: 'x-user-id', description: '当前操作用户ID', required: true })
@Controller('exports')
@UseGuards(AuthGuard, RolesGuard)
export class ExportController {
  constructor(private readonly service: ExportService) {}

  @Post('tasks')
  @ApiOperation({ summary: '[教务/家长顾问] 创建导出任务（幂等），异步生成CSV/Excel文件' })
  createTask(@Body() dto: CreateExportTaskDto, @CurrentUser() user: User) {
    return this.service.createTask(dto, user);
  }

  @Get('tasks')
  @ApiOperation({ summary: '查询导出任务列表' })
  listTasks(@Query() query: QueryExportListDto, @CurrentUser() user: User) {
    return this.service.listTasks(query, user);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: '查看导出任务状态和下载链接' })
  getTask(@Param('id') id: string) {
    return this.service.getTask(id);
  }
}
