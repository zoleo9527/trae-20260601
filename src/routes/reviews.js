const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

router.post('/:prescriptionId', authenticateToken, requireRoles('PHARMACIST', 'ADMIN'), async (req, res) => {
  try {
    const { action, reviewNotes, supplementRequirements } = req.body;
    const { prescriptionId } = req.params;

    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId }
    });

    if (!prescription) {
      return res.status(404).json({ error: '处方不存在' });
    }

    if (prescription.status !== 'PENDING_REVIEW') {
      return res.status(400).json({ error: '当前状态不允许审方' });
    }

    let newStatus;
    let statusRemarks;

    switch (action) {
      case 'APPROVE':
        newStatus = 'REVIEW_PASSED';
        statusRemarks = '审方通过';
        break;
      case 'REJECT':
        newStatus = 'REVIEW_REJECTED';
        statusRemarks = '审方驳回';
        break;
      case 'REQUEST_SUPPLEMENT':
        newStatus = 'SUPPLEMENT_REQUIRED';
        statusRemarks = '需要补录信息';
        break;
      default:
        return res.status(400).json({ error: '无效的审方操作' });
    }

    const review = await prisma.review.create({
      data: {
        prescriptionId,
        reviewerId: req.user.id,
        action,
        reviewNotes,
        supplementRequirements: supplementRequirements ? JSON.stringify(supplementRequirements) : null
      },
      include: {
        reviewer: { select: { id: true, name: true } }
      }
    });

    if (action === 'REQUEST_SUPPLEMENT') {
      await prisma.supplement.create({
        data: {
          prescriptionId,
          requesterId: req.user.id,
          requirements: JSON.stringify(supplementRequirements || {})
        }
      });
    }

    await prisma.prescription.update({
      where: { id: prescriptionId },
      data: { status: newStatus }
    });

    await prisma.statusHistory.create({
      data: {
        prescriptionId,
        fromStatus: 'PENDING_REVIEW',
        toStatus: newStatus,
        operatorId: req.user.id,
        remarks: statusRemarks + (reviewNotes ? `: ${reviewNotes}` : '')
      }
    });

    res.json({ review, newStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '审方操作失败' });
  }
});

router.get('/prescription/:prescriptionId', authenticateToken, async (req, res) => {
  try {
    let reviews = await prisma.review.findMany({
      where: { prescriptionId: req.params.prescriptionId },
      include: {
        reviewer: { select: { id: true, name: true } }
      },
      orderBy: { reviewedAt: 'desc' }
    });

    reviews = reviews.map(r => {
      if (r.supplementRequirements && typeof r.supplementRequirements === 'string') {
        r.supplementRequirements = JSON.parse(r.supplementRequirements);
      }
      return r;
    });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: '获取审方记录失败' });
  }
});

module.exports = router;
