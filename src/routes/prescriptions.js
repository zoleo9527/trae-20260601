const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

function parsePrescription(prescription) {
  if (prescription.medicines && typeof prescription.medicines === 'string') {
    prescription.medicines = JSON.parse(prescription.medicines);
  }
  return prescription;
}

function parseSupplement(supplement) {
  if (supplement.requirements && typeof supplement.requirements === 'string') {
    supplement.requirements = JSON.parse(supplement.requirements);
  }
  if (supplement.supplementContent && typeof supplement.supplementContent === 'string') {
    supplement.supplementContent = JSON.parse(supplement.supplementContent);
  }
  return supplement;
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      riskLevel,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const where = {};

    if (status) {
      where.status = status;
    }

    if (riskLevel) {
      where.riskLevel = riskLevel;
    }

    if (search) {
      where.OR = [
        { prescriptionNo: { contains: search } },
        { patient: { name: { contains: search } } },
        { doctor: { contains: search } }
      ];
    }

    let prescriptions = await prisma.prescription.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { [sortBy]: sortOrder },
      include: {
        patient: true,
        receiver: { select: { id: true, name: true } },
        reviews: {
          include: { reviewer: { select: { id: true, name: true } } },
          orderBy: { reviewedAt: 'desc' },
          take: 1
        },
        statusHistory: {
          include: { operator: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 3
        },
        supplements: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    prescriptions = prescriptions.map(p => {
      p = parsePrescription(p);
      if (p.supplements) {
        p.supplements = p.supplements.map(parseSupplement);
      }
      return p;
    });

    const total = await prisma.prescription.count({ where });

    res.json({
      data: prescriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取处方列表失败' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const prescription = await prisma.prescription.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        receiver: { select: { id: true, name: true } },
        reviews: {
          include: { reviewer: { select: { id: true, name: true } } },
          orderBy: { reviewedAt: 'desc' }
        },
        statusHistory: {
          include: { operator: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' }
        },
        supplements: {
          include: {
            requester: { select: { id: true, name: true } },
            supplementor: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!prescription) {
      return res.status(404).json({ error: '处方不存在' });
    }

    prescription = parsePrescription(prescription);
    if (prescription.reviews) {
      prescription.reviews = prescription.reviews.map(r => {
        if (r.supplementRequirements && typeof r.supplementRequirements === 'string') {
          r.supplementRequirements = JSON.parse(r.supplementRequirements);
        }
        return r;
      });
    }
    if (prescription.supplements) {
      prescription.supplements = prescription.supplements.map(parseSupplement);
    }

    res.json(prescription);
  } catch (error) {
    res.status(500).json({ error: '获取处方详情失败' });
  }
});

router.post('/', authenticateToken, requireRoles('RECEPTIONIST', 'ADMIN'), async (req, res) => {
  try {
    const { patient, ...prescriptionData } = req.body;

    let patientRecord;
    if (patient.id) {
      patientRecord = await prisma.patient.findUnique({ where: { id: patient.id } });
    }

    if (!patientRecord) {
      patientRecord = await prisma.patient.create({
        data: {
          name: patient.name,
          phone: patient.phone,
          idCard: patient.idCard,
          address: patient.address,
          age: patient.age,
          gender: patient.gender
        }
      });
    }

    const prescriptionNo = 'RX' + Date.now().toString().slice(-8);

    const prescription = await prisma.prescription.create({
      data: {
        ...prescriptionData,
        medicines: JSON.stringify(prescriptionData.medicines || []),
        prescriptionNo,
        patientId: patientRecord.id,
        status: 'PENDING_RECEPTION'
      },
      include: { patient: true }
    });

    await prisma.statusHistory.create({
      data: {
        prescriptionId: prescription.id,
        toStatus: 'PENDING_RECEPTION',
        remarks: '处方创建'
      }
    });

    res.status(201).json(prescription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '创建立处方失败' });
  }
});

router.post('/:id/receive', authenticateToken, requireRoles('RECEPTIONIST', 'ADMIN'), async (req, res) => {
  try {
    const { remarks } = req.body;
    const prescription = await prisma.prescription.findUnique({
      where: { id: req.params.id }
    });

    if (!prescription) {
      return res.status(404).json({ error: '处方不存在' });
    }

    if (prescription.status !== 'PENDING_RECEPTION') {
      return res.status(400).json({ error: '当前状态不允许接收' });
    }

    const updatedPrescription = await prisma.prescription.update({
      where: { id: req.params.id },
      data: {
        status: 'PENDING_REVIEW',
        receiverId: req.user.id,
        receivedAt: new Date()
      },
      include: {
        patient: true,
        receiver: { select: { id: true, name: true } }
      }
    });

    await prisma.statusHistory.create({
      data: {
        prescriptionId: prescription.id,
        fromStatus: 'PENDING_RECEPTION',
        toStatus: 'PENDING_REVIEW',
        operatorId: req.user.id,
        remarks: remarks || '处方已接收，待审方'
      }
    });

    res.json(updatedPrescription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '接收处方失败' });
  }
});

router.post('/:id/supplement', authenticateToken, requireRoles('RECEPTIONIST', 'ADMIN'), async (req, res) => {
  try {
    const { supplementId, supplementContent } = req.body;

    const prescription = await prisma.prescription.findUnique({
      where: { id: req.params.id }
    });

    if (!prescription) {
      return res.status(404).json({ error: '处方不存在' });
    }

    if (prescription.status !== 'SUPPLEMENT_REQUIRED') {
      return res.status(400).json({ error: '当前状态不允许补录' });
    }

    await prisma.supplement.update({
      where: { id: supplementId },
      data: {
        supplementContent: JSON.stringify(supplementContent),
        supplementorId: req.user.id,
        isCompleted: true,
        completedAt: new Date()
      }
    });

    const updatedPrescription = await prisma.prescription.update({
      where: { id: req.params.id },
      data: {
        status: 'PENDING_REVIEW'
      },
      include: { patient: true }
    });

    await prisma.statusHistory.create({
      data: {
        prescriptionId: prescription.id,
        fromStatus: 'SUPPLEMENT_REQUIRED',
        toStatus: 'PENDING_REVIEW',
        operatorId: req.user.id,
        remarks: '补录完成，重新提交审方'
      }
    });

    res.json(updatedPrescription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '补录失败' });
  }
});

module.exports = router;
