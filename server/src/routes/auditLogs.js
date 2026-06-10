const express = require('express');
const db = require('../db');
const { getPagination, paginateResult } = require('../utils');

const router = express.Router();

router.get('/', (req, res) => {
  const { biz_type, biz_id, page, pageSize } = req.query;
  const { offset, limit, page: p, pageSize: ps } = getPagination(page, pageSize);

  let whereSql = 'WHERE 1=1';
  const params = [];

  if (biz_type) {
    whereSql += ' AND biz_type = ?';
    params.push(biz_type);
  }
  if (biz_id) {
    whereSql += ' AND biz_id = ?';
    params.push(parseInt(biz_id));
  }

  const countSql = `SELECT COUNT(*) as total FROM audit_logs ${whereSql}`;
  const total = db.prepare(countSql).get(...params).total;

  const listSql = `
    SELECT * FROM audit_logs
    ${whereSql}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;
  const list = db.prepare(listSql).all(...params, limit, offset);

  res.json(paginateResult(total, list, p, ps));
});

module.exports = router;
