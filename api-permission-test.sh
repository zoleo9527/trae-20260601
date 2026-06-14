#!/bin/bash

# API 测试脚本
# 演示如何测试所有 API 端点的权限控制

BASE_URL="http://localhost:3000/api"

echo "==================================="
echo "保险理赔中心 API 权限测试"
echo "==================================="
echo ""

# 测试1：获取所有报案
echo "测试1：获取所有报案"
echo "-----------------------------------"
curl -s $BASE_URL/cases | jq '.cases | length'
echo ""
echo ""

# 测试2：提交报案（正确角色：理赔专员）
echo "测试2：提交报案（正确角色：理赔专员）"
echo "-----------------------------------"
echo "注意：需要选择一个处于 PENDING_SUBMIT 状态的案件"
echo "命令：curl -X POST $BASE_URL/cases/{caseId}/submit \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -d '{\"operatorId\":\"user-001\",\"operatorRole\":\"CLAIM_AGENT\"}'"
echo ""
echo "预期：✅ 成功"
echo ""

# 测试3：提交报案（错误角色：查勘员）
echo "测试3：提交报案（错误角色：查勘员）"
echo "-----------------------------------"
echo "命令：curl -X POST $BASE_URL/cases/{caseId}/submit \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -d '{\"operatorId\":\"user-002\",\"operatorRole\":\"SURVEYOR\"}'"
echo ""
echo "预期：❌ 403 错误 - 只有理赔专员才能提交报案"
echo ""

# 测试4：驳回（正确角色：查勘员）
echo "测试4：驳回报案（正确角色：查勘员）"
echo "-----------------------------------"
echo "注意：需要选择一个处于 SUBMITTED 状态的案件"
echo "命令：curl -X POST $BASE_URL/cases/{caseId}/reject \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -d '{\"operatorId\":\"user-002\",\"operatorRole\":\"SURVEYOR\",\"reason\":\"测试驳回\"}'"
echo ""
echo "预期：✅ 成功"
echo ""

# 测试5：驳回（错误角色：理赔专员）
echo "测试5：驳回报案（错误角色：理赔专员）"
echo "-----------------------------------"
echo "命令：curl -X POST $BASE_URL/cases/{caseId}/reject \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -d '{\"operatorId\":\"user-001\",\"operatorRole\":\"CLAIM_AGENT\",\"reason\":\"测试驳回\"}'"
echo ""
echo "预期：❌ 403 错误 - 只有查勘员才能驳回报案"
echo ""

# 测试6：提交核赔（正确角色：查勘员）
echo "测试6：提交核赔（正确角色：查勘员）"
echo "-----------------------------------"
echo "注意：需要选择一个处于 SUBMITTED 状态且所有材料都已确认的案件"
echo "命令：curl -X POST $BASE_URL/cases/{caseId}/complete \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -d '{\"operatorId\":\"user-002\",\"operatorRole\":\"SURVEYOR\"}'"
echo ""
echo "预期：✅ 成功"
echo ""

# 测试7：核赔通过（正确角色：核赔主管）
echo "测试7：核赔通过（正确角色：核赔主管）"
echo "-----------------------------------"
echo "注意：需要选择一个处于 PENDING_REVIEW 状态的案件"
echo "命令：curl -X POST $BASE_URL/cases/{caseId}/approve \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -d '{\"operatorId\":\"user-003\",\"operatorRole\":\"UNDERWRITER\"}'"
echo ""
echo "预期：✅ 成功"
echo ""

# 测试8：核赔通过（错误状态）
echo "测试8：核赔通过（错误状态）"
echo "-----------------------------------"
echo "命令：curl -X POST $BASE_URL/cases/{caseId}/approve \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -d '{\"operatorId\":\"user-003\",\"operatorRole\":\"UNDERWRITER\"}'"
echo ""
echo "预期：❌ 400 错误 - 案件状态不符合要求，必须先提交核赔"
echo ""

# 测试9：复核不通过（正确角色：核赔主管）
echo "测试9：复核不通过（正确角色：核赔主管）"
echo "-----------------------------------"
echo "注意：需要选择一个处于 PENDING_REVIEW 状态的案件"
echo "命令：curl -X POST $BASE_URL/cases/{caseId}/review-fail \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -d '{\"operatorId\":\"user-003\",\"operatorRole\":\"UNDERWRITER\",\"reason\":\"测试复核不通过\"}'"
echo ""
echo "预期：✅ 成功"
echo ""

# 测试10：复核不通过（错误角色）
echo "测试10：复核不通过（错误角色：查勘员）"
echo "-----------------------------------"
echo "命令：curl -X POST $BASE_URL/cases/{caseId}/review-fail \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -d '{\"operatorId\":\"user-002\",\"operatorRole\":\"SURVEYOR\",\"reason\":\"测试复核不通过\"}'"
echo ""
echo "预期：❌ 403 错误 - 只有核赔主管才能执行复核不通过"
echo ""

# 测试11：获取单个报案详情
echo "测试11：获取单个报案详情"
echo "-----------------------------------"
echo "命令：curl $BASE_URL/cases/{caseId}"
echo ""
echo "预期：✅ 返回案件详情，包含 materials 和 logs"
echo ""

# 测试12：获取操作日志
echo "测试12：获取操作日志"
echo "-----------------------------------"
echo "命令：curl $BASE_URL/logs/{caseId}"
echo ""
echo "预期：✅ 返回该案件的所有操作日志"
echo ""

echo "==================================="
echo "测试完成"
echo "==================================="
echo ""
echo "提示："
echo "1. 将 {caseId} 替换为实际的案件 ID"
echo "2. 可以使用 jq 工具美化 JSON 输出"
echo "3. 示例：curl -s $BASE_URL/cases | jq '.'"
echo ""
echo "案件 ID 参考："
sqlite3 prisma/dev.db "SELECT id, reportNo, status FROM CaseReport;" 2>/dev/null || echo "请先启动服务器"
echo ""
echo "数据库路径："
echo "确保从项目根目录运行服务器，数据库路径：$(pwd)/prisma/dev.db"