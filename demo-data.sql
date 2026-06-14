-- 重新创建演示数据，适配新的状态流转

-- 清空现有数据
DELETE FROM OperationLog;
DELETE FROM MaterialList;
DELETE FROM CaseReport;

-- 1. 待核赔流程的案例（查勘员已确认，等待核赔主管审批）
INSERT INTO CaseReport (id, reportNo, policyNo, policyHolder, accidentDesc, reporterId, status, createdAt, updatedAt)
VALUES (
  'case-pending-review-001',
  'CASE20240001',
  'POL2024001234',
  '张三',
  '2024年6月1日下午3点，在上海市浦东新区发生交通事故，车辆受损严重，无人员伤亡。',
  'user-001',
  'PENDING_REVIEW',
  '2024-06-01 15:00:00',
  '2024-06-02 10:00:00'
);

-- 待核赔案例的材料清单
INSERT INTO MaterialList (id, caseId, materialName, materialType, attachmentUrl, uploadStatus, verifiedBy, verifiedAt, createdAt, updatedAt)
VALUES 
('mat-review-001', 'case-pending-review-001', '事故现场照片', 'image', 'upload_photo_001.jpg', 'CONFIRMED', 'user-002', '2024-06-02 09:00:00', '2024-06-01 15:30:00', '2024-06-02 09:00:00'),
('mat-review-002', 'case-pending-review-001', '保单复印件', 'document', 'upload_policy_001.pdf', 'CONFIRMED', 'user-002', '2024-06-02 09:00:00', '2024-06-01 15:30:00', '2024-06-02 09:00:00'),
('mat-review-003', 'case-pending-review-001', '身份证明', 'document', 'upload_id_001.pdf', 'CONFIRMED', 'user-002', '2024-06-02 09:00:00', '2024-06-01 15:30:00', '2024-06-02 09:00:00');

-- 待核赔案例的操作日志
INSERT INTO OperationLog (id, caseId, materialId, operatorId, operatorRole, actionType, beforeStatus, afterStatus, remark, createdAt)
VALUES
('log-review-101', 'case-pending-review-001', NULL, 'user-001', 'CLAIM_AGENT', 'SUBMIT', 'PENDING_SUBMIT', 'SUBMITTED', '理赔专员提交报案', '2024-06-01 16:00:00'),
('log-review-102', 'case-pending-review-001', 'mat-review-001', 'user-002', 'SURVEYOR', 'VERIFY', 'UPLOADED', 'CONFIRMED', '查勘员确认现场照片', '2024-06-02 09:00:00'),
('log-review-103', 'case-pending-review-001', 'mat-review-002', 'user-002', 'SURVEYOR', 'VERIFY', 'UPLOADED', 'CONFIRMED', '查勘员确认保单复印件', '2024-06-02 09:00:00'),
('log-review-104', 'case-pending-review-001', 'mat-review-003', 'user-002', 'SURVEYOR', 'VERIFY', 'UPLOADED', 'CONFIRMED', '查勘员确认身份证明', '2024-06-02 09:00:00'),
('log-review-105', 'case-pending-review-001', NULL, 'user-002', 'SURVEYOR', 'SUBMIT', 'SUBMITTED', 'PENDING_REVIEW', '查勘员确认材料清单完成，提交核赔', '2024-06-02 10:00:00');

-- 2. 已完成的案例（核赔主管已审批通过）
INSERT INTO CaseReport (id, reportNo, policyNo, policyHolder, accidentDesc, reporterId, status, createdAt, updatedAt)
VALUES (
  'case-completed-001',
  'CASE20240002',
  'POL2024005678',
  '李四',
  '2024年6月2日上午10点，在北京市朝阳区发生火灾，房屋部分受损。',
  'user-001',
  'COMPLETED',
  '2024-06-02 10:00:00',
  '2024-06-03 15:00:00'
);

-- 已完成案例的材料清单
INSERT INTO MaterialList (id, caseId, materialName, materialType, attachmentUrl, uploadStatus, verifiedBy, verifiedAt, createdAt, updatedAt)
VALUES 
('mat-completed-001', 'case-completed-001', '事故现场照片', 'image', 'upload_photo_002.jpg', 'CONFIRMED', 'user-002', '2024-06-02 14:00:00', '2024-06-02 10:30:00', '2024-06-02 14:00:00'),
('mat-completed-002', 'case-completed-001', '保单复印件', 'document', 'upload_policy_002.pdf', 'CONFIRMED', 'user-002', '2024-06-02 14:00:00', '2024-06-02 10:30:00', '2024-06-02 14:00:00'),
('mat-completed-003', 'case-completed-001', '身份证明', 'document', 'upload_id_002.pdf', 'CONFIRMED', 'user-002', '2024-06-02 14:00:00', '2024-06-02 10:30:00', '2024-06-02 14:00:00');

