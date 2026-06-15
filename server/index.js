import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import path from 'path';
import { 
  getOrders, 
  getOrderById, 
  createOrder, 
  updateOrder, 
  updateOrderStatus,
  addRevision,
  addInstallationRecord,
  confirmByCustomer,
  batchUpdateStatus,
  resetData,
  getStatistics
} from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

app.get('/api/orders', (req, res) => {
  const { status, role, urgent } = req.query;
  const orders = getOrders({ status, role, urgent });
  res.json(orders);
});

app.get('/api/orders/:id', (req, res) => {
  const order = getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  res.json(order);
});

app.post('/api/orders', (req, res) => {
  const order = createOrder(req.body);
  res.status(201).json(order);
});

app.put('/api/orders/:id', (req, res) => {
  const order = updateOrder(req.params.id, req.body);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  res.json(order);
});

app.put('/api/orders/:id/status', (req, res) => {
  const { status, operator, remark } = req.body;
  const order = updateOrderStatus(req.params.id, status, operator, remark);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  res.json(order);
});

app.post('/api/orders/:id/revisions', upload.single('file'), (req, res) => {
  const { type, description, operator, beforeData, afterData } = req.body;
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const order = addRevision(req.params.id, {
    type,
    description,
    operator,
    fileUrl,
    beforeData: JSON.parse(beforeData || '{}'),
    afterData: JSON.parse(afterData || '{}')
  });
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  res.json(order);
});

app.post('/api/orders/:id/installation', upload.array('photos', 10), (req, res) => {
  const { installTime, operator, remark, issueReported } = req.body;
  const photos = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
  const order = addInstallationRecord(req.params.id, {
    installTime,
    operator,
    remark,
    photos,
    issueReported: issueReported === 'true'
  });
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  res.json(order);
});

app.post('/api/orders/:id/confirm', (req, res) => {
  const { customerName, signature, confirmType, feedback } = req.body;
  const order = confirmByCustomer(req.params.id, {
    customerName,
    signature,
    confirmType,
    feedback
  });
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  res.json(order);
});

app.post('/api/batch/status', (req, res) => {
  const { ids, status, operator, remark } = req.body;
  const result = batchUpdateStatus(ids, status, operator, remark);
  res.json(result);
});

app.post('/api/reset', (req, res) => {
  resetData();
  res.json({ message: '数据已重置' });
});

app.get('/api/statistics', (req, res) => {
  const stats = getStatistics();
  res.json(stats);
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
