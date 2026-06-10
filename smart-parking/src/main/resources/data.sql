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

INSERT IGNORE INTO fault_report (id, report_no, elevator_id, fault_type, fault_description, reporter_name, reporter_phone, report_source, status, handler_id, accept_time, complete_time, solution, has_entrapment, entrapment_count, transfer_rescue_id, remark, export_status, attachment_count, notification_status, create_time, update_time) VALUES
(1, 'FR20260601A0001', 1, '门机故障', '电梯开关门异响，关门速度变慢', '刘先生', '13900000001', '电话报修', 'PROCESSING', 2, '2026-06-01 09:30:00', NULL, NULL, FALSE, 0, NULL, '门机皮带可能松动，需到场检查', 'NOT_EXPORTED', 0, 'NOTIFIED', '2026-06-01 09:15:00', '2026-06-01 09:30:00'),
(2, 'FR20260602A0002', 2, '困人', '电梯突然停在8楼，有人被困', '陈女士', '13900000002', '监控告警', 'TRANSFERRED_TO_RESCUE', 3, '2026-06-02 14:20:00', NULL, NULL, TRUE, 3, 1, '电梯急停，3人被困8楼，已通知救援', 'NOT_EXPORTED', 1, 'NOTIFIED', '2026-06-02 14:10:00', '2026-06-02 14:25:00'),
(3, 'FR20260530A0003', 3, '按钮失灵', '3楼下行按钮按下无反应', '王师傅', '13900000003', '巡检发现', 'COMPLETED', 2, '2026-05-30 10:00:00', '2026-05-30 15:30:00', '更换按钮开关，测试正常', FALSE, 0, NULL, '定期更换易损件', 'EXPORTED', 2, 'NOTIFIED', '2026-05-30 09:45:00', '2026-05-30 15:30:00');

INSERT IGNORE INTO entrapment_rescue (id, rescue_no, elevator_id, fault_report_id, trapped_count, trapped_floor, reporter_name, reporter_phone, status, report_time, arrival_time, rescued_time, complete_time, rescuer_id, rescue_process, entrapment_reason, has_injury, injury_description, solution, remark, initial_remark, export_status, attachment_count, notification_status, create_time, update_time) VALUES
(1, 'ER20260602B0001', 2, 2, 3, '8楼', '陈女士', '13900000002', 'RESCUING', '2026-06-02 14:10:00', '2026-06-02 14:25:00', NULL, NULL, 3, '已到达现场，正在手动盘车救人', NULL, FALSE, NULL, NULL, '由故障报修转入，原报修单号：FR20260602A0002', '电梯急停，3人被困8楼，已通知救援', 'NOT_EXPORTED', 0, 'NOTIFIED', '2026-06-02 14:25:00', '2026-06-02 14:30:00'),
(2, 'ER20260603B0002', 4, NULL, 1, '15楼', '赵大爷', '13900000004', 'PENDING_RESCUE', '2026-06-03 08:05:00', NULL, NULL, NULL, NULL, NULL, NULL, FALSE, NULL, NULL, '紧急！老人被困', '老人独自被困，比较紧张', 'NOT_EXPORTED', 0, 'NOTIFIED', '2026-06-03 08:05:00', '2026-06-03 08:05:00');

INSERT IGNORE INTO handle_record (id, record_type, record_id, action, from_status, to_status, content, operator_id, operator_name, operate_time) VALUES
(1, 'FAULT_REPORT', 1, '创建故障报修', NULL, 'PENDING', '创建故障报修，故障类型：门机故障，故障描述：电梯开关门异响，关门速度变慢，备注：门机皮带可能松动，需到场检查', NULL, '系统用户', '2026-06-01 09:15:00'),
(2, 'FAULT_REPORT', 1, '受理', 'PENDING', 'PROCESSING', '受理故障报修，处理人：李技师', 1, '张客服', '2026-06-01 09:30:00'),
(3, 'FAULT_REPORT', 2, '创建故障报修', NULL, 'PENDING', '创建故障报修，故障类型：困人，有人员被困，被困人数：3，备注：电梯急停，3人被困8楼，已通知救援', NULL, '系统用户', '2026-06-02 14:10:00'),
(4, 'FAULT_REPORT', 2, '受理', 'PENDING', 'PROCESSING', '受理故障报修，处理人：王技师', 1, '张客服', '2026-06-02 14:20:00'),
(5, 'FAULT_REPORT', 2, '转困人处置', 'PROCESSING', 'TRANSFERRED_TO_RESCUE', '转困人处置，困人单号：ER20260602B0001', 1, '张客服', '2026-06-02 14:25:00'),
(6, 'FAULT_REPORT', 3, '创建故障报修', NULL, 'PENDING', '创建故障报修，故障类型：按钮失灵，故障描述：3楼下行按钮按下无反应，备注：定期更换易损件', NULL, '系统用户', '2026-05-30 09:45:00'),
(7, 'FAULT_REPORT', 3, '受理', 'PENDING', 'PROCESSING', '受理故障报修，处理人：李技师', 4, '赵主管', '2026-05-30 10:00:00'),
(8, 'FAULT_REPORT', 3, '完成', 'PROCESSING', 'COMPLETED', '故障报修处理完成，更换按钮开关，测试正常', 2, '李技师', '2026-05-30 15:30:00'),
(9, 'ENTRAPMENT_RESCUE', 1, '创建', NULL, 'PENDING_RESCUE', '由故障报修转入，原报修单号：FR20260602A0002。初始备注：电梯急停，3人被困8楼，已通知救援', 1, '张客服', '2026-06-02 14:25:00'),
(10, 'ENTRAPMENT_RESCUE', 1, '到场救援', 'PENDING_RESCUE', 'RESCUING', '救援人员到场，开始救援：王技师', 3, '王技师', '2026-06-02 14:25:00'),
(11, 'ENTRAPMENT_RESCUE', 1, '救援中', 'RESCUING', 'RESCUING', '正在手动盘车，预计5分钟后开门', 3, '王技师', '2026-06-02 14:30:00'),
(12, 'ENTRAPMENT_RESCUE', 2, '创建困人处置', NULL, 'PENDING_RESCUE', '创建困人处置工单，被困人数：1，困人楼层：15楼，报案人：赵大爷，初始备注：老人独自被困，比较紧张', NULL, '系统用户', '2026-06-03 08:05:00');
