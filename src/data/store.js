const { v4: uuidv4 } = require('uuid');

const store = {
  users: [],
  projects: [],
  drawings: [],
  schedules: [],
  records: [],
  idempotency: {},
  _recordSequence: 0
};

const generateId = () => uuidv4().replace(/-/g, '').substring(0, 12);

const nextSequence = () => {
  store._recordSequence += 1;
  return store._recordSequence;
};

const resetSequence = () => {
  store._recordSequence = 0;
};

module.exports = {
  store,
  generateId,
  nextSequence,
  resetSequence
};
