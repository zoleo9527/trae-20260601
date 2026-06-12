const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authenticate, authController.getProfile);
router.get('/users', authenticate, requireAdmin, authController.getAllUsers);
router.get('/users/:id', authenticate, requireAdmin, authController.getUserById);
router.put('/users/:id', authenticate, requireAdmin, authController.updateUser);
router.delete('/users/:id', authenticate, requireAdmin, authController.deleteUser);

module.exports = router;