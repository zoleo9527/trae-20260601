import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestContext {
  requestId: string;
  userId: string;
  userName: string;
  userRole: string;
  storeId: string;
  storeName: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof RequestContext, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const context = request.context as RequestContext;
    return data ? context?.[data] : context;
  },
);

export const Context = createParamDecorator(
  (_, ctx: ExecutionContext): RequestContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.context as RequestContext;
  },
);
