const prisma = require('../prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = './src/uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

const uploadAttachment = async (req, res) => {
  try {
    const { announcementId, itemId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!announcementId && !itemId) {
      return res.status(400).json({ error: 'Either announcementId or itemId is required' });
    }

    const attachment = await prisma.attachment.create({
      data: {
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        announcementId: announcementId || null,
        itemId: itemId || null,
        uploadedBy: req.user.id
      },
      include: {
        uploader: { select: { id: true, name: true } }
      }
    });

    res.status(201).json({ message: 'Attachment uploaded successfully', attachment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAttachments = async (req, res) => {
  try {
    const { announcementId, itemId } = req.query;
    
    const where = {};
    if (announcementId) where.announcementId = announcementId;
    if (itemId) where.itemId = itemId;

    const attachments = await prisma.attachment.findMany({
      where,
      include: {
        uploader: { select: { id: true, name: true } },
        announcement: { select: { id: true, title: true } },
        item: { select: { id: true, name: true } }
      },
      orderBy: { uploadedAt: 'desc' }
    });

    res.json(attachments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAttachmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        uploader: { select: { id: true, name: true } }
      }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    res.json(attachment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const attachment = await prisma.attachment.findUnique({ where: { id } });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    if (fs.existsSync(attachment.filePath)) {
      fs.unlinkSync(attachment.filePath);
    }

    await prisma.attachment.delete({ where: { id } });
    
    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const downloadAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const attachment = await prisma.attachment.findUnique({ where: { id } });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const filePath = path.resolve(attachment.filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath, attachment.fileName);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  upload,
  uploadAttachment,
  getAttachments,
  getAttachmentById,
  deleteAttachment,
  downloadAttachment
};