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
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PrivacyService } from './privacy.service';
import { SignConsentDto } from './dto/sign-consent.dto';
import { ConsentQueryDto } from './dto/consent-query.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { ResponseTransformInterceptor } from '../common/interceptors/response.interceptor';

@ApiTags('隐私授权')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ResponseTransformInterceptor)
@Controller('privacy')
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Get('template')
  @ApiOperation({ summary: '获取隐私授权模板', description: '前端展示授权条款时使用，含必填项标记' })
  async getTemplate() {
    return this.privacyService.getConsentTemplate();
  }

  @Get('order/:orderId')
  @ApiParam({ name: 'orderId', description: '接机工单ID' })
  @ApiOperation({ summary: '根据工单ID查询授权记录', description: '接机登记后自动生成，可直接查看是否已签署' })
  async findByOrder(@Param('orderId') orderId: string) {
    return this.privacyService.findByOrderId(orderId);
  }

  @Post('order/:orderId/sign')
  @Roles(UserRole.RECEPTIONIST, UserRole.MANAGER)
  @ApiParam({ name: 'orderId', description: '接机工单ID' })
  @ApiOperation({
    summary: '签署隐私授权',
    description: '接机登记后直接在此接口签署；签署成功后工单状态自动从「待签隐私授权」流转为「已授权待诊断」，无需额外发消息提醒',
  })
  async sign(
    @Param('orderId') orderId: string,
    @Body() dto: SignConsentDto,
    @CurrentUser() user: User,
  ) {
    return this.privacyService.sign(orderId, dto, user);
  }

  @Get()
  @ApiOperation({ summary: '隐私授权回看', description: '按条件检索历史授权记录，店长可随时回看' })
  async findAll(@Query() query: ConsentQueryDto) {
    return this.privacyService.findAll(query);
  }

  @Patch(':id/revoke')
  @Roles(UserRole.MANAGER)
  @ApiParam({ name: 'id', description: '授权记录ID' })
  @ApiOperation({ summary: '撤销授权（仅店长）', description: '客户要求撤销时使用，需填写撤销原因' })
  async revoke(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: User,
  ) {
    return this.privacyService.revoke(id, reason, user);
  }
}
