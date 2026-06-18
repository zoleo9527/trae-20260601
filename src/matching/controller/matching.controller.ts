import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MatchingService } from '../service/matching.service';
import { RunMatchingDto } from '../dto/run-matching.dto';
import { RespondMatchingDto } from '../dto/respond-matching.dto';
import { QueryMatchingDto } from '../dto/query-matching.dto';
import { Role } from '../../common/enums';

@ApiTags('阿姨匹配 Matching')
@Controller('matchings')
export class MatchingController {
  constructor(private readonly service: MatchingService) {}

  @Post('run')
  @ApiOperation({ summary: '执行一轮匹配' })
  runMatching(@Body() dto: RunMatchingDto, @Body('actor') actor: { role: Role; id: string; name: string }) {
    return this.service.runMatching(dto, actor);
  }

  @Post('respond')
  @ApiOperation({ summary: '客户或阿姨应答匹配' })
  respond(@Body() dto: RespondMatchingDto) {
    if (dto.actorRole === Role.HOUSEKEEPER) {
      return this.service.respondHousekeeper(dto);
    }
    return this.service.respondCustomer(dto);
  }

  @Get('intake/:intakeId/latest')
  @ApiOperation({ summary: '查询最近一轮匹配' })
  getLatestRound(@Param('intakeId') intakeId: string) {
    return this.service.getLatestRound(intakeId);
  }

  @Get('intake/:intakeId/trace')
  @ApiOperation({ summary: '匹配回看 - 所有轮次的快照和尝试' })
  getTrace(@Param('intakeId') intakeId: string) {
    return this.service.getTrace(intakeId);
  }

  @Get('intake/:intakeId/failures')
  @ApiOperation({ summary: '失败原因分析' })
  analyzeFailures(@Param('intakeId') intakeId: string) {
    return this.service.analyzeFailures(intakeId);
  }

  @Get()
  @ApiOperation({ summary: '分页查询匹配尝试' })
  findAll(@Query() query: QueryMatchingDto) {
    return this.service.findAll(query);
  }
}
