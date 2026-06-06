import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../common/enums';
import { User } from '../common/interfaces';
import { InMemoryStore } from '../common/services/in-memory-store.service';
import { TalentPlatformInfo } from './interfaces/talent.interface';
import { TalentService } from './talent.service';

@ApiTags('talent')
@Controller('talents')
export class TalentController {
  constructor(
    private readonly talentService: TalentService,
    private readonly store: InMemoryStore,
  ) {}

  private getOperator(@Headers('x-user-id') userId: string): User {
    return this.store.getUser(userId) || {
      id: 'default',
      name: '默认用户',
      role: UserRole.TALENT_AGENT,
      email: 'default@example.com',
    };
  }

  @Get()
  @ApiOperation({ summary: '获取达人列表' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  findAll() {
    return this.talentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取达人详情' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  findOne(@Param('id') id: string) {
    return this.talentService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建达人档案' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() data: {
    name: string;
    realName?: string;
    phone: string;
    idCard?: string;
    email?: string;
    platforms?: TalentPlatformInfo[];
    tags?: string[];
    introduction?: string;
  }, @Headers('x-user-id') userId: string) {
    return this.talentService.create(data, this.getOperator(userId));
  }

  @Put(':id')
  @ApiOperation({ summary: '更新达人档案' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  update(@Param('id') id: string, @Body() data: any, @Headers('x-user-id') userId: string) {
    return this.talentService.update(id, data, this.getOperator(userId));
  }

  @Post(':id/platforms')
  @ApiOperation({ summary: '添加平台账号' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  addPlatform(@Param('id') id: string, @Body() platform: TalentPlatformInfo, @Headers('x-user-id') userId: string) {
    return this.talentService.addPlatform(id, platform, this.getOperator(userId));
  }

  @Get(':id/logs')
  @ApiOperation({ summary: '查看达人操作日志' })
  @ApiHeader({ name: 'x-user-id', description: '用户ID' })
  getLogs(@Param('id') id: string) {
    return this.talentService.getOperationLogs(id);
  }
}
