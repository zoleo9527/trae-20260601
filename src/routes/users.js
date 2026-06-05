const express = require('express');
const prisma = require('../config/prisma');

const router = express.Router();

router.get('/', async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { id: 'asc' },
  });
  res.json({ data: users });
});

router.get('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(req.params.id) },
  });
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json({ data: user });
});

router.get('/me', (req, res) => {
  res.json({ data: req.user });
});

module.exports = router;
