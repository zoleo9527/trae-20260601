const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/current-user', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = 1').get();
  if (user) {
    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, currentRole: user.role });
  } else {
    res.status(404).json({ error: '用户未找到' });
  }
});

router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, username, name, role, department, email FROM users').all();
  res.json({ users });
});

router.post('/switch-role', (req, res) => {
  const { role } = req.body;
  const validRoles = ['training_manager', 'department_head', 'instructor'];

  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: '无效的角色' });
  }

  const user = db.prepare('SELECT * FROM users WHERE role = ?').get(role);
  if (user) {
    const { password, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
      currentRole: role,
      message: `已切换到${getRoleName(role)}角色`
    });
  } else {
    res.status(404).json({ error: '该角色用户不存在' });
  }
});

router.get('/permissions', (req, res) => {
  const { role } = req.query;

  const permissions = {
    training_manager: {
      dashboard: ['pending_approvals', 'statistics', 'recent_activities'],
      certificates: ['view', 'create', 'approve', 'reject', 'revoke', 'batch_process'],
      evaluations: ['view', 'export', 'recalculate'],
      exceptions: ['view', 'assign', 'resolve', 'close'],
      training: ['view', 'create', 'edit', 'delete']
    },
    department_head: {
      dashboard: ['department_training', 'team_attendance'],
      certificates: ['view'],
      evaluations: ['view', 'export'],
      exceptions: ['view', 'report', 'resolve_absent', 'follow_up'],
      training: ['view', 'register']
    },
    instructor: {
      dashboard: ['course_schedule', 'pending_homework'],
      certificates: ['view', 'create', 'submit_review', 'correct'],
      evaluations: ['view'],
      exceptions: ['view', 'resolve_homework', 'resolve_certificate_error'],
      training: ['view', 'check_in', 'record_performance'],
      homework: ['view', 'grade', '催交']
    }
  };

  res.json({
    role,
    permissions: permissions[role] || {},
    roleName: getRoleName(role)
  });
});

function getRoleName(role) {
  const names = {
    training_manager: '培训经理',
    department_head: '部门负责人',
    instructor: '讲师'
  };
  return names[role] || role;
}

module.exports = router;