-- 已完成案例的操作日志
INSERT INTO OperationLog (id, caseId, materialId, operatorId, operatorRole, actionType, beforeStatus, afterStatus, remark, createdAt)
VALUES
('log-completed-101', 'case-completed-001', NULL, 'user-001', 'CLAIM_AGENT', 'SUBMIT', 'PENDING_SUBMIT', 'SUBMITTED', '理赔专员提交报案', '2024-06-02 11:00:00'),
('log-completed-102', 'case-completed-001', 'mat-completed-001', 'user-002', 'SURVEYOR', 'VERIFY', 'UPLOADED', 'CONFIRMED', '查勘员确认现场照片', '2024-06-02 14:00:00'),
('log-completed-103', 'case-completed-001', 'mat-completed-002', 'user-002', 'SURVEYOR', 'VERIFY', 'UPLOADED', 'CONFIRMED', '查勘员确认保单复印件', '2024-06-02 14:00:00'),
('log-completed-104', 'case-completed-001', 'mat-completed-003', 'user-002', 'SURVEYOR', 'VERIFY', 'UPLOADED', 'CONFIRMED', '查勘员确认身份证明', '2024-06-02 14:00:00'),
('log-completed-105', 'case-completed-001', NULL, 'user-002', 'SURVEYOR', 'SUBMIT', 'SUBMITTED', 'PENDING_REVIEW', '查勘员确认材料清单完成，提交核赔', '2024-06-02 15:00:00'),
('log-completed-106', 'case-completed-001', NULL, 'user-003', 'UNDERWRITER', 'CONFIRM', 'PENDING_REVIEW', 'COMPLETED', '核赔主管审批通过', '2024-06-03 15:00:00');

-- 3. 已驳回的案例（查勘员发现材料不全）
INSERT INTO CaseReport (id, reportNo, policyNo, policyHolder, accidentDesc, reporterId, status, createdAt, updatedAt)
VALUES (
  'case-rejected-001',
  'CASE20240003',
  'POL2024009012',
  '王五',
  '2024年6月3日下午2点，在广州市天河区发生水灾，财产损失严重。',
  'user-001',
  'REJECTED',
  '2024-06-03 14:00:00',
  '2024-06-03 16:00:00'
);

-- 驳回案例的材料清单（部分未确认）
INSERT INTO MaterialList (id, caseId, materialName, materialType, attachmentUrl, uploadStatus, verifiedBy, verifiedAt, createdAt, updatedAt)
VALUES 
('mat-rejected-001', 'case-rejected-001', '事故现场照片', 'image', 'upload_photo_003.jpg', 'UPLOADED', NULL, NULL, '2024-06-03 14:30:00', '2024-06-03 14:30:00'),
('mat-rejected-002', 'case-rejected-001', '保单复印件', 'document', NULL, 'NOT_UPLOADED', NULL, NULL, '2024-06-03 14:30:00', '2024-06-03 14:30:00'),
('mat-rejected-003', 'case-rejected-001', '身份证明', 'document', 'upload_id_003.pdf', 'UPLOADED', NULL, NULL, '2024-06-03 14:30:00', '2024-06-03 14:30:00');

-- 驳回案例的操作日志
INSERT INTO OperationLog (id, caseId, materialId, operatorId, operatorRole, actionType, beforeStatus, afterStatus, remark, createdAt)
VALUES
('log-rejected-101', 'case-rejected-001', NULL, 'user-001', 'CLAIM_AGENT', 'SUBMIT', 'PENDING_SUBMIT', 'SUBMITTED', '理赔专员提交报案', '2024-06-03 15:00:00'),
('log-rejected-102', 'case-rejected-001', NULL, 'user-002', 'SURVEYOR', 'REJECT', 'SUBMITTED', 'REJECTED', '材料不全：缺少保单复印件，请补充完整后再提交', '2024-06-03 16:00:00');

-- 4. 复核不通过的案例（核赔主管发现问题）
INSERT INTO CaseReport (id, reportNo, policyNo, policyHolder, accidentDesc, reporterId, status, createdAt, updatedAt)
VALUES (
  'case-review-failed-001',
  'CASE20240004',
  'POL2024003456',
  '赵六',
  '2024年6月4日上午9点，在深圳市南山区发生盗窃事件，贵重物品丢失。',
  'user-001',
  'REVIEW_FAILED',
  '2024-06-04 09:00:00',
  '2024-06-04 18:00:00'
);

