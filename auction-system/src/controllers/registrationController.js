const prisma = require('../prisma/client');

const createRegistration = async (req, res) => {
  try {
    const { announcementId, bidAmount } = req.body;
    
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: { item: true }
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (announcement.status !== 'PUBLISHED') {
      return res.status(400).json({ error: 'Only published announcements accept registrations' });
    }

    if (new Date() > new Date(announcement.endTime)) {
      return res.status(400).json({ error: 'Auction has ended' });
    }

    const existingRegistration = await prisma.bidRegistration.findFirst({
      where: { announcementId, bidderId: req.user.id }
    });

    if (existingRegistration) {
      return res.status(400).json({ error: 'You have already registered for this auction' });
    }

    const registration = await prisma.bidRegistration.create({
      data: {
        announcementId,
        bidderId: req.user.id,
        bidAmount,
        status: 'PENDING'
      },
      include: {
        announcement: { include: { item: true } },
        bidder: { select: { id: true, name: true, email: true } }
      }
    });

    await prisma.depositRecord.create({
      data: {
        registrationId: registration.id,
        amount: (bidAmount * 0.1).toFixed(2),
        status: 'UNPAID'
      }
    });

    res.status(201).json({ message: 'Registration successful', registration });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const payDeposit = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { paymentMethod, transactionNumber } = req.body;
    
    const registration = await prisma.bidRegistration.findUnique({
      where: { id: registrationId },
      include: { deposit: true }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (req.user.role === 'BIDDER' && registration.bidderId !== req.user.id) {
      return res.status(403).json({ error: 'You can only pay for your own registration' });
    }

    if (!registration.deposit) {
      return res.status(400).json({ error: 'Deposit record not found' });
    }

    if (registration.deposit.status !== 'UNPAID') {
      return res.status(400).json({ error: 'Deposit has already been processed' });
    }

    const updatedDeposit = await prisma.depositRecord.update({
      where: { id: registration.deposit.id },
      data: {
        status: 'PAID',
        paymentTime: new Date(),
        paymentMethod,
        transactionNumber
      }
    });

    const updatedRegistration = await prisma.bidRegistration.update({
      where: { id: registrationId },
      data: { status: 'DEPOSIT_PAID' },
      include: {
        announcement: { include: { item: true } },
        bidder: { select: { id: true, name: true } },
        deposit: true
      }
    });

    res.json({ message: 'Deposit paid successfully', registration: updatedRegistration, deposit: updatedDeposit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const confirmRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    
    const registration = await prisma.bidRegistration.findUnique({
      where: { id: registrationId },
      include: { deposit: true, announcement: true }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (registration.status !== 'DEPOSIT_PAID') {
      return res.status(400).json({ error: 'Registration must have deposit paid before confirmation' });
    }

    const updated = await prisma.bidRegistration.update({
      where: { id: registrationId },
      data: { 
        status: 'CONFIRMED',
        confirmedAt: new Date()
      },
      include: {
        announcement: { include: { item: true } },
        bidder: { select: { id: true, name: true, email: true } },
        deposit: true
      }
    });

    await prisma.transactionConfirmation.create({
      data: {
        registrationId: registrationId,
        finalPrice: registration.bidAmount,
        status: 'PENDING'
      }
    });

    res.json({ message: 'Registration confirmed successfully', registration: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const rejectRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { reason } = req.body;
    
    const registration = await prisma.bidRegistration.findUnique({
      where: { id: registrationId },
      include: { deposit: true }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (registration.status === 'CONFIRMED') {
      return res.status(400).json({ error: 'Cannot reject a confirmed registration' });
    }

    const updated = await prisma.bidRegistration.update({
      where: { id: registrationId },
      data: { 
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason
      },
      include: {
        announcement: { include: { item: true } },
        bidder: { select: { id: true, name: true } },
        deposit: true
      }
    });

    if (registration.deposit && registration.deposit.status === 'PAID') {
      await prisma.depositRecord.update({
        where: { id: registration.deposit.id },
        data: { status: 'REFUNDED', refundTime: new Date() }
      });
    }

    res.json({ message: 'Registration rejected', registration: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const withdrawRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    
    const registration = await prisma.bidRegistration.findUnique({
      where: { id: registrationId },
      include: { deposit: true }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (req.user.role === 'BIDDER' && registration.bidderId !== req.user.id) {
      return res.status(403).json({ error: 'You can only withdraw your own registration' });
    }

    if (registration.status === 'CONFIRMED') {
      return res.status(400).json({ error: 'Cannot withdraw a confirmed registration' });
    }

    const updated = await prisma.bidRegistration.update({
      where: { id: registrationId },
      data: { status: 'WITHDRAWN' },
      include: {
        announcement: { include: { item: true } },
        bidder: { select: { id: true, name: true } },
        deposit: true
      }
    });

    if (registration.deposit && registration.deposit.status === 'PAID') {
      await prisma.depositRecord.update({
        where: { id: registration.deposit.id },
        data: { status: 'REFUNDED', refundTime: new Date() }
      });
    }

    res.json({ message: 'Registration withdrawn', registration: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const registration = await prisma.bidRegistration.findUnique({
      where: { id },
      include: {
        announcement: { 
          include: { 
            item: true,
            creator: { select: { id: true, name: true } }
          } 
        },
        bidder: { select: { id: true, name: true, email: true, phone: true } },
        deposit: true,
        transaction: true
      }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    res.json(registration);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllRegistrations = async (req, res) => {
  try {
    const { announcementId, status, bidderId, page = 1, limit = 10 } = req.query;
    
    const where = {};
    if (announcementId) where.announcementId = announcementId;
    if (status) where.status = status;
    if (bidderId) where.bidderId = bidderId;

    const registrations = await prisma.bidRegistration.findMany({
      where,
      skip: (page - 1) * limit,
      take: parseInt(limit),
      include: {
        announcement: { include: { item: true } },
        bidder: { select: { id: true, name: true } },
        deposit: true
      },
      orderBy: { registrationTime: 'desc' }
    });

    const total = await prisma.bidRegistration.count({ where });

    res.json({
      registrations,
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

const getUserRegistrations = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const where = { bidderId: req.user.id };
    if (status) where.status = status;

    const registrations = await prisma.bidRegistration.findMany({
      where,
      skip: (page - 1) * limit,
      take: parseInt(limit),
      include: {
        announcement: { include: { item: true } },
        deposit: true,
        transaction: true
      },
      orderBy: { registrationTime: 'desc' }
    });

    const total = await prisma.bidRegistration.count({ where });

    res.json({
      registrations,
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

const getRegistrationStatusHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const registration = await prisma.bidRegistration.findUnique({
      where: { id },
      include: {
        bidder: { select: { id: true, name: true, role: true } },
        deposit: true,
        announcement: { include: { creator: { select: { id: true, name: true, role: true } } } }
      }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const history = [];
    
    history.push({
      timestamp: registration.registrationTime,
      action: 'REGISTERED',
      user: {
        id: registration.bidder.id,
        name: registration.bidder.name,
        role: registration.bidder.role
      },
      status: 'PENDING',
      comment: '报名成功'
    });

    if (registration.deposit) {
      switch (registration.deposit.status) {
        case 'PAID':
          history.push({
            timestamp: registration.deposit.paymentTime,
            action: 'DEPOSIT_PAID',
            user: { id: registration.bidder.id, name: registration.bidder.name, role: registration.bidder.role },
            status: 'DEPOSIT_PAID',
            comment: `保证金已支付 ¥${registration.deposit.amount}`
          });
          break;
        case 'REFUNDED':
          history.push({
            timestamp: registration.deposit.refundTime,
            action: 'DEPOSIT_REFUNDED',
            user: { id: registration.bidder.id, name: registration.bidder.name, role: registration.bidder.role },
            status: 'DEPOSIT_REFUNDED',
            comment: '保证金已退还'
          });
          break;
      }
    }

    if (registration.status === 'CONFIRMED' && registration.confirmedAt) {
      history.push({
        timestamp: registration.confirmedAt,
        action: 'CONFIRMED',
        user: { id: registration.announcement.creator.id, name: registration.announcement.creator.name, role: registration.announcement.creator.role },
        status: 'CONFIRMED',
        comment: '报名已确认'
      });
    }

    if (registration.status === 'REJECTED' && registration.rejectedAt) {
      history.push({
        timestamp: registration.rejectedAt,
        action: 'REJECTED',
        user: { id: registration.announcement.creator.id, name: registration.announcement.creator.name, role: registration.announcement.creator.role },
        status: 'REJECTED',
        comment: registration.rejectionReason || '报名被拒绝'
      });
    }

    if (registration.status === 'WITHDRAWN') {
      history.push({
        timestamp: new Date(),
        action: 'WITHDRAWN',
        user: { id: registration.bidder.id, name: registration.bidder.name, role: registration.bidder.role },
        status: 'WITHDRAWN',
        comment: '报名已撤回'
      });
    }

    res.json({
      registration: {
        id: registration.id,
        bidAmount: registration.bidAmount,
        currentStatus: registration.status
      },
      history
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const confirmTransaction = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { contractNumber } = req.body;
    
    const registration = await prisma.bidRegistration.findUnique({
      where: { id: registrationId },
      include: { transaction: true }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (registration.status !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Only confirmed registrations can have transactions' });
    }

    if (!registration.transaction) {
      return res.status(400).json({ error: 'Transaction record not found' });
    }

    const updatedTransaction = await prisma.transactionConfirmation.update({
      where: { id: registration.transaction.id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        contractNumber
      }
    });

    res.json({ message: 'Transaction confirmed', transaction: updatedTransaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createRegistration,
  payDeposit,
  confirmRegistration,
  rejectRegistration,
  withdrawRegistration,
  getRegistrationById,
  getAllRegistrations,
  getUserRegistrations,
  getRegistrationStatusHistory,
  confirmTransaction
};