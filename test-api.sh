#!/bin/bash
echo "=== 测试后端 API ==="
echo ""

# 测试看板统计
echo "1. 测试看板统计接口..."
curl -s -H "X-User-Role: supervisor" http://localhost:3003/api/dashboard/stats | head -200
echo ""
echo ""

# 测试盘点差异列表
echo "2. 测试盘点差异列表接口..."
curl -s -H "X-User-Role: supervisor" "http://localhost:3003/api/differences?page=1&pageSize=5" | head -200
echo ""
echo ""

# 测试损耗记录列表
echo "3. 测试损耗记录列表接口..."
curl -s -H "X-User-Role: supervisor" "http://localhost:3003/api/losses?page=1&pageSize=5" | head -200
echo ""
echo ""

# 测试预警列表
echo "4. 测试预警列表接口..."
curl -s -H "X-User-Role: supervisor" "http://localhost:3003/api/alerts?page=1&pageSize=5" | head -200
echo ""
echo ""

# 测试活跃预警
echo "5. 测试活跃预警接口..."
curl -s -H "X-User-Role: supervisor" http://localhost:3003/api/alerts/active | head -200
echo ""
echo ""

echo "=== 测试完成 ==="
