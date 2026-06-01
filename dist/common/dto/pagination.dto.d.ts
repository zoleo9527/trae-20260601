export declare class PaginationQueryDto {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export declare function createPaginatedResult<T>(items: T[], total: number, page: number, pageSize: number): PaginatedResult<T>;
