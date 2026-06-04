const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRoles } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();
const router = express.Router();

const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'prescription-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

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
      const statusList = status.split(',');
      
      const orConditions = [];
      
      for (const s of statusList) {
        if (s === 'DISPENSED_UNCONFIRMED') {
          orConditions.push({
            status: 'DISPENSED',
            labelConfirmed: false
          });
        } else if (s === 'DISPENSED_CONFIRMED') {
          orConditions.push({
            status: 'DISPENSED',
            labelConfirmed: true
          });
        } else {
          orConditions.push({ status: s });
        }
      }
      
      if (orConditions.length > 0) {
        where.OR = orConditions;
      }
    }

    if (riskLevel) {
      where.riskLevel = riskLevel;
    }

    if (search) {
      const searchConditions = {
        OR: [
          { prescriptionNo: { contains: search } },
          { patient: { name: { contains: search } } },
          { doctor: { contains: search } }
        ]
      };
      
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          searchConditions
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions.OR;
      }
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
        labelConfirmer: { select: { id: true, name: true } },
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

router.post('/:id/start-dispensing', authenticateToken, requireRoles('DISPENSER', 'ADMIN'), async (req, res) => {
  try {
    const { remarks } = req.body;
    const prescription = await prisma.prescription.findUnique({
      where: { id: req.params.id }
    });

    if (!prescription) {
      return res.status(404).json({ error: '处方不存在' });
    }

    if (prescription.status !== 'REVIEW_PASSED') {
      return res.status(400).json({ error: '当前状态不允许开始煎药' });
    }

    const updatedPrescription = await prisma.prescription.update({
      where: { id: req.params.id },
      data: {
        status: 'DISPENSING',
        dispensingStartedAt: new Date()
      },
      include: { patient: true }
    });

    await prisma.statusHistory.create({
      data: {
        prescriptionId: prescription.id,
        fromStatus: 'REVIEW_PASSED',
        toStatus: 'DISPENSING',
        operatorId: req.user.id,
        remarks: remarks || '开始煎药'
      }
    });

    res.json(updatedPrescription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '开始煎药失败' });
  }
});

router.post('/:id/complete-dispensing', authenticateToken, requireRoles('DISPENSER', 'ADMIN'), async (req, res) => {
  try {
    const { remarks } = req.body;
    const prescription = await prisma.prescription.findUnique({
      where: { id: req.params.id }
    });

    if (!prescription) {
      return res.status(404).json({ error: '处方不存在' });
    }

    if (prescription.status !== 'DISPENSING') {
      return res.status(400).json({ error: '当前状态不允许完成煎药' });
    }

    const updatedPrescription = await prisma.prescription.update({
      where: { id: req.params.id },
      data: {
        status: 'DISPENSED',
        dispensingCompletedAt: new Date()
      },
      include: { patient: true }
    });

    await prisma.statusHistory.create({
      data: {
        prescriptionId: prescription.id,
        fromStatus: 'DISPENSING',
        toStatus: 'DISPENSED',
        operatorId: req.user.id,
        remarks: remarks || '煎药完成'
      }
    });

    res.json(updatedPrescription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '完成煎药失败' });
  }
});

router.post('/:id/confirm-label', authenticateToken, requireRoles('DISPENSER', 'ADMIN'), async (req, res) => {
  try {
    const prescription = await prisma.prescription.findUnique({
      where: { id: req.params.id }
    });

    if (!prescription) {
      return res.status(404).json({ error: '处方不存在' });
    }

    if (prescription.status !== 'DISPENSED') {
      return res.status(400).json({ error: '请先完成煎药再确认标签' });
    }

    if (prescription.labelConfirmed) {
      return res.status(400).json({ error: '标签已确认' });
    }

    const updatedPrescription = await prisma.prescription.update({
      where: { id: req.params.id },
      data: {
        labelConfirmed: true,
        labelConfirmedAt: new Date(),
        labelConfirmedBy: req.user.id
      },
      include: { patient: true, labelConfirmer: { select: { id: true, name: true } } }
    });

    await prisma.statusHistory.create({
      data: {
        prescriptionId: prescription.id,
        fromStatus: 'DISPENSED',
        toStatus: 'DISPENSED',
        operatorId: req.user.id,
        remarks: '煎药标签已确认'
      }
    });

    res.json(updatedPrescription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '确认标签失败' });
  }
});

