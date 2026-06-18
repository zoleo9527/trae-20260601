import { ApiProperty } from '@nestjs/swagger';

export class ListResponseDto<T> {
  @ApiProperty({ description: '数据列表' })
  list: T[];

  @ApiProperty({ description: '总条数' })
  total: number;

  @ApiProperty({ description: '当前页码' })
  page: number;

  @ApiProperty({ description: '每页条数' })
  pageSize: number;

  constructor(list: T[], total: number, page: number, pageSize: number) {
    this.list = list;
    this.total = total;
    this.page = page;
    this.pageSize = pageSize;
  }
}
