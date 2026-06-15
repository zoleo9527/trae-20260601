const { v4: uuidv4 } = require('uuid');

const store = {
  users: [],
  projects: [],
  drawings: [],
  schedules: [],
  records: [],
  idempotency: {}
};

const generateId = () => uuidv4().replace(/-/g, '').substring(0, 12);

module.exports = {
  store,
  generateId
};
