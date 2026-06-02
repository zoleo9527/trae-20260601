const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');

const ordersRouter = require('./routes/orders');
const materialsRouter = require('./routes/materials');
const schedulesRouter = require('./routes/schedules');
const broadcastsRouter = require('./routes/broadcasts');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/orders', ordersRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/broadcasts', broadcastsRouter);

app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

initDb();
require('./seed');

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
