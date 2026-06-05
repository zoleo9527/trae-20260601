require('express-async-errors');
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const userContext = require('./middleware/userContext');
const errorHandler = require('./middleware/errorHandler');

const bookingsRouter = require('./routes/bookings');
const feeReviewsRouter = require('./routes/feeReviews');
const dashboardRouter = require('./routes/dashboard');
const auditLogsRouter = require('./routes/auditLogs');
const venuesRouter = require('./routes/venues');
const usersRouter = require('./routes/users');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(userContext);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    user: req.user ? { id: req.user.id, name: req.user.name, role: req.user.role } : null,
  });
});

app.use('/api/bookings', bookingsRouter);
app.use('/api/fee-reviews', feeReviewsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/venues', venuesRouter);
app.use('/api/users', usersRouter);

app.use(errorHandler);

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `路由 ${req.method} ${req.originalUrl} 不存在`,
  });
});

module.exports = app;
