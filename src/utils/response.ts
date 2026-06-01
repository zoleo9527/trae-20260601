import { Request, Response } from 'express';
import { FindManyOptions, Like } from 'typeorm';

export function parseListQuery(req: Request): FindManyOptions {
  const { page = 1, pageSize = 20, sortBy = 'id', sortOrder = 'DESC', ...filters } = req.query;
  
  const options: FindManyOptions = {
    skip: (Number(page) - 1) * Number(pageSize),
    take: Number(pageSize),
    order: { [sortBy as string]: sortOrder as 'ASC' | 'DESC' },
  };

  const where: any = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      if (String(value).includes('%')) {
        where[key] = Like(value as string);
      } else {
        where[key] = value;
      }
    }
  });

  if (Object.keys(where).length > 0) {
    options.where = where;
  }

  return options;
}

export function successResponse(res: Response, data: any, message = 'Success') {
  return res.json({ success: true, message, data });
}

export function errorResponse(res: Response, error: string, status = 400) {
  return res.status(status).json({ success: false, error });
}

export function paginatedResponse(res: Response, data: any[], total: number, page: number, pageSize: number) {
  return res.json({
    success: true,
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
