import prisma from '../prisma/client'
import { AnnouncementStatus } from '@prisma/client'

export const createAnnouncement = async (
  title: string,
  content: string,
  assetName: string,
  assetLocation: string,
  basePrice: number,
  auctionDate: Date,
  endDate: Date,
  depositAmount: number,
  createdById: string,
  operatorName: string
) => {
  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      assetName,
      assetLocation,
      basePrice: new Prisma.Decimal(basePrice),
      auctionDate,
      endDate,
      depositAmount: new Prisma.Decimal(depositAmount),
      createdById
    }
  })

  await prisma.operationLog.create({
    data: {
      operatorId: createdById,
      operatorName,
      operationType: 'CREATE_ANNOUNCEMENT',
      targetType: 'ANNOUNCEMENT',
      targetId: announcement.id,
      description: `创建公告: ${title}`
    }
  })

  return announcement
}

export const submitForReview = async (announcementId: string, operatorId: string, operatorName: string) => {
  const announcement = await prisma.announcement.findUnique({ where: { id: announcementId } })
  if (!announcement) {
    throw new Error('公告不存在')
  }

  if (announcement.status !== AnnouncementStatus.DRAFT) {
    throw new Error('只能提交草稿状态的公告')
  }

  const beforeData = { status: announcement.status }
  
  const updated = await prisma.announcement.update({
    where: { id: announcementId },
    data: { status: AnnouncementStatus.PENDING_REVIEW }
  })

  await prisma.operationLog.create({
    data: {
      operatorId,
      operatorName,
      operationType: 'SUBMIT_REVIEW',
      targetType: 'ANNOUNCEMENT',
      targetId: announcementId,
      description: `提交审核公告: ${announcement.title}`,
      beforeData,
      afterData: { status: updated.status }
    }
  })

  return updated
}

export const reviewAnnouncement = async (
  announcementId: string,
  reviewedById: string,
  reviewedByName: string,
  approved: boolean
) => {
  const announcement = await prisma.announcement.findUnique({ where: { id: announcementId } })
  if (!announcement) {
    throw new Error('公告不存在')
  }

  if (announcement.status !== AnnouncementStatus.PENDING_REVIEW) {
    throw new Error('只能审核待审核状态的公告')
  }

  const beforeData = { status: announcement.status }
  const newStatus = approved ? AnnouncementStatus.APPROVED : AnnouncementStatus.DRAFT

  const updated = await prisma.announcement.update({
    where: { id: announcementId },
    data: { status: newStatus, reviewedById }
  })

  await prisma.operationLog.create({
    data: {
      operatorId: reviewedById,
      operatorName: reviewedByName,
      operationType: approved ? 'APPROVE_ANNOUNCEMENT' : 'REJECT_ANNOUNCEMENT',
      targetType: 'ANNOUNCEMENT',
      targetId: announcementId,
      description: `${approved ? '通过' : '拒绝'}审核公告: ${announcement.title}`,
      beforeData,
      afterData: { status: updated.status, reviewedById }
    }
  })

  return updated
}

export const publishAnnouncement = async (announcementId: string, operatorId: string, operatorName: string) => {
  const announcement = await prisma.announcement.findUnique({ where: { id: announcementId } })
  if (!announcement) {
    throw new Error('公告不存在')
  }

  if (announcement.status !== AnnouncementStatus.APPROVED) {
    throw new Error('只能发布已审核通过的公告')
  }

  const beforeData = { status: announcement.status }
  
  const updated = await prisma.announcement.update({
    where: { id: announcementId },
    data: { 
      status: AnnouncementStatus.PUBLISHED,
      publishedAt: new Date()
    }
  })

  await prisma.operationLog.create({
    data: {
      operatorId,
      operatorName,
      operationType: 'PUBLISH_ANNOUNCEMENT',
      targetType: 'ANNOUNCEMENT',
      targetId: announcementId,
      description: `发布公告: ${announcement.title}`,
      beforeData,
      afterData: { status: updated.status, publishedAt: updated.publishedAt }
    }
  })

  return updated
}

