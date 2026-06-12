-- 初始用户数据
INSERT INTO users (id, username, password, name, role, email, phone, status) VALUES
('1', 'admin', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1BD7WC', '系统管理员', 'admin', 'admin@example.com', '13800000000', 'active'),
('2', 'zhangsan', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1BD7WC', '张会计', 'accountant', 'zhangsan@example.com', '13800000001', 'active'),
('3', 'lisi', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1BD7WC', '李经理', 'manager', 'lisi@example.com', '13800000002', 'active'),
('4', 'wangwu', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1BD7WC', '王主管', 'supervisor', 'wangwu@example.com', '13800000003', 'active'),
('5', 'wangji', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1BD7WC', '王会计', 'accountant', 'wangji@example.com', '13800000004', 'active'),
('6', 'zhaojing', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1BD7WC', '赵经理', 'manager', 'zhaojing@example.com', '13800000005', 'active'),
('7', 'liji', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1BD7WC', '李会计', 'accountant', 'liji@example.com', '13800000006', 'inactive');

-- 初始客户数据
-- 场景1：客户临近到期
INSERT INTO customers (id, name, contact_person, phone, email, address, tax_number, contract_start_date, contract_end_date, status, risk_level, risk_reasons, accountant_id, manager_id, notes) VALUES
('1', '北京科技有限公司', '李总', '13800138000', 'bjtech@example.com', '北京市朝阳区建国路88号', '91110105MA01ABCD', '2023-07-15', '2024-07-15', 'expiring', 'medium', '["临近到期"]', '2', '3', '客户有意续约，正在商谈价格');

-- 场景2：前任离职
INSERT INTO customers (id, name, contact_person, phone, email, address, tax_number, contract_start_date, contract_end_date, status, risk_level, risk_reasons, accountant_id, manager_id, notes) VALUES
('2', '上海贸易有限公司', '王总', '13900139000', 'shtrade@example.com', '上海市浦东新区陆家嘴环路100号', '91310115MA01EFGH', '2023-08-20', '2025-08-20', 'active', 'high', '["前任离职","资料不齐"]', '5', '3', '前任会计李会计已离职，交接完成但资料长期不齐');

-- 场景3：资料长期不齐
INSERT INTO customers (id, name, contact_person, phone, email, address, tax_number, contract_start_date, contract_end_date, status, risk_level, risk_reasons, accountant_id, manager_id, notes) VALUES
('3', '广州制造有限公司', '张总', '13700137000', 'gzmake@example.com', '广州市天河区天河路200号', '91440106MA01IJKL', '2022-09-10', '2024-09-10', 'suspended', 'high', '["资料不齐","客户失联"]', '2', '6', '多次交接，资料始终不齐，客户经常失联');

-- 其他客户数据
INSERT INTO customers (id, name, contact_person, phone, email, address, tax_number, contract_start_date, contract_end_date, status, risk_level, risk_reasons, accountant_id, manager_id, notes) VALUES
('4', '深圳创新科技有限公司', '刘总', '13600136000', 'sztech@example.com', '深圳市南山区科技园路50号', '91440300MA01MNOP', '2024-01-01', '2025-01-01', 'active', 'none', '[]', '2', '3', '新客户，服务正常'),
('5', '杭州电子商务有限公司', '陈总', '13500135000', 'hzecom@example.com', '杭州市西湖区文三路100号', '91330106MA01QRST', '2023-06-01', '2024-06-01', 'expired', 'high', '["已到期"]', '5', '6', '合同已到期，客户未续约'),
('6', '成都餐饮管理有限公司', '周总', '13400134000', 'cdfood@example.com', '成都市武侯区人民南路50号', '91510107MA01UVWX', '2024-02-15', '2025-02-15', 'active', 'low', '[]', '2', '3', '客户配合度好，资料齐全');

-- 交接记录数据
-- 场景2的交接记录：前任离职
INSERT INTO handovers (id, customer_id, from_user_id, to_user_id, from_user_role, pending_items, customer_habits, invoice_details, next_declaration, status, review_comment, reviewer_id, created_at, updated_at, completed_at) VALUES
('1', '2', '7', '5', 'accountant', 
'{"pendingInvoices":"6月份发票未处理","pendingDeclarations":"增值税申报","pendingAccounts":"2024年Q1季度报表未核对","otherItems":"无"}',
'{"communicationPreference":"wechat","bestContactTime":"下午2-4点","specialRequirements":"需要提前通知开票","attentionPoints":"客户对时间要求严格"}',
'{"invoiceType":"增值税专用发票","invoiceFrequency":"每月一次","specialRequirements":"需要提前3天通知","historicalIssues":"曾出现发票金额错误"}',
'{"taxType":"增值税","deadline":"2024-06-20","notes":"注意核对进项税额","attachments":[]}',
'approved', '交接清单完整，已审核通过', '4', '2024-05-20 10:00:00', '2024-05-20 15:00:00', '2024-05-20 15:00:00');

-- 场景3的交接记录：资料长期不齐
INSERT INTO handovers (id, customer_id, from_user_id, to_user_id, from_user_role, pending_items, customer_habits, invoice_details, next_declaration, status, review_comment, reviewer_id, created_at, updated_at, completed_at) VALUES
('2', '3', '2', '2', 'accountant',
'{"pendingInvoices":"缺少2023年全年成本发票","pendingDeclarations":"增值税申报已逾期","pendingAccounts":"缺少2023年全年银行流水","otherItems":"需要补申报"}',
'{"communicationPreference":"phone","bestContactTime":"上午9-11点","specialRequirements":"无","attentionPoints":"电话经常无人接听，微信回复慢"}',
'{"invoiceType":"增值税专用发票","invoiceFrequency":"每月一次","specialRequirements":"开票金额与实际业务不符，需要调整","historicalIssues":"多次出现发票问题"}',
'{"taxType":"增值税","deadline":"2024-06-15","notes":"已逾期，需要补申报","attachments":[]}',
'approved', '资料长期不齐，需要重点关注', '4', '2024-04-10 10:00:00', '2024-04-10 15:00:00', '2024-04-10 15:00:00');

-- 续约跟进记录数据
-- 场景1：临近到期客户的跟进记录
INSERT INTO renewal_follow_ups (id, customer_id, user_id, contact_date, contact_method, content, result, next_follow_up_date, attachments, created_at) VALUES
('1', '1', '3', '2024-06-10', 'wechat', '通过微信联系客户李总，询问续约意向', '客户表示有意续约，正在商谈价格', '2024-06-20', '[]', '2024-06-10 14:00:00'),
('2', '1', '3', '2024-06-05', 'phone', '电话联系客户，提醒合同即将到期', '客户表示会考虑续约', '2024-06-10', '[]', '2024-06-05 10:00:00');

-- 场景5：已到期客户的跟进记录
INSERT INTO renewal_follow_ups (id, customer_id, user_id, contact_date, contact_method, content, result, next_follow_up_date, attachments, created_at) VALUES
('3', '5', '6', '2024-05-30', 'wechat', '微信联系客户，询问续约情况', '客户回复暂不考虑续约', NULL, '[]', '2024-05-30 16:00:00'),
('4', '5', '6', '2024-05-25', 'phone', '电话联系客户，提醒合同已到期', '客户表示需要时间考虑', '2024-05-30', '[]', '2024-05-25 11:00:00');

-- 历史备注数据
-- 场景1的备注
INSERT INTO notes (id, customer_id, user_id, type, title, content, attachments, created_at, updated_at) VALUES
('1', '1', '2', 'general', '客户账务情况', '客户账务处理正常，每月按时提供资料', '[]', '2024-05-01 10:00:00', '2024-05-01 10:00:00'),
('2', '1', '3', 'renewal', '续约沟通记录', '客户有意续约，正在商谈价格，预计6月底前确定', '[]', '2024-06-10 14:00:00', '2024-06-10 14:00:00');

-- 场景2的备注
INSERT INTO notes (id, customer_id, user_id, type, title, content, attachments, created_at, updated_at) VALUES
('3', '2', '7', 'handover', '交接前账务情况', '2024年Q1季度报表未核对，需要新接手会计重点关注', '[]', '2024-05-20 09:00:00', '2024-05-20 09:00:00'),
('4', '2', '5', 'issue', '资料不齐问题', '前任会计交接时提到资料长期不齐，需要加强资料收集', '[]', '2024-05-21 10:00:00', '2024-05-21 10:00:00');

-- 场景3的备注
INSERT INTO notes (id, customer_id, user_id, type, title, content, attachments, created_at, updated_at) VALUES
('5', '3', '2', 'issue', '资料长期不齐', '缺少2023年全年银行流水和成本发票，多次催促客户未果', '[]', '2024-04-10 10:00:00', '2024-04-10 10:00:00'),
('6', '3', '6', 'issue', '客户失联', '客户电话经常无人接听，微信回复慢，沟通困难', '[]', '2024-04-15 11:00:00', '2024-04-15 11:00:00'),
('7', '3', '4', 'general', '主管审核意见', '该客户资料长期不齐，建议暂停服务，待资料补齐后再恢复', '[]', '2024-04-20 15:00:00', '2024-04-20 15:00:00');