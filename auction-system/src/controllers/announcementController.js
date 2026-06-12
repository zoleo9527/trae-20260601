const prisma = require('../prisma/client');

const createAnnouncement = async (req, res) => {
  try {
    const { title, content, itemId, startTime, endTime } = req.body;
    
    const item = await prisma.auctionItem.findUnique({ where: { id: itemId } });
    if (!item) {
      return res.status(404).json({ error: 'Auction item not found' });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        itemId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        creatorId: req.user.id,
        status: 'DRAFT'
      },
      include: {
        item: { select: { id: true, name: true, basePrice: true } },
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
    
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: { approvals: true }
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (announcement.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only draft announcements can be submitted for review' });
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: { status: 'PENDING_REVIEW' },
      include: {
        item: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
        approvals: {
          include: { reviewer: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json({ message: 'Announcement submitted for review', announcement: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const reviewAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    if (!['REVIEWED', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const announcement = await prisma.announcement.findUnique({ where: { id } });
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (announcement.status === 'REJECTED') {
      return res.status(400).json({ error: 'Rejected announcements cannot be reviewed again' });
    }

    await prisma.announcementApproval.create({
      data: {
        announcementId: id,
        reviewerId: req.user.id,
        status: status,
        comment
      }
    });

    const updated = await prisma.announcement.update({
      where: { id },
      data: { status },
      include: {
        item: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
        approvals: {
          include: { reviewer: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json({ message: 'Review completed', announcement: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const publishAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: { approvals: true }
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (announcement.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Only approved announcements can be published' });
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: { 
        status: 'PUBLISHED',
        publishedAt: new Date()
      },
      include: {
        item: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
        approvals: {
          include: { reviewer: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json({ message: 'Announcement published successfully', announcement: updated });
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
        item: { select: { id: true, name: true, basePrice: true, description: true } },
        creator: { select: { id: true, name: true } },
        approvals: {
          include: { reviewer: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        },
        attachments: { select: { id: true, fileName: true, fileType: true, uploadedAt: true } },
        registrations: {
          include: {
            bidder: { select: { id: true, name: true } },
            deposit: { select: { status: true, amount: true } }
          }
        }
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
    const { status, page = 1, limit = 10 } = req.query;
    
    const where = status ? { status } : {};
    
    const announcements = await prisma.announcement.findMany({
      where,
      skip: (page - 1) * limit,
      take: parseInt(limit),
      include: {
        item: { select: { id: true, name: true, basePrice: true } },
        creator: { select: { id: true, name: true } },
        approvals: {
          include: { reviewer: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        }
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
    const { title, content, startTime, endTime } = req.body;
    
    const announcement = await prisma.announcement.findUnique({ where: { id } });
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (announcement.status === 'PUBLISHED') {
      return res.status(400).json({ error: 'Published announcements cannot be modified' });
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        title,
        content,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        status: announcement.status !== 'DRAFT' ? 'PENDING_REVIEW' : 'DRAFT'
      },
      include: {
        item: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } }
      }
    });

    res.json({ message: 'Announcement updated successfully', announcement: updated });
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
      return res.status(400).json({ error: 'Published announcements cannot be deleted' });
    }

    await prisma.announcement.delete({ where: { id } });
    
    res.json({ message: 'Announcement deleted successfully' });
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
        approvals: {
          include: {
            reviewer: { select: { id: true, name: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        creator: { select: { id: true, name: true, role: true } }
      }
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const history = [];
    
    history.push({
      timestamp: announcement.createdAt,
      action: 'CREATED',
      user: {
        id: announcement.creator.id,
        name: announcement.creator.name,
        role: announcement.creator.role
      },
      status: 'DRAFT',
      comment: '公告创建'
    });

    announcement.approvals.forEach(approval => {
      let action = '';
      let comment = '';
      
      switch (approval.status) {
        case 'REVIEWED':
          action = 'REVIEWED';
          comment = approval.comment || '已审核';
          break;
        case 'APPROVED':
          action = 'APPROVED';
          comment = approval.comment || '已批准';
          break;
        case 'REJECTED':
          action = 'REJECTED';
          comment = approval.comment || '已拒绝';
          break;
      }

      history.push({
        timestamp: approval.createdAt,
        action,
        user: {
          id: approval.reviewer.id,
          name: approval.reviewer.name,
          role: approval.reviewer.role
        },
        status: approval.status,
        comment
      });
    });

    if (announcement.status === 'PUBLISHED' && announcement.publishedAt) {
      history.push({
        timestamp: announcement.publishedAt,
        action: 'PUBLISHED',
        user: { id: announcement.creator.id, name: announcement.creator.name, role: announcement.creator.role },
        status: 'PUBLISHED',
        comment: '公告已发布'
      });
    }

    res.json({
      announcement: {
        id: announcement.id,
        title: announcement.title,
        currentStatus: announcement.status
      },
      history
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPendingReviewCount = async (req, res) => {
  try {
    const count = await prisma.announcement.count({
      where: { status: 'PENDING_REVIEW' }
    });
    res.json({ count });
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