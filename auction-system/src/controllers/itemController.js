const prisma = require('../prisma/client');

const createItem = async (req, res) => {
  try {
    const { name, description, basePrice, reservePrice, itemType, location } = req.body;
    
    const item = await prisma.auctionItem.create({
      data: {
        name,
        description,
        basePrice,
        reservePrice,
        itemType,
        location
      },
      include: {
        attachments: { select: { id: true, fileName: true } }
      }
    });

    res.status(201).json({ message: 'Auction item created successfully', item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await prisma.auctionItem.findUnique({
      where: { id },
      include: {
        attachments: { select: { id: true, fileName: true, fileType: true, uploadedAt: true } },
        announcements: { select: { id: true, title: true, status: true, publishedAt: true } }
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Auction item not found' });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllItems = async (req, res) => {
  try {
    const { itemType, status, page = 1, limit = 10 } = req.query;
    
    const where = {};
    if (itemType) where.itemType = itemType;
    if (status) where.status = status;

    const items = await prisma.auctionItem.findMany({
      where,
      skip: (page - 1) * limit,
      take: parseInt(limit),
      include: {
        attachments: { select: { id: true, fileName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.auctionItem.count({ where });

    res.json({
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, basePrice, reservePrice, itemType, location, status } = req.body;
    
    const item = await prisma.auctionItem.update({
      where: { id },
      data: {
        name,
        description,
        basePrice,
        reservePrice,
        itemType,
        location,
        status
      },
      include: {
        attachments: { select: { id: true, fileName: true } }
      }
    });

    res.json({ message: 'Auction item updated successfully', item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await prisma.auctionItem.findUnique({
      where: { id },
      include: { announcements: true }
    });

    if (!item) {
      return res.status(404).json({ error: 'Auction item not found' });
    }

    if (item.announcements.length > 0) {
      return res.status(400).json({ error: 'Cannot delete item with active announcements' });
    }

    await prisma.auctionItem.delete({ where: { id } });
    
    res.json({ message: 'Auction item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createItem,
  getItemById,
  getAllItems,
  updateItem,
  deleteItem
};