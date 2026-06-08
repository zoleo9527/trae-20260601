const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

require('./db');

const authRoutes = require('./routes/auth');
const patrolRoutes = require('./routes/patrols');
const exceptionRoutes = require('./routes/exceptions');
const handoverRoutes = require('./routes/handovers');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/patrols', patrolRoutes);
app.use('/api/exceptions', exceptionRoutes);
app.use('/api/handovers', handoverRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
