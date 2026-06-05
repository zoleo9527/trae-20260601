const express = require('express');
const path = require('path');
const rentalsRouter = require('./routes/rentals');
const coachSchedulesRouter = require('./routes/coach-schedules');
const rescueRecordsRouter = require('./routes/rescue-records');
const depositVerificationsRouter = require('./routes/deposit-verifications');
const auditLogsRouter = require('./routes/audit-logs');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/rentals', rentalsRouter);
app.use('/api/coach-schedules', coachSchedulesRouter);
app.use('/api/rescue-records', rescueRecordsRouter);
app.use('/api/deposit-verifications', depositVerificationsRouter);
app.use('/api/audit-logs', auditLogsRouter);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`滑雪场运营系统已启动: http://localhost:${PORT}`);
});
