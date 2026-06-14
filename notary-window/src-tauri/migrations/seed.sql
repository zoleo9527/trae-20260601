INSERT OR IGNORE INTO appointments (id, appointment_no, applicant_name, applicant_id_no, applicant_phone, notary_type, appointment_time, status, current_handler_role, created_at, updated_at) VALUES
('seed-001', 'GZ-20260601-0001', '张三', '110101199001011234', '13800000001', '继承公证', '2026-06-15 09:00', 'pending_accept', 'window', '2026-06-14 08:30:00', '2026-06-14 08:30:00'),
('seed-002', 'GZ-20260602-0002', '李四', '110101198505052345', '13800000002', '委托公证', '2026-06-15 10:00', 'accepted_reviewing', 'window', '2026-06-14 09:00:00', '2026-06-14 09:15:00'),
('seed-003', 'GZ-20260603-0003', '王五', '110101199212123456', '13800000003', '遗嘱公证', '2026-06-14 14:00', 'notary_reviewing', 'notary', '2026-06-13 10:00:00', '2026-06-14 10:30:00'),
('seed-004', 'GZ-20260604-0004', '赵六', '110101197808084567', '13800000004', '合同公证', '2026-06-13 11:00', 'archiving', 'archivist', '2026-06-12 09:00:00', '2026-06-13 14:00:00'),
('seed-005', 'GZ-20260605-0005', '孙七', '110101200001015678', '13800000005', '出生公证', '2026-06-15 15:00', 'pending_accept', 'window', '2026-06-14 14:00:00', '2026-06-14 14:00:00');

INSERT OR IGNORE INTO materials (id, appointment_id, material_name, material_code, is_required, status, review_comment, reviewed_by, reviewed_at, created_at) VALUES
('mat-001', 'seed-002', '身份证复印件', 'CL-001', 1, 'passed', '材料齐全', '窗口人员', '2026-06-14 09:20:00', '2026-06-14 09:15:00'),
('mat-002', 'seed-002', '户口簿原件', 'CL-002', 1, 'pending', NULL, NULL, NULL, '2026-06-14 09:15:00'),
('mat-003', 'seed-002', '委托书模板', 'CL-003', 1, 'passed', '符合要求', '窗口人员', '2026-06-14 09:25:00', '2026-06-14 09:15:00'),
('mat-004', 'seed-003', '身份证复印件', 'CL-001', 1, 'passed', '材料齐全', '窗口人员', '2026-06-13 10:15:00', '2026-06-13 10:00:00'),
('mat-005', 'seed-003', '遗嘱手写稿', 'CL-004', 1, 'passed', '符合要求', '窗口人员', '2026-06-13 10:20:00', '2026-06-13 10:00:00'),
('mat-006', 'seed-003', '医院诊断证明', 'CL-005', 0, 'passed', '补充材料已审核', '公证员', '2026-06-14 10:35:00', '2026-06-13 10:00:00'),
('mat-007', 'seed-004', '身份证复印件', 'CL-001', 1, 'passed', '材料齐全', '窗口人员', '2026-06-12 09:20:00', '2026-06-12 09:00:00'),
('mat-008', 'seed-004', '合同原件', 'CL-006', 1, 'passed', '符合要求', '窗口人员', '2026-06-12 09:25:00', '2026-06-12 09:00:00'),
('mat-009', 'seed-004', '营业执照副本', 'CL-007', 1, 'passed', '材料齐全', '公证员', '2026-06-12 14:10:00', '2026-06-12 09:00:00');

INSERT OR IGNORE INTO flow_records (id, appointment_id, from_role, to_role, action, comment, operator_name, created_at) VALUES
('flow-001', 'seed-001', 'system', 'window', 'create', '新建预约单，等待窗口受理', '系统', '2026-06-14 08:30:00'),
('flow-002', 'seed-002', 'system', 'window', 'create', '新建预约单，等待窗口受理', '系统', '2026-06-14 09:00:00'),
('flow-003', 'seed-002', 'window', 'window', 'accept', '窗口受理预约', '窗口人员', '2026-06-14 09:15:00'),
('flow-004', 'seed-003', 'system', 'window', 'create', '新建预约单，等待窗口受理', '系统', '2026-06-13 10:00:00'),
('flow-005', 'seed-003', 'window', 'window', 'accept', '窗口受理预约', '窗口人员', '2026-06-13 10:10:00'),
('flow-006', 'seed-003', 'window', 'notary', 'forward_to_notary', '材料预审通过，转公证员审核', '窗口人员', '2026-06-13 10:30:00'),
('flow-007', 'seed-004', 'system', 'window', 'create', '新建预约单，等待窗口受理', '系统', '2026-06-12 09:00:00'),
('flow-008', 'seed-004', 'window', 'window', 'accept', '窗口受理预约', '窗口人员', '2026-06-12 09:10:00'),
('flow-009', 'seed-004', 'window', 'notary', 'forward_to_notary', '材料预审通过，转公证员审核', '窗口人员', '2026-06-12 09:30:00'),
('flow-010', 'seed-004', 'notary', 'archivist', 'forward_to_archivist', '公证审核通过，转档案员归档', '公证员', '2026-06-12 14:00:00'),
('flow-011', 'seed-005', 'system', 'window', 'create', '新建预约单，等待窗口受理', '系统', '2026-06-14 14:00:00');
