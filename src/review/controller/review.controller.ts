import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReviewService } from '../service/review.service';
import { CreateReviewDto } from '../dto/create-review.dto';
import { AssignQualityDto } from '../dto/assign-quality.dto';
import { FollowUpDto } from '../dto/follow-up.dto';
import { EscalateDto } from '../dto/escalate.dto';
import { ResolveDto } from '../dto/resolve.dto';
import { CloseDto } from '../dto/close.dto';
import { QueryReviewDto } from '../dto/query-review.dto';
import { Role } from '../../common/enums';

@ApiTags('评价 Review')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly svc: ReviewService) {}

  @Post()
  @ApiOperation({ summary: '创建评价' })
  create(@Body() dto: CreateReviewDto) {
    return this.svc.create(dto, { role: Role.CUSTOMER_SERVICE, id: 'system', name: 'system' });
  }

  @Get()
  @ApiOperation({ summary: '分页查询评价列表' })
  findAll(@Query() q: QueryReviewDto) {
    return this.svc.findAll(q);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取评价详情' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Get(':id/trace')
  @ApiOperation({ summary: '获取评价审计轨迹' })
  getTrace(@Param('id') id: string) {
    return this.svc.getAuditTrail(id);
  }

  @Post(':id/assign-quality')
  @ApiOperation({ summary: '分配质检主管处理' })
  assignQuality(@Param('id') id: string, @Body() dto: AssignQualityDto) {
    return this.svc.assignQuality(id, dto, { role: Role.CUSTOMER_SERVICE, id: 'system', name: 'system' });
  }

  @Post(':id/follow-up')
  @ApiOperation({ summary: '质检跟进' })
  followUp(@Param('id') id: string, @Body() dto: FollowUpDto) {
    return this.svc.followUp(id, dto, { role: Role.QUALITY_SUPERVISOR, id: 'system', name: 'system' });
  }

  @Post(':id/escalate')
  @ApiOperation({ summary: '升级处理' })
  escalate(@Param('id') id: string, @Body() dto: EscalateDto) {
    return this.svc.escalate(id, dto, { role: Role.QUALITY_SUPERVISOR, id: 'system', name: 'system' });
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: '解决问题' })
  resolve(@Param('id') id: string, @Body() dto: ResolveDto) {
    return this.svc.resolve(id, dto, { role: Role.QUALITY_SUPERVISOR, id: 'system', name: 'system' });
  }

  @Post(':id/close')
  @ApiOperation({ summary: '未解决关闭' })
  close(@Param('id') id: string, @Body() dto: CloseDto) {
    return this.svc.closeWithoutResolution(id, dto, { role: Role.QUALITY_SUPERVISOR, id: 'system', name: 'system' });
  }
}
