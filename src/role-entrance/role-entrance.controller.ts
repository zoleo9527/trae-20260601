import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DataStoreService } from '../common/data-store.service';
import { UserRole } from '../common/interfaces/user.interface';

@ApiTags('role-entrance')
@Controller('api/role-entrance')
export class RoleEntranceController {
  constructor(private readonly dataStore: DataStoreService) {}

  @Get('users')
  @ApiOperation({ summary: '获取所有用户列表' })
  @ApiQuery({ name: 'role', required: false, enum: ['dorm_manager', 'logistics_supervisor', 'maintenance_worker'] })
  async getUsers(@Query('role') role?: UserRole) {
    let users = this.dataStore.getUsers();
    if (role) {
      users = users.filter(u => u.role === role);
    }
    return users;
  }

  @Get('workbench')
  @ApiOperation({ summary: '获取角色工作台数据' })
  @ApiQuery({ name: 'role', required: true, enum: ['dorm_manager', 'logistics_supervisor', 'maintenance_worker'] })
  @ApiQuery({ name: 'userId', required: true })
  async getWorkbench(@Query('role') role: UserRole, @Query('userId') userId: string) {
    return {
      role,
      userId,
      message: `欢迎使用${this.getRoleName(role)}工作台`,
    };
  }

  private getRoleName(role: UserRole): string {
    const roleNames = {
      dorm_manager: '宿管',
      logistics_supervisor: '后勤主管',
      maintenance_worker: '维修师傅',
    };
    return roleNames[role] || role;
  }
}
