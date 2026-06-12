import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../prisma/client'
import { UserRole } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'auction_jwt_secret_key_2024'
const JWT_EXPIRES_IN = '24h'

export const register = async (username: string, password: string, realName: string, role: UserRole, phone?: string, email?: string) => {
  const existingUser = await prisma.user.findUnique({ where: { username } })
  if (existingUser) {
    throw new Error('用户名已存在')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      realName,
      role,
      phone,
      email
    }
  })

  await prisma.operationLog.create({
    data: {
      operatorId: user.id,
      operatorName: user.realName,
      operationType: 'REGISTER',
      targetType: 'USER',
      targetId: user.id,
      description: `用户注册: ${user.realName}`
    }
  })

  return user
}

export const login = async (username: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    throw new Error('用户名或密码错误')
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    throw new Error('用户名或密码错误')
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )

  await prisma.operationLog.create({
    data: {
      operatorId: user.id,
      operatorName: user.realName,
      operationType: 'LOGIN',
      targetType: 'USER',
      targetId: user.id,
      description: `用户登录: ${user.realName}`
    }
  })

  return { user, token }
}

export const getUserById = async (userId: string) => {
  return prisma.user.findUnique({ where: { id: userId } })
}

export const getAllUsers = async () => {
  return prisma.user.findMany({ select: { id: true, username: true, realName: true, role: true, phone: true, email: true, createdAt: true } })
}

export const updateUser = async (userId: string, data: Partial<{ realName: string; phone: string; email: string }>) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new Error('用户不存在')
  }

  return prisma.user.update({
    where: { id: userId },
    data
  })
}

export const deleteUser = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new Error('用户不存在')
  }

  return prisma.user.delete({ where: { id: userId } })
}