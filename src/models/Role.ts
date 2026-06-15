export enum Role {
  FRONT_DESK = 'FRONT_DESK',
  TECHNICIAN = 'TECHNICIAN',
  STORE_MANAGER = 'STORE_MANAGER',
  ADMIN = 'ADMIN'
}

export const RoleDescription: Record<Role, string> = {
  [Role.FRONT_DESK]: '前台',
  [Role.TECHNICIAN]: '技师',
  [Role.STORE_MANAGER]: '店长',
  [Role.ADMIN]: '管理员'
};

export default Role;