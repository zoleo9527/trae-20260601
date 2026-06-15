import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContext } from '../common/role';

export const CurrentUser = createParamDecorator(
  (data: keyof UserContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserContext;

    if (data) {
      return user?.[data];
    }

    return user;
  }
);