router.post('/:id/ship', authenticateToken, requireRoles('COURIER', 'ADMIN'), async (req, res) => {
  try {
    const { expressNo, expressCompany, remarks } = req.body;
    const prescription = await prisma.prescription.findUnique({
      where: { id: req.params.id }
    });

    if (!prescription) {
      return res.status(404).json({ error: '处方不存在' });
    }

    if (prescription.status !== 'DISPENSED') {
      return res.status(400).json({ error: '当前状态不允许发货' });
    }

    if (!prescription.labelConfirmed) {
      return res.status(400).json({ error: '请先确认煎药标签' });
    }

    const updatedPrescription = await prisma.prescription.update({
      where: { id: req.params.id },
      data: {
        status: 'SHIPPED',
        expressNo,
        expressCompany,
        shippedAt: new Date()
      },
      include: { patient: true }
    });

    await prisma.statusHistory.create({
      data: {
        prescriptionId: prescription.id,
        fromStatus: 'DISPENSED',
        toStatus: 'SHIPPED',
        operatorId: req.user.id,
        remarks: remarks || `已发货 - ${expressCompany}: ${expressNo}`
      }
    });

    res.json(updatedPrescription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '发货失败' });
  }
});

router.post('/:id/confirm-delivery', authenticateToken, requireRoles('COURIER', 'ADMIN'), async (req, res) => {
  try {
    const { remarks } = req.body;
    const prescription = await prisma.prescription.findUnique({
      where: { id: req.params.id }
    });

    if (!prescription) {
      return res.status(404).json({ error: '处方不存在' });
    }

    if (prescription.status !== 'SHIPPED') {
      return res.status(400).json({ error: '当前状态不允许确认送达' });
    }

    const updatedPrescription = await prisma.prescription.update({
      where: { id: req.params.id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date()
      },
      include: { patient: true }
    });

    await prisma.statusHistory.create({
      data: {
        prescriptionId: prescription.id,
        fromStatus: 'SHIPPED',
        toStatus: 'DELIVERED',
        operatorId: req.user.id,
        remarks: remarks || '已送达'
      }
    });

    res.json(updatedPrescription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '确认送达失败' });
  }
});

router.post('/:id/upload-photo', authenticateToken, requireRoles('RECEPTIONIST', 'DISPENSER', 'ADMIN'), upload.single('photo'), async (req, res) => {
  try {
    const prescription = await prisma.prescription.findUnique({
      where: { id: req.params.id }
    });

    if (!prescription) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: '处方不存在' });
    }

    if (prescription.prescriptionPhoto) {
      const oldPhotoPath = path.join(__dirname, '../../public', prescription.prescriptionPhoto);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    const photoUrl = `/uploads/${req.file.filename}`;

    const updatedPrescription = await prisma.prescription.update({
      where: { id: req.params.id },
      data: {
        prescriptionPhoto: photoUrl
      }
    });

    await prisma.statusHistory.create({
      data: {
        prescriptionId: prescription.id,
        fromStatus: prescription.status,
        toStatus: prescription.status,
        operatorId: req.user.id,
        remarks: '处方照片已上传'
      }
    });

    res.json({
      photoUrl,
      prescription: updatedPrescription
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error(error);
    res.status(500).json({ error: '上传照片失败' });
  }
});

router.delete('/:id/photo', authenticateToken, requireRoles('RECEPTIONIST', 'DISPENSER', 'ADMIN'), async (req, res) => {
  try {
    const prescription = await prisma.prescription.findUnique({
      where: { id: req.params.id }
    });

    if (!prescription) {
      return res.status(404).json({ error: '处方不存在' });
    }

    if (!prescription.prescriptionPhoto) {
      return res.status(400).json({ error: '没有照片可删除' });
    }

    const oldPhotoPath = path.join(__dirname, '../../public', prescription.prescriptionPhoto);
    if (fs.existsSync(oldPhotoPath)) {
      fs.unlinkSync(oldPhotoPath);
    }

    await prisma.prescription.update({
      where: { id: req.params.id },
      data: {
        prescriptionPhoto: null
      }
    });

    await prisma.statusHistory.create({
      data: {
        prescriptionId: prescription.id,
        fromStatus: prescription.status,
        toStatus: prescription.status,
        operatorId: req.user.id,
        remarks: '处方照片已删除'
      }
    });

    res.json({ message: '照片已删除' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '删除照片失败' });
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
