-- 演示数据脚本

-- 1. 正常推进流程的案例（已完成）
INSERT INTO CaseReport (id, reportNo, policyNo, policyHolder, accidentDesc, reporterId, status, createdAt, updatedAt)
VALUES (
  'case-normal-001',
  'CASE20240001',
  'POL2024001234',
  '张三',
  '2024年6月1日下午3点，在上海市浦东新区发生交通事故，车辆受损严重，无人员伤亡。',
  'user-001',
  'COMPLETED',
  '2024-06-01 15:00:00',
  '2024-06-03 10:00:00'
);

-- 正常流程的材料清单
INSERT INTO MaterialList (id, caseId, materialName, materialType, attachmentUrl, uploadStatus, verifiedBy, verifiedAt, createdAt, updatedAt)
VALUES 
('mat-normal-001', 'case-normal-001', '事故现场照片', 'image', 'upload_photo_001.jpg', 'CONFIRMED', 'user-002', '2024-06-02 09:00:00', '2024-06-01 15:30:00', '2024-06-02 09:00:00'),
('mat-normal-002', 'case-normal-001', '保单复印件', 'document', 'upload_policy_001.pdf', 'CONFIRMED', 'user-002', '2024-06-02 09:00:00', '2024-06-01 15:30:00', '2024-06-02 09:00:00'),
('mat-normal-003', 'case-normal-001', '身份证明', 'document', 'upload_id_001.pdf', 'CONFIRMED', 'user-002', '2024-06-02 09:00:00', '2024-06-01 15:30:00', '2024-06-02 09:00:00');

-- 正常流程的操作日志
INSERT INTO OperationLog (id, caseId, materialId, operatorId, operatorRole, actionType, beforeStatus, afterStatus, remark, createdAt)
VALUES
('log-normal-001', 'case-normal-001', NULL, 'user-001', 'CLAIM_AGENT', 'SUBMIT', 'PENDING_SUBMIT', 'SUBMITTED', '理赔专员提交报案', '2024-06-01 16:00:00'),
('log-normal-002', 'case-normal-001', 'mat-normal-001', 'user-002', 'SURVEYOR', 'VERIFY', 'UPLOADED', 'CONFIRMED', '查勘员确认现场照片', '2024-06-02 09:00:00'),
('log-normal-003', 'case-normal-001', 'mat-normal-002', 'user-002', 'SURVEYOR', 'VERIFY', 'UPLOADED', 'CONFIRMED', '查勘员确认保单复印件', '2024-06-02 09:00:00'),
('log-normal-004', 'case-normal-001', 'mat-normal-003', 'user-002', 'SURVEYOR', 'VERIFY', 'UPLOADED', 'CONFIRMED', '查勘员确认身份证明', '2024-06-02 09:00:00'),
('log-normal-005', 'case-normal-001', NULL, 'user-002', 'SURVEYOR', 'CONFIRM', 'SUBMITTED', 'COMPLETED', '查勘员确认材料清单完成', '2024-06-02 10:00:00');

-- 2. 异常处理流程的案例（被驳回）
INSERT INTO CaseReport (id, reportNo, policyNo, policyHolder, accidentDesc, reporterId, status, createdAt, updatedAt)
VALUES (
  'case-rejected-001',
  'CASE20240002',
  'POL2024005678',
  '李四',
  '2024年6月2日上午10点，在北京市朝阳区发生火灾，房屋部分受损。',
  'user-001',
  'REJECTED',
  '2024-06-02 10:00:00',
  '2024-06-02 14:00:00'
);

-- 驳回流程的材料清单（部分未确认）
INSERT INTO MaterialList (id, caseId, materialName, materialType, attachmentUrl, uploadStatus, verifiedBy, verifiedAt, createdAt, updatedAt)
VALUES 
('mat-rejected-001', 'case-rejected-001', '事故现场照片', 'image', 'upload_photo_002.jpg', 'UPLOADED', NULL, NULL, '2024-06-02 10:30:00', '2024-06-02 10:30:00'),
('mat-rejected-002', 'case-rejected-001', '保单复印件', 'document', NULL, 'NOT_UPLOADED', NULL, NULL, '2024-06-02 10:30:00', '2024-06-02 10:30:00'),
('mat-rejected-003', 'case-rejected-001', '身份证明', 'document', 'upload_id_002.pdf', 'UPLOADED', NULL, NULL, '2024-06-02 10:30:00', '2024-06-02 10:30:00');

-- 驳回流程的操作日志
INSERT INTO OperationLog (id, caseId, materialId, operatorId, operatorRole, actionType, beforeStatus, afterStatus, remark, createdAt)
VALUES
('log-rejected-001', 'case-rejected-001', NULL, 'user-001', 'CLAIM_AGENT', 'SUBMIT', 'PENDING_SUBMIT', 'SUBMITTED', '理赔专员提交报案', '2024-06-02 11:00:00'),
('log-rejected-002', 'case-rejected-001', NULL, 'user-002', 'SURVEYOR', 'REJECT', 'SUBMITTED', 'REJECTED', '材料不全：缺少保单复印件，请补充完整后再提交', '2024-06-02 14:00:00');

