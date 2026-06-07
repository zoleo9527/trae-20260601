INSERT INTO sys_user (username, password, real_name, role, phone) VALUES
('yuding', '123456', '张预订', 'BOOKING', '13800138001'),
('loumian', '123456', '李经理', 'FLOOR', '13800138002'),
('batai', '123456', '王吧台', 'BAR', '13800138003'),
('admin', '123456', '管理员', 'ADMIN', '13800138000');

INSERT INTO drink (drink_code, drink_name, category, spec, unit, price, stock) VALUES
('BEER001', '青岛啤酒', '啤酒', '330ml', '瓶', 12.00, 200),
('BEER002', '百威啤酒', '啤酒', '330ml', '瓶', 15.00, 150),
('WHISKY001', '芝华士12年', '洋酒', '700ml', '瓶', 580.00, 30),
('WHISKY002', '黑方', '洋酒', '700ml', '瓶', 480.00, 25),
('COLA001', '可口可乐', '软饮', '330ml', '罐', 8.00, 300),
('JUICE001', '鲜榨橙汁', '软饮', '1L', '扎', 38.00, 50),
('SNACK001', '果盘', '小吃', '大份', '份', 68.00, 80),
('SNACK002', '爆米花', '小吃', '中份', '份', 28.00, 100);

INSERT INTO booking (booking_no, room_no, customer_name, customer_phone, member_id, booking_time, start_time, gift_amount, status, remark, create_by) VALUES
('BK20260607001', 'VIP888', '王先生', '13900139001', 1001, '2026-06-07 18:00:00', '2026-06-07 19:00:00', 200.00, 'CHECKED_IN', '会员赠送', 1),
('BK20260607002', 'A001', '李女士', '13900139002', NULL, '2026-06-07 19:00:00', '2026-06-07 19:30:00', 0.00, 'CHECKED_IN', '', 1),
('BK20260607003', 'B005', '陈总', '13900139003', 1002, '2026-06-07 17:00:00', '2026-06-07 18:00:00', 500.00, 'CHECKED_IN', 'VIP客户', 1),
('BK20260607004', 'VIP666', '赵先生', '13900139004', 1003, '2026-06-07 20:00:00', NULL, 300.00, 'PENDING', '预订未到', 1),
('BK20260607005', 'A003', '刘女士', '13900139005', NULL, '2026-06-07 20:30:00', NULL, 0.00, 'PENDING', '', 1),
('BK20260606001', 'VIP999', '周总', '13900139006', 1004, '2026-06-06 18:00:00', '2026-06-06 19:00:00', 800.00, 'CHECKED_IN', '昨日预订', 1);

INSERT INTO drink_outbound (outbound_no, booking_id, booking_no, room_no, outbound_type, status, total_amount, remark, create_by, handle_by, handle_time) VALUES
('OB20260607001', 1, 'BK20260607001', 'VIP888', 'SALE', 'COMPLETED', 150.00, '正常消费', 2, 3, '2026-06-07 19:30:00'),
('OB20260607002', 2, 'BK20260607002', 'A001', 'SALE', 'PENDING', 85.00, '', 2, NULL, NULL),
('OB20260607003', 3, 'BK20260607003', 'B005', 'SALE', 'PENDING', 680.00, '加急', 2, NULL, NULL),
('OB20260607004', 1, 'BK20260607001', 'VIP888', 'GIFT', 'REJECTED', 120.00, '', 2, 3, '2026-06-07 20:00:00');

INSERT INTO drink_outbound_item (outbound_id, drink_id, drink_name, spec, unit, price, quantity, amount) VALUES
(1, 1, '青岛啤酒', '330ml', '瓶', 12.00, 10, 120.00),
(1, 5, '可口可乐', '330ml', '罐', 8.00, 2, 16.00),
(1, 8, '爆米花', '中份', '份', 28.00, 1, 28.00),
(2, 2, '百威啤酒', '330ml', '瓶', 15.00, 5, 75.00),
(2, 8, '爆米花', '中份', '份', 28.00, 1, 28.00),
(3, 3, '芝华士12年', '700ml', '瓶', 580.00, 1, 580.00),
(3, 7, '果盘', '大份', '份', 68.00, 1, 68.00),
(3, 6, '鲜榨橙汁', '1L', '扎', 38.00, 1, 38.00),
(4, 1, '青岛啤酒', '330ml', '瓶', 12.00, 10, 120.00);

INSERT INTO gift_verification (verification_no, booking_id, booking_no, room_no, customer_name, member_id, gift_amount, used_amount, remaining_amount, status, remark, create_by, handle_by, handle_time, reject_reason) VALUES
('GV20260607001', 1, 'BK20260607001', 'VIP888', '王先生', 1001, 200.00, 150.00, 50.00, 'PENDING', '首次核销', 1, NULL, NULL, NULL),
('GV20260607002', 3, 'BK20260607003', 'B005', '陈总', 1002, 500.00, 0.00, 500.00, 'PENDING', '', 1, NULL, NULL, NULL),
('GV20260607003', 4, 'BK20260607004', 'VIP666', '赵先生', 1003, 300.00, 0.00, 300.00, 'PENDING', '', 1, NULL, NULL, NULL),
('GV20260606001', 6, 'BK20260606001', 'VIP999', '周总', 1004, 800.00, 500.00, 300.00, 'REJECTED', '', 1, 2, '2026-06-06 22:00:00', '酒水不足'),
('GV20260606002', 6, 'BK20260606001', 'VIP999', '周总', 1004, 800.00, 600.00, 200.00, 'COMPLETED', '', 1, 2, '2026-06-06 23:00:00', NULL);

INSERT INTO gift_verification_item (verification_id, drink_id, drink_name, spec, unit, price, quantity, amount) VALUES
(1, 1, '青岛啤酒', '330ml', '瓶', 12.00, 10, 120.00),
(1, 7, '果盘', '大份', '份', 68.00, 1, 68.00),
(4, 3, '芝华士12年', '700ml', '瓶', 580.00, 1, 580.00),
(5, 2, '百威啤酒', '330ml', '瓶', 15.00, 20, 300.00),
(5, 7, '果盘', '大份', '份', 68.00, 2, 136.00),
(5, 6, '鲜榨橙汁', '1L', '扎', 38.00, 2, 76.00);
