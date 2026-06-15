const express = require('express');
const AuthService = require('../services/authService');

const router = express.Router();

router.get('/', (req, res) => {
  const users = AuthService.listUsers();
  res.json({
    success: true,
    data: users
  });
});

router.get('/:userId', (req, res) => {
  const user = AuthService.getUser(req.params.userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: '用户不存在',
      code: 'USER_NOT_FOUND'
    });
  }
  res.json({
    success: true,
    data: user
  });
});

module.exports = router;
