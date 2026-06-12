const express = require('express');
const router = express.Router();
const { register, createUser, login, getProfile, getAllUsers, getUserById, updateUser, deleteUser } = require('../controllers/authController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/register', register);
router.post('/users', authenticate, requireAdmin, createUser);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.get('/users', authenticate, requireAdmin, getAllUsers);
router.get('/users/:id', authenticate, requireAdmin, getUserById);
router.put('/users/:id', authenticate, requireAdmin, updateUser);
router.delete('/users/:id', authenticate, requireAdmin, deleteUser);

module.exports = router;