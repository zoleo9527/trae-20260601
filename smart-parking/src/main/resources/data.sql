INSERT IGNORE INTO elevator (id, elevator_no, location, building, floor_count, manufacturer, install_date, last_inspection_date, next_inspection_date, status, remark) VALUES
(1, 'E001', 'A座1单元', '商务楼A座', 25, '三菱电梯', '2020-03-15', '2026-01-10', '2027-01-10', '运行中', '客梯，载重1000kg'),
(2, 'E002', 'A座2单元', '商务楼A座', 25, '三菱电梯', '2020-03-15', '2026-01-10', '2027-01-10', '运行中', '客梯，载重1000kg'),
(3, 'E003', 'B座1单元', '商务楼B座', 18, '奥的斯电梯', '2019-08-20', '2025-12-05', '2026-12-05', '运行中', '货梯，载重2000kg'),
(4, 'E004', 'C座1单元', '住宅楼C座', 30, '日立电梯', '2021-06-01', '2026-02-20', '2027-02-20', '运行中', '客梯，载重800kg');

INSERT IGNORE INTO sys_user (id, username, name, phone, role) VALUES
(1, 'cs001', '张客服', '13800138001', 'CUSTOMER_SERVICE'),
(2, 'tech001', '李技师', '13800138002', 'MAINTENANCE_TECHNICIAN'),
(3, 'tech002', '王技师', '13800138003', 'MAINTENANCE_TECHNICIAN'),
(4, 'pm001', '赵主管', '13800138004', 'PROJECT_MANAGER');
