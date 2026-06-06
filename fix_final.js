const fs = require('fs');

// Fix TransferApproval
let c = fs.readFileSync('src/pages/TransferApproval.tsx', 'utf8');

// Fix approve button
c = c.replace(
  "                    alert('已批准该调班申请！');\n                    setSelectedId(null);\n                    setAuditComment('');",
  "                    approveTransfer(selectedId, '王主管（校区主管）', auditComment);\n                    alert('已批准该调班申请！');\n                    setSelectedId(null);\n                    setAuditComment('');\n                    setRefreshKey(k => k + 1);"
);

// Fix reject button
c = c.replace(
  "                    if (!auditComment.trim()) { alert('请填写拒绝原因'); return; }\n                    alert('已拒绝该调班申请！');\n                    setSelectedId(null);\n                    setAuditComment('');",
  "                    if (!auditComment.trim()) { alert('请填写拒绝原因'); return; }\n                    rejectTransfer(selectedId, '王主管（校区主管）', auditComment);\n                    alert('已拒绝该调班申请！');\n                    setSelectedId(null);\n                    setAuditComment('');\n                    setRefreshKey(k => k + 1);"
);

fs.writeFileSync('src/pages/TransferApproval.tsx', c);
console.log('Fixed TransferApproval buttons');
