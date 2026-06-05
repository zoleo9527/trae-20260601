const ROLE_PERMISSIONS = {
  frontdesk: { schedule: ['create', 'submit_review', 'resubmit', 'view_all'], risk: ['create', 'view_all'] },
  manager: { schedule: ['create', 'review_approve', 'review_reject', 'view_all', 'edit_all'], risk: ['create', 'view_all', 'process_all', 'reassign'] },
  belayer: { schedule: ['view_own', 'check_in', 'check_out'], risk: ['create', 'view_all'] },
  routesetter: { schedule: ['view_all'], risk: ['create', 'view_all'], maintenance: ['process', 'view_all'] }
};

function hasPermission(role, action, module = 'schedule') {
  const perms = ROLE_PERMISSIONS[role] || {};
  const mp = perms[module] || [];
  return mp.includes(action) || mp.includes('view_all') || mp.includes('edit_all');
}

const roleMiddleware = (req, res, next) => {
  req.currentRole = req.headers['x-role'] || 'manager';
  req.currentUserId = req.headers['x-user-id'];
  next();
};

function syncRiskWithSchedule(db, scheduleId, status, staffId, staffRole) {
  if (!scheduleId) return;
  
  db.get("SELECT * FROM risk_alerts WHERE source_schedule_id = ?", [scheduleId], (err, risk) => {
    if (err || !risk) return;
    
    if (status === 'scheduled' || status === 'checked_in') {
      db.run("UPDATE risk_alerts SET current_owner = ?, owner_role = ?, updated_at = ? WHERE id = ?", 
        [staffId, staffRole, new Date().toISOString(), risk.id]);
    } else if (status === 'rejected') {
      db.run("UPDATE risk_alerts SET current_owner = NULL, owner_role = 'manager', updated_at = ? WHERE id = ?",
        [new Date().toISOString(), risk.id]);
    } else if (status === 'cancelled') {
      db.run("UPDATE risk_alerts SET current_owner = NULL, owner_role = NULL, updated_at = ? WHERE id = ?",
        [new Date().toISOString(), risk.id]);
    }
  });
}

module.exports = { ROLE_PERMISSIONS, hasPermission, roleMiddleware, syncRiskWithSchedule };
