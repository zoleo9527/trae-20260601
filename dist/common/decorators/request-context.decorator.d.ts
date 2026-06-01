export interface RequestContext {
    requestId: string;
    userId: string;
    userName: string;
    userRole: string;
    storeId: string;
    storeName: string;
}
export declare const CurrentUser: (...dataOrPipes: (keyof RequestContext | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>>)[]) => ParameterDecorator;
export declare const Context: (...dataOrPipes: any[]) => ParameterDecorator;
