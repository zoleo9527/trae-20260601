const prisma = require('../prisma/client');

const createAnnouncement = async (req, res) => {
  try {
    const { title, content, itemId, startTime, endTime } = req.body;
    
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        itemId,
        startTime,
        endTime,
        creatorId: req.user.id
      },
      include: {
        item: true,
        creator: { select: { id: true, name: true } }
      }
    });

    res.status(201).json({ message: 'Announcement created successfully', announcement });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const submitForReview = async (req, res) => {
  try {
    const { id } = req.params;
    
    const announcement = await prisma.announcement.findUnique({ where: { id } });
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (announcement.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only draft announcements can be submitted for review' });
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: { status: 'PENDING_REVIEW' },
      include: {
        item: true,
        creator: { select: { id: true, name: true } }
      }
    });

    res.json({ message: 'Announcement submitted for review', announcement: updatedAnnouncement });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const reviewAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;
    
    const announcement = await prisma.announcement.findUnique({ where: { id } });
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (announcement.status !== 'PENDING_REVIEW') {
      return res.status(400).json({ error: 'Only pending review announcements can be reviewed' });
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid review status' });
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: { status },
      include: {
        item: true,
        creator: { select: { id: true, name: true } }
      }
    });

    await prisma.announcementApproval.create({
      data: {
        announcementId: id,
        reviewerId: req.user.id,
        status,
        comment
      }
    });

    res.json({ message: 'Announcement reviewed', announcement: updatedAnnouncement });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const publishAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    
    const announcement = await prisma.announcement.findUnique({ where: { id } });
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (announcement.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Only approved announcements can be published' });
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: { 
        status: 'PUBLISHED',
        publishedAt: new Date()
      },
      include: {
        item: true,
        creator: { select: { id: true, name: true } }
      }
    });

    res.json({ message: 'Announcement published', announcement: updatedAnnouncement });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        item: true,
        creator: { select: { id: true, name: true } },
        approvals: { 
          include: { reviewer: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        },
        registrations: { select: { id: true, bidderId: true, status: true } }
      }
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json(announcement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllAnnouncements = async (req, res) => {
  try {
    const { status, itemType, page = 1, limit = 10 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (itemType) {
      where.item = { itemType };
    }

    const announcements = await prisma.announcement.findMany({
      where,
      skip: (page - 1) * limit,
      take: parseInt(limit),
      include: {
        item: true,
        creator: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.announcement.count({ where });

    res.json({
      announcements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, itemId, startTime, endTime } = req.body;
    
    const announcement = await prisma.announcement.findUnique({ where: { id } });
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (announcement.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only draft announcements can be updated' });
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: {
        title,
        content,
        itemId,
        startTime,
        endTime
      },
      include: {
        item: true,
        creator: { select: { id: true, name: true } }
      }
    });

    res.json({ message: 'Announcement updated', announcement: updatedAnnouncement });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    
    const announcement = await prisma.announcement.findUnique({ where: { id } });
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (announcement.status === 'PUBLISHED') {
      return res.status(400).json({ error: 'Cannot delete a published announcement' });
    }

    await prisma.announcement.delete({ where: { id } });
    
    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAnnouncementStatusHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true } },
        approvals: {
          include: { reviewer: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const history = [];

    history.push({
      status: 'DRAFT',
      timestamp: announcement.createdAt,
      description: `Created by ${announcement.creator.name}`,
      user: announcement.creator
    });

    if (announcement.status === 'PENDING_REVIEW') {
      history.push({
        status: 'PENDING_REVIEW',
        timestamp: announcement.updatedAt,
        description: 'Submitted for review'
      });
    }

    for (const approval of announcement.approvals) {
      history.push({
        status: approval.status,
        timestamp: approval.createdAt,
        description: `${approval.status === 'APPROVED' ? 'Approved' : 'Rejected'} by ${approval.reviewer.name}`,
        comment: approval.comment,
        reviewer: approval.reviewer
      });
    }

    if (announcement.status === 'PUBLISHED') {
      history.push({
        status: 'PUBLISHED',
        timestamp: announcement.publishedAt,
        description: 'Published'
      });
    }

    res.json({ announcementId: id, history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPendingReviewCount = async (req, res) => {
  try {
    const count = await prisma.announcement.count({
      where: { status: 'PENDING_REVIEW' }
    });

    res.json({ pendingReviewCount: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createAnnouncement,
  submitForReview,
  reviewAnnouncement,
  publishAnnouncement,
  getAnnouncementById,
  getAllAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementStatusHistory,
  getPendingReviewCount
};