export const withdrawAnnouncement = async (announcementId: string, operatorId: string, operatorName: string) => {
  const announcement = await prisma.announcement.findUnique({ where: { id: announcementId } })
  if (!announcement) {
    throw new Error('公告不存在')
  }

  if (announcement.status !== AnnouncementStatus.PUBLISHED) {
    throw new Error('只能撤回已发布的公告')
  }

  const beforeData = { status: announcement.status }
  
  const updated = await prisma.announcement.update({
    where: { id: announcementId },
    data: { 
      status: AnnouncementStatus.WITHDRAWN,
      withdrawnAt: new Date()
    }
  })

  await prisma.operationLog.create({
    data: {
      operatorId,
      operatorName,
      operationType: 'WITHDRAW_ANNOUNCEMENT',
      targetType: 'ANNOUNCEMENT',
      targetId: announcementId,
      description: `撤回公告: ${announcement.title}`,
      beforeData,
      afterData: { status: updated.status, withdrawnAt: updated.withdrawnAt }
    }
  })

  return updated
}

export const getAnnouncementById = async (announcementId: string) => {
  return prisma.announcement.findUnique({
    where: { id: announcementId },
    include: {
      createdBy: { select: { id: true, realName: true, role: true } },
      reviewedBy: { select: { id: true, realName: true, role: true } },
      attachments: true,
      bids: {
        select: { id: true, bidderName: true, status: true, createdAt: true }
      }
    }
  })
}

export const getAnnouncements = async (status?: AnnouncementStatus) => {
  const where = status ? { status } : {}
  return prisma.announcement.findMany({
    where,
    include: {
      createdBy: { select: { id: true, realName: true, role: true } },
      reviewedBy: { select: { id: true, realName: true, role: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export const updateAnnouncement = async (
  announcementId: string,
  data: Partial<{
    title: string
    content: string
    assetName: string
    assetLocation: string
    basePrice: number
    auctionDate: Date
    endDate: Date
    depositAmount: number
  }>,
  operatorId: string,
  operatorName: string
) => {
  const announcement = await prisma.announcement.findUnique({ where: { id: announcementId } })
  if (!announcement) {
    throw new Error('公告不存在')
  }

  if (announcement.status !== AnnouncementStatus.DRAFT) {
    throw new Error('只能修改草稿状态的公告')
  }

  const beforeData = { ...announcement }
  const updateData: any = {}
  
  if (data.basePrice !== undefined) updateData.basePrice = new Prisma.Decimal(data.basePrice)
  if (data.depositAmount !== undefined) updateData.depositAmount = new Prisma.Decimal(data.depositAmount)
  if (data.title !== undefined) updateData.title = data.title
  if (data.content !== undefined) updateData.content = data.content
  if (data.assetName !== undefined) updateData.assetName = data.assetName
  if (data.assetLocation !== undefined) updateData.assetLocation = data.assetLocation
  if (data.auctionDate !== undefined) updateData.auctionDate = data.auctionDate
  if (data.endDate !== undefined) updateData.endDate = data.endDate

  const updated = await prisma.announcement.update({
    where: { id: announcementId },
    data: updateData
  })

  await prisma.operationLog.create({
    data: {
      operatorId,
      operatorName,
      operationType: 'UPDATE_ANNOUNCEMENT',
      targetType: 'ANNOUNCEMENT',
      targetId: announcementId,
      description: `更新公告: ${updated.title}`,
      beforeData,
      afterData: { ...updated }
    }
  })

  return updated
}

export const deleteAnnouncement = async (announcementId: string, operatorId: string, operatorName: string) => {
  const announcement = await prisma.announcement.findUnique({ where: { id: announcementId } })
  if (!announcement) {
    throw new Error('公告不存在')
  }

  if (announcement.status === AnnouncementStatus.PUBLISHED) {
    throw new Error('已发布的公告不能删除')
  }

  await prisma.operationLog.create({
    data: {
      operatorId,
      operatorName,
      operationType: 'DELETE_ANNOUNCEMENT',
      targetType: 'ANNOUNCEMENT',
      targetId: announcementId,
      description: `删除公告: ${announcement.title}`
    }
  })

  return prisma.announcement.delete({ where: { id: announcementId } })
}