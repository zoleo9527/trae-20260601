import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';

export class LoginResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  username: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  userId: string;
}
