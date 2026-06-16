#!/bin/bash

echo "测试1: 管理员(u4)创建排号 - 应该被拒绝"
curl -s -X POST http://localhost:3002/api/queues \
  -H "Content-Type: application/json" \
  -d '{"customerName":"管理员测试","phone":"13800000000","partySize":2,"submittedBy":"u4"}'
echo -e "\n"

echo "测试2: 后厨主管(u2)创建排号 - 应该被拒绝"
curl -s -X POST http://localhost:3002/api/queues \
  -H "Content-Type: application/json" \
  -d '{"customerName":"后厨测试","phone":"13800000001","partySize":2,"submittedBy":"u2"}'
echo -e "\n"

echo "测试3: 收银员(u3)创建排号 - 应该被拒绝"
curl -s -X POST http://localhost:3002/api/queues \
  -H "Content-Type: application/json" \
  -d '{"customerName":"收银测试","phone":"13800000002","partySize":2,"submittedBy":"u3"}'
echo -e "\n"

echo "测试4: 前厅经理(u1)创建排号 - 应该成功"
curl -s -X POST http://localhost:3002/api/queues \
  -H "Content-Type: application/json" \
  -d '{"customerName":"前厅测试","phone":"13800000003","partySize":2,"submittedBy":"u1"}'
echo -e "\n"

echo "所有测试完成！"