-- 3. 异常处理流程的案例（复核不通过）
INSERT INTO CaseReport (id, reportNo, policyNo, policyHolder, accidentDesc, reporterId, status, createdAt, updatedAt)
VALUES (
  'case-review-failed-001',
  'CASE20240003',
  'POL2024009012',
  '王五',
  '2024年6月3日下午2点，在广州市天河区发生水灾，财产损失严重。',
  'user-001',
  'REVIEW_FAILED',
  '2024-06-03 14:00:00',
  '2024-06-03 18:00:00'
);

-- 复核不通过流程的材料清单（已确认但被复核不通过）
INSERT INTO MaterialList (id, caseId, materialName, materialType, attachmentUrl, uploadStatus, verifiedBy, verifiedAt, createdAt, updatedAt)
VALUES 
('mat-review-001', 'case-review-failed-001', '事故现场照片', 'image', 'upload_photo_003.jpg', 'CONFIRMED', 'user-002', '2024-06-03 15:00:00', '2024-06-03 14:30:00', '2024-06-03 15:00:00'),
('mat-review-002', 'case-review-failed-001', '保单复印件', 'document', 'upload_policy_003.pdf', 'CONFIRMED', 'user-002', '2024-06-03 15:00:00', '2024-06-03 14:30:00', '2024-06-03 15:00:00'),
('mat-review-003', 'case-review-failed-001', '身份证明', 'document', 'upload_id_003.pdf', 'CONFIRMED', 'user-002', '2024-06-03 15:00:00', '2024-06-03 14:30:00', '2024-06-03 15:00:00');

-- 复核不通过流程的操作日志
INSERT INTO OperationLog (id, caseId, materialId, operatorId, operatorRole, actionType, beforeStatus, afterStatus, remark, createdAt)
VALUES
('log-review-001', 'case-review-failed-001', NULL, 'user-001', 'CLAIM_AGENT', 'SUBMIT', 'PENDING_SUBMIT', 'SUBMITTED', '理赔专员提交报案', '2024-06-03 15:00:00'),
('log-review-002', 'case-review-failed-001', 'mat-review-001', 'user-002', 'SURVEYOR', 'VERIFY', 'UPLOADED', 'CONFIRMED', '查勘员确认现场照片', '2024-06-03 15:30:00'),
('log-review-003', 'case-review-failed-001', 'mat-review-002', 'user-002', 'SURVEYOR', 'VERIFY', 'UPLOADED', 'CONFIRMED', '查勘员确认保单复印件', '2024-06-03 15:30:00'),
('log-review-004', 'case-review-failed-001', 'mat-review-003', 'user-002', 'SURVEYOR', 'VERIFY', 'UPLOADED', 'CONFIRMED', '查勘员确认身份证明', '2024-06-03 15:30:00'),
('log-review-005', 'case-review-failed-001', NULL, 'user-002', 'SURVEYOR', 'CONFIRM', 'SUBMITTED', 'SUBMITTED', '查勘员确认材料清单完成', '2024-06-03 16:00:00'),
('log-review-006', 'case-review-failed-001', NULL, 'user-003', 'UNDERWRITER', 'REJECT', 'SUBMITTED', 'REVIEW_FAILED', '复核不通过：事故经过描述不够详细，损失清单未提供，请补充后重新提交', '2024-06-03 18:00:00');

-- 4. 待处理的案例（用于演示新流程）
INSERT INTO CaseReport (id, reportNo, policyNo, policyHolder, accidentDesc, reporterId, status, createdAt, updatedAt)
VALUES (
  'case-pending-001',
  'CASE20240004',
  'POL2024003456',
  '赵六',
  '2024年6月4日上午9点，在深圳市南山区发生盗窃事件，贵重物品丢失。',
  'user-001',
  'PENDING_SUBMIT',
  '2024-06-04 09:00:00',
  '2024-06-04 09:00:00'
);

-- 待处理案例的材料清单（未上传）
INSERT INTO MaterialList (id, caseId, materialName, materialType, attachmentUrl, uploadStatus, verifiedBy, verifiedAt, createdAt, updatedAt)
VALUES 
('mat-pending-001', 'case-pending-001', '事故现场照片', 'image', NULL, 'NOT_UPLOADED', NULL, NULL, '2024-06-04 09:30:00', '2024-06-04 09:30:00'),
('mat-pending-002', 'case-pending-001', '保单复印件', 'document', NULL, 'NOT_UPLOADED', NULL, NULL, '2024-06-04 09:30:00', '2024-06-04 09:30:00'),
('mat-pending-003', 'case-pending-001', '身份证明', 'document', NULL, 'NOT_UPLOADED', NULL, NULL, '2024-06-04 09:30:00', '2024-06-04 09:30:00');