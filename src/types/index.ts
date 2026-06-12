export interface TokenPayload {
  userId: string
  username: string
  role: string
}

export interface RequestUser {
  userId: string
  username: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser
    }
  }
}