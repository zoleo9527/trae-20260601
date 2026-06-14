import { Router } from 'express';
import { authService } from '../models/auth.js';
import { auditService } from '../models/audit.js';

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
    const { delegationId, actionType, operator, startTime, endTime, page, limit } = req.query;
    const filters = {};

    if (delegationId) filters.delegationId = parseInt(delegationId);
    if (actionType) filters.actionType = actionType;
    if (operator) filters.operator = operator;
    if (startTime) filters.startTime = startTime;
    if (endTime) filters.endTime = endTime;
    if (page) filters.page = parseInt(page);
    if (limit) filters.limit = parseInt(limit);

    const logs = auditService.findAll(filters);

    res.json({
      success: true,
      data: { logs }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
});

router.get('/:delegationId', (req, res) => {
  try {
    const logs = auditService.findByDelegationId(parseInt(req.params.delegationId));

    res.json({
      success: true,
      data: { logs }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
});

export default router;
