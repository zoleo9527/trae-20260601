const express = require('express');
const prisma = require('../config/prisma');

const router = express.Router();

router.get('/', async (req, res) => {
  const venues = await prisma.venue.findMany({
    orderBy: { id: 'asc' },
  });
  res.json({ data: venues });
});

router.get('/:id', async (req, res) => {
  const venue = await prisma.venue.findUnique({
    where: { id: Number(req.params.id) },
  });
  if (!venue) {
    return res.status(404).json({ error: '场馆不存在' });
  }
  res.json({ data: venue });
});

module.exports = router;