-- 复核不通过案例的材料清单（已确认但被复核不通过）
INSERT INTO MaterialList (id, caseId, materialName, materialType, attachmentUrl, uploadStatus, verifiedBy, verifiedAt, createdAt, updatedAt)
VALUES 
('mat-failed-001', 'case-review-failed-001', '事故现场照片', 'image', 'upload_photo_004.jpg', 'CONFIRMED', 'user-002', '2024-06-04 15:00:00', '2024-06-04 09:30:00', '2024-06-04 15:00:00'),
('mat-failed-002', 'case-review-failed-001', '保单复印件', 'document', 'upload_policy_004.pdf', 'CONFIRMED', 'user-002', '2024-06-04 15:00:00', '2024-06-04 09:30:00', '2024-06-04 15:00:00'),
('mat-failed-003', 'case-review-failed-001', '身份证明', 'document', 'upload_id_004.pdf', 'CONFIRMED', 'user-002', '2024-06-04 15:00:00', '2024-06-04 09:30:00', '2024-06-04 15:00:00');

-- 复核不通过案例的操作日志
INSERT INTO OperationLog (id, caseId, materialId, operatorId, operatorRole, actionType, beforeStatus, afterStatus, remark, createdAt)
VALUES
('log-failed-101', 'case-review-failed-001', NULL, 'user-001', 'CLAIM_AGENT', 'SUBMIT', 'PENDING_SUBMIT', 'SUBMITTED', '理赔专员提交报案', '2024-06-04 10:00:00'),
('log-failed-102', 'case-review-failed-001', 'mat-failed-001', 'user-002', 'SURVEYOR', 'VERIFY', 'UPLOADED', 'CONFIRMED', '查勘员确认现场照片', '2024-06-04 15:00:00'),
('log-failed-103', 'case-review-failed-001', 'mat-failed-002', 'user-002', 'SURVEYOR', 'VERIFY', 'UPLOADED', 'CONFIRMED', '查勘员确认保单复印件', '2024-06-04 15:00:00'),
('log-failed-104', 'case-review-failed-001', 'mat-failed-003', 'user-002', 'SURVEYOR', 'VERIFY', 'UPLOADED', 'CONFIRMED', '查勘员确认身份证明', '2024-06-04 15:00:00'),
('log-failed-105', 'case-review-failed-001', NULL, 'user-002', 'SURVEYOR', 'SUBMIT', 'SUBMITTED', 'PENDING_REVIEW', '查勘员确认材料清单完成，提交核赔', '2024-06-04 16:00:00'),
('log-failed-106', 'case-review-failed-001', NULL, 'user-003', 'UNDERWRITER', 'REJECT', 'PENDING_REVIEW', 'REVIEW_FAILED', '复核不通过：事故经过描述不够详细，损失清单未提供，请补充后重新提交', '2024-06-04 18:00:00');

-- 5. 待提交的案例（用于演示新流程）
INSERT INTO CaseReport (id, reportNo, policyNo, policyHolder, accidentDesc, reporterId, status, createdAt, updatedAt)
VALUES (
  'case-pending-submit-001',
  'CASE20240005',
  'POL2024007890',
  '孙七',
  '2024年6月5日上午11点，在成都市武侯区发生车辆剐蹭事故。',
  'user-001',
  'PENDING_SUBMIT',
  '2024-06-05 11:00:00',
  '2024-06-05 11:00:00'
);

-- 待提交案例的材料清单（未上传）
INSERT INTO MaterialList (id, caseId, materialName, materialType, attachmentUrl, uploadStatus, verifiedBy, verifiedAt, createdAt, updatedAt)
VALUES 
('mat-pending-001', 'case-pending-submit-001', '事故现场照片', 'image', NULL, 'NOT_UPLOADED', NULL, NULL, '2024-06-05 11:30:00', '2024-06-05 11:30:00'),
('mat-pending-002', 'case-pending-submit-001', '保单复印件', 'document', NULL, 'NOT_UPLOADED', NULL, NULL, '2024-06-05 11:30:00', '2024-06-05 11:30:00'),
('mat-pending-003', 'case-pending-submit-001', '身份证明', 'document', NULL, 'NOT_UPLOADED', NULL, NULL, '2024-06-05 11:30:00', '2024-06-05 11:30:00');