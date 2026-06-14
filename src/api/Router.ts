export interface Request {
  method: string;
  path: string;
  params?: Record<string, string>;
  query?: Record<string, string | string[] | undefined>;
  body?: Record<string, unknown>;
}

export interface Response {
  status: number;
  json: (data: unknown) => void;
}

export type Handler = (req: Request, res: Response) => void;

export interface Router {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  handler: Handler;
}