const express = require('express');
const router = express.Router();
const { users, ROLES } = require('../data/mockData');

router.get('/', (req, res) => {
  const { role } = req.query;
  let result = [...users];
  if (role) {
    result = result.filter(u => u.role === role);
  }
  res.json({ code: 0, data: result });
});

router.get('/roles', (req, res) => {
  res.json({
    code: 0,
    data: [
      { key: ROLES.CUSTOMER_SERVICE, name: '园区客服' },
      { key: ROLES.PICKING_GUIDE, name: '采摘向导' },
      { key: ROLES.WAREHOUSE_STAFF, name: '仓库员' }
    ]
  });
});

router.get('/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ code: 1, message: '用户不存在' });
  }
  res.json({ code: 0, data: user });
});

module.exports = router;
