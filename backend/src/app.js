const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const formulaRouter = require('./routes/formula');
const batchingRouter = require('./routes/batching');
const qualityRouter = require('./routes/quality');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/formulas', formulaRouter);
app.use('/api/batching-plans', batchingRouter);
app.use('/api/quality', qualityRouter);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } });
});

app.use(errorHandler);

module.exports = app;
