const prisma = require('../prisma/client');

const createRegistration = async (req, res) => {
  try {
    const { announcementId, bidAmount } = req.body;

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
        bidAmount
      },
      include: {
        announcement: { include: { item: true } },
        bidder: { select: { id: true, name: true } }
      }
    });

    res.status(201).json({ message: 'Registration created successfully', registration });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserRegistrations = async (req, res) => {
  try {
    const registrations = await prisma.bidRegistration.findMany({
      where: { bidderId: req.user.id },
      include: {
        announcement: { include: { item: true } },
        deposit: { include: { paymentProcessor: { select: { id: true, name: true, role: true } }, refundProcessor: { select: { id: true, name: true, role: true } } } },
        transaction: { include: { confirmer: { select: { id: true, name: true, role: true } } } }
      },
      orderBy: { registrationTime: 'desc' }
    });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const payDeposit = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { amount, paymentMethod, transactionNumber } = req.body;

    const registration = await prisma.bidRegistration.findUnique({
      where: { id: registrationId },
      include: { deposit: true }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (registration.deposit && registration.deposit.status === 'PAID') {
      return res.status(400).json({ error: 'Deposit already paid' });
    }

    const updatedDeposit = await prisma.depositRecord.upsert({
      where: { registrationId },
      update: {
        amount,
        status: 'PAID',
        paymentTime: new Date(),
        paidBy: req.user.id,
        paymentMethod,
        transactionNumber
      },
      create: {
        registrationId,
        amount,
        status: 'PAID',
        paymentTime: new Date(),
        paidBy: req.user.id,
        paymentMethod,
        transactionNumber
      },
      include: {
        paymentProcessor: { select: { id: true, name: true, role: true } },
        refundProcessor: { select: { id: true, name: true, role: true } }
      }
    });

    const updatedRegistration = await prisma.bidRegistration.update({
      where: { id: registrationId },
      data: { status: 'DEPOSIT_PAID' },
      include: {
        announcement: { include: { item: true } },
        bidder: { select: { id: true, name: true } },
        deposit: { include: { paymentProcessor: { select: { id: true, name: true, role: true } }, refundProcessor: { select: { id: true, name: true, role: true } } } }
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
      where: { id: registrationId }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (registration.status !== 'DEPOSIT_PAID') {
      return res.status(400).json({ error: 'Registration must have deposit paid to be confirmed' });
    }

    const updatedRegistration = await prisma.bidRegistration.update({
      where: { id: registrationId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        confirmedBy: req.user.id
      },
      include: {
        announcement: { include: { item: true } },
        bidder: { select: { id: true, name: true } },
        deposit: { include: { paymentProcessor: { select: { id: true, name: true, role: true } }, refundProcessor: { select: { id: true, name: true, role: true } } } },
        confirmer: { select: { id: true, name: true, role: true } }
      }
    });

    res.json({ message: 'Registration confirmed successfully', registration: updatedRegistration });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const rejectRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { rejectionReason } = req.body;

    const registration = await prisma.bidRegistration.findUnique({
      where: { id: registrationId }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (registration.status === 'CONFIRMED') {
      return res.status(400).json({ error: 'Cannot reject a confirmed registration' });
    }

    const updatedRegistration = await prisma.bidRegistration.update({
      where: { id: registrationId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedBy: req.user.id,
        rejectionReason
      },
      include: {
        announcement: { include: { item: true } },
        bidder: { select: { id: true, name: true } },
        rejecter: { select: { id: true, name: true, role: true } }
      }
    });

    res.json({ message: 'Registration rejected successfully', registration: updatedRegistration });
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

    if (registration.status === 'CONFIRMED') {
      return res.status(400).json({ error: 'Cannot withdraw a confirmed registration' });
    }

    if (registration.deposit && registration.deposit.status === 'PAID') {
      await prisma.depositRecord.update({
        where: { registrationId },
        data: {
          status: 'REFUNDED',
          refundTime: new Date(),
          refundedBy: req.user.id,
          refundReason: 'Registration withdrawn by bidder'
        }
      });
    }

    const updatedRegistration = await prisma.bidRegistration.update({
      where: { id: registrationId },
      data: {
        status: 'WITHDRAWN',
        withdrawnAt: new Date()
      },
      include: {
        announcement: { include: { item: true } },
        bidder: { select: { id: true, name: true } },
        deposit: { include: { paymentProcessor: { select: { id: true, name: true, role: true } }, refundProcessor: { select: { id: true, name: true, role: true } } } }
      }
    });

    res.json({ message: 'Registration withdrawn successfully', registration: updatedRegistration });
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
        announcement: { include: { item: true, creator: { select: { id: true, name: true } } } },
        bidder: { select: { id: true, name: true, email: true, phone: true } },
        deposit: { include: { paymentProcessor: { select: { id: true, name: true, role: true } }, refundProcessor: { select: { id: true, name: true, role: true } } } },
        transaction: { include: { confirmer: { select: { id: true, name: true, role: true } } } },
        confirmer: { select: { id: true, name: true, role: true } },
        rejecter: { select: { id: true, name: true, role: true } }
      }
    });

    if (!registration) return res.status(404).json({ error: 'Registration not found' });
    res.json(registration);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllRegistrations = async (req, res) => {
  try {
    const { announcementId, status, page = 1, limit = 10 } = req.query;

    const where = {};
    if (announcementId) where.announcementId = announcementId;
    if (status) where.status = status;

    const registrations = await prisma.bidRegistration.findMany({
      where,
      skip: (page - 1) * limit,
      take: parseInt(limit),
      include: {
        announcement: { include: { item: true } },
        bidder: { select: { id: true, name: true } },
        deposit: { include: { paymentProcessor: { select: { id: true, name: true, role: true } }, refundProcessor: { select: { id: true, name: true, role: true } } } },
        transaction: { include: { confirmer: { select: { id: true, name: true, role: true } } } }
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
        deposit: { include: { paymentProcessor: { select: { id: true, name: true, role: true } }, refundProcessor: { select: { id: true, name: true, role: true } } } },
        transaction: { include: { confirmer: { select: { id: true, name: true, role: true } } } },
        confirmer: { select: { id: true, name: true, role: true } },
        rejecter: { select: { id: true, name: true, role: true } }
      }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const history = [];

    history.push({
      status: 'PENDING',
      timestamp: registration.registrationTime,
      description: 'Registration created'
    });

    if (registration.deposit?.paymentTime) {
      history.push({
        status: 'DEPOSIT_PAID',
        timestamp: registration.deposit.paymentTime,
        description: `Deposit paid by ${registration.deposit.paymentProcessor?.name || 'Unknown'}`,
        processor: registration.deposit.paymentProcessor
      });
    }

    if (registration.confirmedAt) {
      history.push({
        status: 'CONFIRMED',
        timestamp: registration.confirmedAt,
        description: `Confirmed by ${registration.confirmer?.name || 'Unknown'}`,
        confirmer: registration.confirmer
      });
    }

    if (registration.rejectedAt) {
      history.push({
        status: 'REJECTED',
        timestamp: registration.rejectedAt,
        description: `Rejected by ${registration.rejecter?.name || 'Unknown'}: ${registration.rejectionReason}`,
        rejecter: registration.rejecter,
        reason: registration.rejectionReason
      });
    }

    if (registration.withdrawnAt) {
      history.push({
        status: 'WITHDRAWN',
        timestamp: registration.withdrawnAt,
        description: 'Registration withdrawn by bidder'
      });

      if (registration.deposit?.refundTime) {
        history.push({
          status: 'DEPOSIT_REFUNDED',
          timestamp: registration.deposit.refundTime,
          description: `Deposit refunded by ${registration.deposit.refundProcessor?.name || 'Unknown'}: ${registration.deposit.refundReason}`,
          processor: registration.deposit.refundProcessor,
          reason: registration.deposit.refundReason
        });
      }
    }

    history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({ registrationId: id, history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const confirmTransaction = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { finalPrice, contractNumber } = req.body;

    const registration = await prisma.bidRegistration.findUnique({
      where: { id: registrationId }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (registration.status !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Registration must be confirmed first' });
    }

    const transaction = await prisma.transactionConfirmation.upsert({
      where: { registrationId },
      update: {
        status: 'CONFIRMED',
        finalPrice,
        confirmedAt: new Date(),
        confirmedBy: req.user.id,
        contractNumber
      },
      create: {
        registrationId,
        status: 'CONFIRMED',
        finalPrice,
        confirmedAt: new Date(),
        confirmedBy: req.user.id,
        contractNumber
      },
      include: {
        confirmer: { select: { id: true, name: true, role: true } }
      }
    });

    res.json({ message: 'Transaction confirmed successfully', transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createRegistration,
  getUserRegistrations,
  payDeposit,
  confirmRegistration,
  rejectRegistration,
  withdrawRegistration,
  getRegistrationById,
  getAllRegistrations,
  getRegistrationStatusHistory,
  confirmTransaction
};