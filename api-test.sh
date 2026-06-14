# API 测试脚本

## 测试 1：获取所有报案
curl http://localhost:3000/api/cases

## 测试 2：获取待核赔案件
curl http://localhost:3000/api/cases?status=PENDING_REVIEW

## 测试 3：获取单个报案详情（含材料和日志）
curl http://localhost:3000/api/cases/case-pending-review-001

## 测试 4：模拟理赔专员提交报案（新建）
curl -X POST http://localhost:3000/api/cases \
  -H "Content-Type: application/json" \
  -d '{"policyNo":"POL20249999","policyHolder":"测试用户","accidentDesc":"测试事故","reporterId":"user-001"}'

## 测试 5：核赔主管审批通过
curl -X POST http://localhost:3000/api/cases/case-pending-review-001/approve \
  -H "Content-Type: application/json" \
  -d '{"operatorId":"user-003","operatorRole":"UNDERWRITER"}'

## 测试 6：核赔主管复核不通过
curl -X POST http://localhost:3000/api/cases/case-pending-review-001/review-fail \
  -H "Content-Type: application/json" \
  -d '{"operatorId":"user-003","reason":"测试复核不通过原因"}'

## 测试 7：查勘员提交核赔
curl -X POST http://localhost:3000/api/cases/case-pending-submit-001/complete \
  -H "Content-Type: application/json" \
  -d '{"operatorId":"user-002","operatorRole":"SURVEYOR"}'

## 测试 8：查勘员驳回报案
curl -X POST http://localhost:3000/api/cases/case-pending-submit-001/reject \
  -H "Content-Type: application/json" \
  -d '{"operatorId":"user-002","reason":"测试驳回原因"}'

## 测试 9：理赔专员提交报案
curl -X POST http://localhost:3000/api/cases/case-pending-submit-001/submit \
  -H "Content-Type: application/json" \
  -d '{"operatorId":"user-001","operatorRole":"CLAIM_AGENT"}'

## 测试 10：获取操作日志
curl http://localhost:3000/api/logs/case-pending-review-001