import { Router } from 'express';
import { authService } from '../models/auth.js';
import { delegationService, materialService } from '../models/delegation.js';

const router = Router();

function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: '未提供认证令牌' }
      });
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: error.message }
    });
  }
}

router.use(authenticate);

router.get('/', (req, res) => {
  try {
    const { status, isAbnormal, page, limit } = req.query;
    const filters = {};

    if (status) filters.status = status;
    if (isAbnormal !== undefined) filters.isAbnormal = isAbnormal === 'true';
    if (page) filters.page = parseInt(page);
    if (limit) filters.limit = parseInt(limit);

    const delegations = delegationService.findAll(filters);

    res.json({
      success: true,
      data: { delegations }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const delegation = delegationService.findById(parseInt(req.params.id));

    if (!delegation) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '委托单不存在' }
      });
    }

    res.json({
      success: true,
      data: delegation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
});

router.post('/', (req, res) => {
  try {
    const delegationId = delegationService.create(req.body, req.user);

    res.status(201).json({
      success: true,
      data: { id: delegationId },
      message: '委托单创建成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_ERROR', message: error.message }
    });
  }
});

router.put('/:id', (req, res) => {
  try {
    const delegation = delegationService.update(parseInt(req.params.id), req.body, req.user);

    res.json({
      success: true,
      data: delegation,
      message: '委托单更新成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message }
    });
  }
});

router.put('/:id/status', (req, res) => {
  try {
    const { newStatus, remarks } = req.body;

    if (!newStatus) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: '新状态不能为空' }
      });
    }

    const delegation = delegationService.updateStatus(parseInt(req.params.id), newStatus, remarks, req.user);

    res.json({
      success: true,
      data: delegation,
      message: '状态更新成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: { code: 'STATUS_UPDATE_ERROR', message: error.message }
    });
  }
});

router.put('/:id/materials/:materialId', (req, res) => {
  try {
    const { verificationStatus, verificationNotes } = req.body;

    if (!verificationStatus) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: '核验状态不能为空' }
      });
    }

    const material = materialService.updateVerification(
      parseInt(req.params.materialId),
      verificationStatus,
      verificationNotes,
      req.user
    );

    res.json({
      success: true,
      data: material,
      message: '材料核验更新成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'VERIFICATION_ERROR', message: error.message }
    });
  }
});

export default router;
