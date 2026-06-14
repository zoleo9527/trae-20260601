import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './database.js';

const JWT_SECRET = 'judicial-appraisal-secret-key-2024';
const JWT_EXPIRES_IN = '24h';

export const authService = {
  async login(username, password) {
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND status = ?').get(username, 'active');
    
    if (!user) {
      throw new Error('用户不存在或账号已被禁用');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('密码错误');
    }

    db.prepare('UPDATE users SET last_login_time = ? WHERE id = ?').run(new Date().toISOString(), user.id);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { password: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  },

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Token无效或已过期');
    }
  }
};

export const rolePermissions = {
  'acceptor': ['PENDING_ACCEPTANCE', 'ACCEPTANCE_IN_PROGRESS', 'MATERIAL_INCOMPLETE'],
  'appraiser': ['MATERIAL_VERIFICATION', 'VERIFICATION_PASSED', 'VERIFICATION_FAILED', 'MATERIAL_INCOMPLETE', 'QC_REVIEW_PENDING'],
  'qc_reviewer': ['QC_REVIEW_PENDING', 'QC_APPROVED', 'QC_REJECTED'],
  'admin': ['*']
};

export const STATUS_TRANSITIONS = {
  'PENDING_ACCEPTANCE': ['ACCEPTANCE_IN_PROGRESS'],
  'ACCEPTANCE_IN_PROGRESS': ['MATERIAL_VERIFICATION', 'PENDING_ACCEPTANCE'],
  'MATERIAL_VERIFICATION': ['QC_REVIEW_PENDING', 'VERIFICATION_FAILED', 'MATERIAL_INCOMPLETE'],
  'VERIFICATION_PASSED': ['QC_REVIEW_PENDING'],
  'VERIFICATION_FAILED': ['MATERIAL_VERIFICATION'],
  'MATERIAL_INCOMPLETE': ['MATERIAL_VERIFICATION'],
  'QC_REVIEW_PENDING': ['QC_APPROVED', 'QC_REJECTED'],
  'QC_APPROVED': ['COMPLETED'],
  'QC_REJECTED': ['MATERIAL_VERIFICATION', 'QC_REVIEW_PENDING'],
  'COMPLETED': [],
  'ON_HOLD': ['PENDING_ACCEPTANCE', 'ACCEPTANCE_IN_PROGRESS', 'MATERIAL_VERIFICATION']
};

export function canTransition(currentStatus, newStatus, userRole) {
  const allowed = STATUS_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(newStatus)) {
    return false;
  }

  if (userRole === 'admin') {
    return true;
  }

  const rolePermittedStatuses = rolePermissions[userRole] || [];
  return rolePermittedStatuses.includes(newStatus) || rolePermittedStatuses.includes('*');
}
