import { ApiProperty } from '@nestjs/swagger';

export class BatchApproveResultItemDto {
  @ApiProperty({ description: '调拨单ID' })
  id: string;

  @ApiProperty({ description: '是否成功' })
  success: boolean;

  @ApiProperty({ description: '错误码' })
  code?: string;

  @ApiProperty({ description: '消息' })
  message?: string;
}

export class BatchApproveResultDto {
  @ApiProperty({ description: '成功数量' })
  successCount: number;

  @ApiProperty({ description: '失败数量' })
  failCount: number;

  @ApiProperty({ type: [BatchApproveResultItemDto], description: '详细结果' })
  results: BatchApproveResultItemDto[];
}
