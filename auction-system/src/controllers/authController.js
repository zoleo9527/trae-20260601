const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

const register = async (req, res) => {
  try {
    const { username, password, name, email, phone, role } = req.body;
    
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const allowedRoles = ['BIDDER'];
    const isAdminRole = ['PROJECT_MANAGER', 'REVIEWER', 'FINANCE'].includes(role);
    
    if (isAdminRole && !req.user) {
      return res.status(403).json({ error: 'Only admin users can create admin accounts' });
    }

    if (!req.user && role && !allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'You can only register as a BIDDER' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    const userRole = req.user ? (role || 'BIDDER') : 'BIDDER';
    
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        name,
        email,
        phone,
        role: userRole
      },
      select: { id: true, username: true, name: true, email: true, phone: true, role: true, createdAt: true }
    });

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, name: true, email: true, phone: true, role: true, createdAt: true }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true, email: true, role: true, createdAt: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, username: true, name: true, email: true, phone: true, role: true, createdAt: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, email, phone },
      select: { id: true, username: true, name: true, email: true, phone: true, role: true }
    });

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};