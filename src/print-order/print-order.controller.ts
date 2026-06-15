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
import { PrintOrderService } from './print-order.service';
import { CreatePrintOrderDto } from './dto/create-print-order.dto';
import { UpdatePrintOrderDto } from './dto/update-print-order.dto';
import { PrintOrderQueryDto } from './dto/print-order-query.dto';
import { AssignInstallationDto } from './dto/assign-installation.dto';
import { SubmitPhotoReturnDto } from './dto/submit-photo-return.dto';
import { AddOrderNoteDto } from './dto/add-order-note.dto';
import { ReviewPhotoReturnDto } from './dto/review-photo-return.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { SubmitTaskPhotoDto } from './dto/submit-task-photo.dto';
import { ReviewTaskPhotoDto } from './dto/review-task-photo.dto';
import { AddTaskSupplementDto } from './dto/add-task-supplement.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { ResponseTransformInterceptor } from '../common/interceptors/response.interceptor';

@ApiTags('喷绘订单')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ResponseTransformInterceptor)
@Controller('print-orders')
export class PrintOrderController {
  constructor(private readonly printOrderService: PrintOrderService) {}

  @Post()
  @Roles(UserRole.RECEPTIONIST, UserRole.MANAGER)
  @ApiOperation({ summary: '创建喷绘订单', description: '接单员创建喷绘订单' })
  async create(@Body() dto: CreatePrintOrderDto, @CurrentUser() user: User) {
    return this.printOrderService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: '查询喷绘订单列表', description: '支持按状态、优先级、关键词筛选；各角色按权限过滤' })
  async findAll(@Query() query: PrintOrderQueryDto, @CurrentUser() user: User) {
    return this.printOrderService.findAll(query, user);
  }

  @Get('status-flow')
  @ApiOperation({ summary: '获取订单状态流转图', description: '展示所有状态及允许流转的下一状态、责任角色' })
  async getStatusFlow() {
    return this.printOrderService.getStatusFlowConfig();
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: '订单ID' })
  @ApiOperation({
    summary: '获取订单详情',
    description: '返回订单完整信息：基本信息 + 安装派工记录 + 照片回传记录 + 备注历史',
  })
  async findOne(@Param('id') id: string) {
    return this.printOrderService.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', description: '订单ID' })
  @ApiOperation({
    summary: '更新订单（通用接口）',
    description: '【禁止改状态】状态变更必须走对应流程接口',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePrintOrderDto,
    @CurrentUser() user: User,
  ) {
    return this.printOrderService.update(id, dto, user);
  }

  @Post(':id/assign-designer')
  @Roles(UserRole.MANAGER, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: '分配设计师', description: '将订单从待设计状态分配给设计师，进入设计中' })
  async assignDesigner(
    @Param('id') id: string,
    @Body('designerId') designerId: string,
    @CurrentUser() user: User,
  ) {
    return this.printOrderService.assignDesigner(id, designerId, user);
  }

  @Post(':id/submit-design')
  @Roles(UserRole.DESIGNER, UserRole.MANAGER)
  @ApiOperation({ summary: '提交喷绘', description: '设计完成，提交喷绘，进入待喷绘状态' })
  async submitDesign(@Param('id') id: string, @CurrentUser() user: User) {
    return this.printOrderService.submitDesign(id, user);
  }

  @Post(':id/start-print')
  @Roles(UserRole.PRINT_OPERATOR, UserRole.MANAGER)
  @ApiOperation({ summary: '开始喷绘', description: '喷绘员领取任务，开始喷绘' })
  async startPrint(@Param('id') id: string, @CurrentUser() user: User) {
    return this.printOrderService.startPrint(id, user);
  }

  @Post(':id/complete-print')
  @Roles(UserRole.PRINT_OPERATOR, UserRole.MANAGER)
  @ApiOperation({ summary: '完成喷绘', description: '喷绘完成，进入待安装派工状态' })
  async completePrint(@Param('id') id: string, @CurrentUser() user: User) {
    return this.printOrderService.completePrint(id, user);
  }

  @Post(':id/assign-installation')
  @Roles(UserRole.MANAGER, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: '安装派工', description: '指派安装队长、安装时间、地址、队员等' })
  async assignInstallation(
    @Param('id') id: string,
    @Body() dto: AssignInstallationDto,
    @CurrentUser() user: User,
  ) {
    return this.printOrderService.assignInstallation(id, dto, user);
  }

  @Post(':id/start-installation')
  @Roles(UserRole.INSTALL_LEADER, UserRole.MANAGER)
  @ApiOperation({ summary: '开始安装', description: '安装队长确认开始安装' })
  async startInstallation(@Param('id') id: string, @CurrentUser() user: User) {
    return this.printOrderService.startInstallation(id, user);
  }

  @Post(':id/photo-return')
  @Roles(UserRole.INSTALL_LEADER, UserRole.MANAGER)
  @ApiOperation({ summary: '提交照片回传', description: '安装完成后上传照片，进入待验收状态' })
  async submitPhotoReturn(
    @Param('id') id: string,
    @Body() dto: SubmitPhotoReturnDto,
    @CurrentUser() user: User,
  ) {
    return this.printOrderService.submitPhotoReturn(id, dto, user);
  }

  @Post(':id/photo-return/:photoReturnId/approve')
  @Roles(UserRole.MANAGER, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: '验收通过', description: '审核照片回传通过，订单完成' })
  async approvePhotoReturn(
    @Param('id') id: string,
    @Param('photoReturnId') photoReturnId: string,
    @Body() dto: ReviewPhotoReturnDto,
    @CurrentUser() user: User,
  ) {
    return this.printOrderService.reviewPhotoReturn(id, photoReturnId, true, dto, user);
  }

  @Post(':id/photo-return/:photoReturnId/reject')
  @Roles(UserRole.MANAGER, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: '退回重拍', description: '审核不通过，退回重拍，记录退回原因' })
  async rejectPhotoReturn(
    @Param('id') id: string,
    @Param('photoReturnId') photoReturnId: string,
    @Body() dto: ReviewPhotoReturnDto,
    @CurrentUser() user: User,
  ) {
    return this.printOrderService.reviewPhotoReturn(id, photoReturnId, false, dto, user);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: '添加备注', description: '添加补充备注、退回原因等' })
  async addNote(
    @Param('id') id: string,
    @Body() dto: AddOrderNoteDto,
    @CurrentUser() user: User,
  ) {
    return this.printOrderService.addNote(id, dto, user);
  }

  @Get(':id/notes')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiOperation({ summary: '获取备注历史', description: '查看所有备注记录' })
  async getNotes(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
  ) {
    return this.printOrderService.getNotes(id, +page, +pageSize);
  }

  @Get(':id/logs')
  @ApiParam({ name: 'id', description: '订单ID' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiOperation({ summary: '获取订单操作日志', description: '追溯谁、在什么时候、改了什么' })
  async getLogs(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
  ) {
    return this.printOrderService.getOperationLogs(id, +page, +pageSize);
  }

  @Post(':id/tasks')
  @Roles(UserRole.MANAGER, UserRole.RECEPTIONIST)
  @ApiOperation({
    summary: '【一体化】创建安装任务',
    description: '创建一条包含派工、照片回传、退回原因、补充备注的一体化安装任务记录。派工与责任信息会保留在任务中，切换状态不丢失。',
  })
  async createTask(
    @Param('id') orderId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.printOrderService.createInstallationTask(orderId, dto, user);
  }

  @Get(':id/tasks')
  @ApiOperation({
    summary: '【一体化】获取订单的全部安装任务',
    description: '按轮次倒序排列，包含每一轮派工、照片、退回、补充说明的完整信息',
  })
  async getOrderTasks(@Param('id') orderId: string) {
    return this.printOrderService.findTasksByOrder(orderId);
  }

  @Get(':id/active-task')
  @ApiOperation({
    summary: '【一体化】获取订单当前活跃任务',
    description: '返回正在处理的安装任务，包含责任人、派工信息、历史说明等',
  })
  async getActiveTask(@Param('id') orderId: string) {
    return this.printOrderService.findActiveTaskByOrder(orderId);
  }

  @Get('tasks/my')
  @Roles(UserRole.INSTALL_LEADER, UserRole.MANAGER)
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiOperation({
    summary: '【一体化】安装队长的任务列表',
    description: '安装队长查看自己的安装任务，按卡住程度和更新时间排序，支撑连续处理',
  })
  async getMyTasks(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 30,
  ) {
    return this.printOrderService.getMyTasks(user, +page, +pageSize);
  }

  @Post('tasks/:taskId/start')
  @Roles(UserRole.INSTALL_LEADER, UserRole.MANAGER)
  @ApiParam({ name: 'taskId', description: '安装任务ID' })
  @ApiOperation({
    summary: '【一体化】开始安装',
    description: '从任务的派工状态切换到安装中状态，不丢失责任人和派工信息',
  })
  async startTask(
    @Param('taskId') taskId: string,
    @CurrentUser() user: User,
  ) {
    return this.printOrderService.startInstallationTask(taskId, user);
  }

  @Post('tasks/:taskId/photo-return')
  @Roles(UserRole.INSTALL_LEADER, UserRole.MANAGER)
  @ApiParam({ name: 'taskId', description: '安装任务ID' })
  @ApiOperation({
    summary: '【一体化】提交照片回传',
    description: '在同一条任务记录上提交照片，责任人和派工信息在切换状态时不丢失',
  })
  async submitTaskPhoto(
    @Param('taskId') taskId: string,
    @Body() dto: SubmitTaskPhotoDto,
    @CurrentUser() user: User,
  ) {
    return this.printOrderService.submitTaskPhoto(taskId, dto, user);
  }

  @Post('tasks/:taskId/photo-approve')
  @Roles(UserRole.MANAGER, UserRole.RECEPTIONIST)
  @ApiParam({ name: 'taskId', description: '安装任务ID' })
  @ApiOperation({
    summary: '【一体化】验收通过',
    description: '在同一条任务记录上审核照片通过，记录审核意见，任务闭环',
  })
  async approveTaskPhoto(
    @Param('taskId') taskId: string,
    @Body() dto: ReviewTaskPhotoDto,
    @CurrentUser() user: User,
  ) {
    return this.printOrderService.reviewTaskPhoto(taskId, true, dto, user);
  }

  @Post('tasks/:taskId/photo-reject')
  @Roles(UserRole.MANAGER, UserRole.RECEPTIONIST)
  @ApiParam({ name: 'taskId', description: '安装任务ID' })
  @ApiOperation({
    summary: '【一体化】退回重拍',
    description: '在同一条任务记录上记录退回原因，保留之前的派工信息、照片、补充说明，方便追溯责任',
  })
  async rejectTaskPhoto(
    @Param('taskId') taskId: string,
    @Body() dto: ReviewTaskPhotoDto,
    @CurrentUser() user: User,
  ) {
    return this.printOrderService.reviewTaskPhoto(taskId, false, dto, user);
  }

  @Post('tasks/:taskId/supplement')
  @ApiParam({ name: 'taskId', description: '安装任务ID' })
  @ApiOperation({
    summary: '【一体化】添加补充备注',
    description: '在任务记录上追加补充说明，与派工、照片、退回原因共同构成完整历史',
  })
  async addTaskSupplement(
    @Param('taskId') taskId: string,
    @Body() dto: AddTaskSupplementDto,
    @CurrentUser() user: User,
  ) {
    return this.printOrderService.addTaskSupplement(taskId, dto, user);
  }

  @Get('tasks/:taskId')
  @ApiParam({ name: 'taskId', description: '安装任务ID' })
  @ApiOperation({
    summary: '【一体化】获取单条安装任务详情',
    description: '返回任务的完整信息：派工信息、照片、退回原因、补充备注、责任人和审核信息',
  })
  async getTask(@Param('taskId') taskId: string) {
    return this.printOrderService.findOneTask(taskId);
  }

  @Post('tasks/refresh-stuck')
  @Roles(UserRole.MANAGER)
  @ApiOperation({
    summary: '【后台】刷新任务卡住状态',
    description: '按状态阈值重新计算每个活跃任务的卡住等级（正常/预警/危险），供工作台展示',
  })
  async refreshTaskStuck() {
    const count = await this.printOrderService.refreshTaskStuckStatus();
    return { refreshed: count };
  }
}
