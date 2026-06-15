import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IntakeService } from './intake.service';
import { CreateIntakeDto } from './dto/create-intake.dto';
import { IntakeQueryDto } from './dto/intake-query.dto';
import { UpdateIntakeDto } from './dto/update-intake.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { ResponseTransformInterceptor } from '../common/interceptors/response.interceptor';

@ApiTags('接机登记')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ResponseTransformInterceptor)
@Controller('intake')
export class IntakeController {
  constructor(private readonly intakeService: IntakeService) {}

  @Post()
  @Roles(UserRole.RECEPTIONIST, UserRole.MANAGER)
  @ApiOperation({ summary: '创建接机工单', description: '前台创建接机登记，系统自动生成隐私授权记录' })
  async create(@Body() dto: CreateIntakeDto, @CurrentUser() user: User) {
    return this.intakeService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: '查询接机工单列表', description: '支持按状态、关键词筛选；维修师仅看分配给自己的工单' })
  async findAll(@Query() query: IntakeQueryDto, @CurrentUser() user: User) {
    return this.intakeService.findAll(query, user);
  }

  @Get('status-flow')
  @ApiOperation({ summary: '获取工单状态流转图（判断依据）', description: '展示所有状态及允许流转的下一状态，作为现场判断依据' })
  async getStatusFlow() {
    return this.intakeService.getStatusFlowConfig();
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: '工单ID' })
  @ApiOperation({
    summary: '获取工单详情（含证据链）',
    description: '返回工单基本信息 + 证据链（备件申请记录 / 质检记录 / 附件照片）',
  })
  async findOne(@Param('id') id: string) {
    return this.intakeService.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', description: '工单ID' })
  @ApiOperation({
    summary: '更新工单（通用接口，已收紧权限）',
    description:
      '【禁止改状态】状态变更必须走对应流程接口。允许字段：前台→优先级/分配维修师；维修师→诊断结果/维修备注/优先级；店长→全部（状态除外）',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateIntakeDto,
    @CurrentUser() user: User,
  ) {
    return this.intakeService.update(id, dto, user);
  }

  @Get(':id/logs')
  @ApiParam({ name: 'id', description: '工单ID' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiOperation({ summary: '获取工单操作日志', description: '追溯谁、在什么时候、改了什么' })
  async getLogs(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
  ) {
    return this.intakeService.getOperationLogs(id, +page, +pageSize);
  }
}
