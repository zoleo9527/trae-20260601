#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

file_path = '/Users/liu/Documents/private/model-test/trae-20260601-5/scripts/demo-full-flow.sh'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# ==========================================
# 问题 1: 添加步骤 0a: seeder 初始化接口
# ==========================================
step_0a = '''echo "=============================================="
echo "=== 步骤 0a: 初始化种子数据 ==="
echo "=============================================="
echo ""
echo "--- 清空旧数据 ---"
curl -s -X DELETE "$BASE_URL/seeder/clear"
echo ""
echo "--- 初始化种子数据（6阿姨+4需求+2订单+2评价+2匹配快照+5匹配尝试+4审计日志） ---"
RESP=$(curl -s -X POST "$BASE_URL/seeder/seed")
echo "$RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('  初始化结果:', d.get('success', False))
c = d.get('counts', {})
print(f'  创建数量: 阿姨={c.get(\\"housekeepers\\",0)}, 需求={c.get(\\"intakes\\",0)}, 订单={c.get(\\"orders\\",0)}, 评价={c.get(\\"reviews\\",0)}')
print(f'  匹配回看: 快照={c.get(\\"matchingSnapshots\\",0)}, 尝试={c.get(\\"matchingAttempts\\",0)}, 审计日志={c.get(\\"auditLogs\\",0)}')
" 2>/dev/null || print_json "$RESP"
echo ""
echo "--- 当前数据统计 ---"
RESP=$(curl -s "$BASE_URL/seeder/summary")
echo "$RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'  当前总数: 阿姨={d.get(\\"housekeepers\\",0)}, 需求={d.get(\\"intakes\\",0)}, 订单={d.get(\\"orders\\",0)}, 评价={d.get(\\"reviews\\",0)}')
print(f'  匹配数据: 尝试={d.get(\\"matchingAttempts\\",0)}, 快照={d.get(\\"matchingSnapshots\\",0)}, 审计={d.get(\\"auditLogs\\",0)}')
" 2>/dev/null || print_json "$RESP"
echo ""

'''

# 在步骤0之后插入
pattern_step0_end = r'fi\necho ""\n\ndeclare -a HK_IDS=\(\)'
replacement_step0_end = 'fi\necho ""\n\n' + step_0a + 'declare -a HK_IDS=()'
content = re.sub(pattern_step0_end, replacement_step0_end, content, count=1)

# ==========================================
# 问题 1: 修改步骤 a: 从创建阿姨改为读取阿姨列表
# ==========================================
old_step_a = '''echo "=============================================="
echo "=== 步骤 a: 创建 6 个阿姨 ==="
echo "=============================================="

create_housekeeper\(\) \{
  local name="\$1" phone="\$2" skills="\$3" area="\$4" exp="\$5" salary="\$6"
  echo ""
  echo "--- 创建阿姨: \$name ---"
  local resp=\$\(curl -s -X POST "\$BASE_URL/housekeepers" \\
    -H "Content-Type: application/json" \\
    -d "\{
      \\"name\\": \\"\$name\\",
      \\"phone\\": \\"\$phone\\",
      \\"skills\\": \\"\$skills\\",
      \\"coverageArea\\": \\"\$area\\",
      \\"experienceYears\\": \$exp,
      \\"expectedMinSalary\\": \$salary,
      \\"status\\": \\"ACTIVE\\",
      \\"hasCriminalRecordCheck\\": true,
      \\"hasHealthCertificate\\": true
    \}"\)
  local id=\$\(echo "\$resp" | python3 -c "import sys,json; print\(json.load\(sys.stdin\).get\('id',''\)\)" 2>/dev/null \|\| true\)
  HK_IDS\+=\("\$id"\)
  echo "  姓名: \$name | 技能: \$skills | 区域: \$area"
  print_json "\$resp"
\}

create_housekeeper "李阿姨" "13800000001" "月嫂,育儿嫂" "朝阳区" 5 8000
create_housekeeper "王阿姨" "13800000002" "保姆,保洁" "海淀区" 3 6000
create_housekeeper "张阿姨" "13800000003" "月嫂,催乳师" "西城区" 8 10000
create_housekeeper "赵阿姨" "13800000004" "老人护理,烹饪" "丰台区" 6 7000
create_housekeeper "刘阿姨" "13800000005" "保洁,育儿" "东城区" 4 6500
create_housekeeper "孙阿姨" "13800000006" "月嫂,育儿嫂,催乳师" "朝阳区" 10 12000

HK_LI="\$\{HK_IDS\[0\]\}"
HK_WANG="\$\{HK_IDS\[1\]\}"
HK_ZHANG="\$\{HK_IDS\[2\]\}"
HK_ZHAO="\$\{HK_IDS\[3\]\}"
HK_LIU="\$\{HK_IDS\[4\]\}"
HK_SUN="\$\{HK_IDS\[5\]\}"

echo ""
echo "  阿姨ID汇总:"
for i in 0 1 2 3 4 5; do
  echo "    \$\{HK_NAMES\[\$i\]\}: \$\{HK_IDS\[\$i\]\}"
done
echo ""'''

new_step_a = '''echo "=============================================="
echo "=== 步骤 a: 获取阿姨列表 ==="
echo "=============================================="
echo ""
RESP=$(curl -s "$BASE_URL/housekeepers?pageSize=20")
echo "$RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d.get('list', d.get('items', []))
print(f'  共 {len(items)} 位阿姨:')
for i, hk in enumerate(items):
    print(f'  [{i}] {hk.get(\\"name\\",\\"\\")} | 技能: {hk.get(\\"skills\\",\\"\\")} | 区域: {hk.get(\\"coverageArea\\",\\"\\")} | 评分: {hk.get(\\"averageRating\\",\\"\\")}')
" 2>/dev/null || print_json "$RESP"

HK_LI=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('list',d.get('items',[])); [print(hk['id']) for hk in items if hk.get('name')=='李阿姨']" 2>/dev/null || true)
HK_WANG=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('list',d.get('items',[])); [print(hk['id']) for hk in items if hk.get('name')=='王阿姨']" 2>/dev/null || true)
HK_ZHANG=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('list',d.get('items',[])); [print(hk['id']) for hk in items if hk.get('name')=='张阿姨']" 2>/dev/null || true)
HK_ZHAO=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('list',d.get('items',[])); [print(hk['id']) for hk in items if hk.get('name')=='赵阿姨']" 2>/dev/null || true)
HK_LIU=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('list',d.get('items',[])); [print(hk['id']) for hk in items if hk.get('name')=='刘阿姨']" 2>/dev/null || true)
HK_SUN=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('list',d.get('items',[])); [print(hk['id']) for hk in items if hk.get('name')=='孙阿姨']" 2>/dev/null || true)

echo ""
echo "  阿姨 ID 提取:"
echo "    李阿姨: $HK_LI"
echo "    王阿姨: $HK_WANG"
echo "    张阿姨: $HK_ZHANG"
echo "    赵阿姨: $HK_ZHAO"
echo "    刘阿姨: $HK_LIU"
echo "    孙阿姨: $HK_SUN"
echo ""'''

# 由于正则表达式匹配大段内容可能有问题，让我们用更简单的方式：找到步骤a的起止位置
# 找到步骤a开始的位置
step_a_start = content.find('echo "=============================================="\necho "=== 步骤 a: 创建 6 个阿姨 ==="\necho "=============================================="')
step_a_end = content.find('declare -a INTAKE_IDS=()', step_a_start)

if step_a_start != -1 and step_a_end != -1:
    content = content[:step_a_start] + new_step_a + '\n' + content[step_a_end:]
else:
    print("Warning: Could not find step a boundaries")

# ==========================================
# 问题 1: 修改步骤 b: 从创建客户需求改为读取
# ==========================================
old_step_b_start = 'echo "=============================================="\necho "=== 步骤 b: 创建 4 个客户需求（分配责任人+阻塞原因） ==="\necho "=============================================="'

new_step_b = '''echo "=============================================="
echo "=== 步骤 b: 获取客户需求列表 ==="
echo "=============================================="
echo ""
RESP=$(curl -s "$BASE_URL/intakes?pageSize=20")
echo "$RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d.get('list', d.get('items', []))
print(f'  共 {len(items)} 个客户需求:')
for i, intake in enumerate(items):
    print(f'  [{i}] {intake.get(\\"customerName\\",\\"\\")} | 服务: {intake.get(\\"serviceType\\",\\"\\")} | 预算: {intake.get(\\"salaryBudget\\",\\"\\")} | 状态: {intake.get(\\"status\\",\\"\\")}')
" 2>/dev/null || print_json "$RESP"

INTAKE_CHEN=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('list',d.get('items',[])); [print(ik['id']) for ik in items if ik.get('customerName')=='陈女士']" 2>/dev/null || true)
INTAKE_LIU=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('list',d.get('items',[])); [print(ik['id']) for ik in items if ik.get('customerName')=='刘先生']" 2>/dev/null || true)
INTAKE_ZHOU=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('list',d.get('items',[])); [print(ik['id']) for ik in items if ik.get('customerName')=='周女士']" 2>/dev/null || true)
INTAKE_WU=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('list',d.get('items',[])); [print(ik['id']) for ik in items if ik.get('customerName')=='吴先生']" 2>/dev/null || true)

echo ""
echo "  需求单ID汇总:"
echo "    陈女士(月嫂): $INTAKE_CHEN"
echo "    刘先生(保姆): $INTAKE_LIU"
echo "    周女士(保洁): $INTAKE_ZHOU"
echo "    吴先生(老人护理): $INTAKE_WU"
echo ""'''

step_b_start = content.find(old_step_b_start)
step_b_end = content.find('echo "=============================================="\necho "=== 步骤 c: 运行匹配算法', step_b_start)

if step_b_start != -1 and step_b_end != -1:
    content = content[:step_b_start] + new_step_b + '\n' + content[step_b_end:]
else:
    print("Warning: Could not find step b boundaries")

# ==========================================
# 问题 2: 添加步骤 b1: 客户需求回看接口
# ==========================================
step_b1 = '''echo "=============================================="
echo "=== 步骤 b1: 客户需求回看（初始化审计记录） ==="
echo "=============================================="
echo ""
echo "--- 周女士需求审计轨迹 ---"
echo "  GET /api/intakes/{周女士ID}/trace"
RESP=$(curl -s "$BASE_URL/intakes/$INTAKE_ZHOU/trace")
echo "$RESP" | python3 -c "
import sys, json
logs = json.load(sys.stdin)
print(f'  审计记录数: {len(logs)}')
for l in logs[:3]:
    created = l.get('createdAt', l.get('created_at', '?'))[:19]
    actor = l.get('actorName', l.get('actor_name', '系统'))
    action = l.get('action', '?')
    remark = l.get('remark', '')[:50] if l.get('remark') else ''
    print(f'    [{created}] {actor} - {action} {remark}')
" 2>/dev/null || print_json "$RESP"
echo ""

'''

# 在步骤c之前插入步骤b1
step_c_start = content.find('echo "=============================================="\necho "=== 步骤 c: 运行匹配算法')
if step_c_start != -1:
    content = content[:step_c_start] + step_b1 + content[step_c_start:]
else:
    print("Warning: Could not find step c start")

# ==========================================
# 问题 3.1: 修正爽约处理字段
# ==========================================
old_no_show = "echo \"$RESP\" | python3 -c \"import sys,json; d=json.load(sys.stdin); print('    resolutionType:', d.get('noShowResolutionType'), '| status:', d.get('status'))\" 2>/dev/null || print_json \"$RESP\""
new_no_show = "echo \"$RESP\" | python3 -c \"import sys,json; d=json.load(sys.stdin); print('    处理方案:', d.get('noShowResolution'), '| 责任人:', d.get('ownerName'), '| 状态:', d.get('status'))\" 2>/dev/null || print_json \"$RESP\""
content = content.replace(old_no_show, new_no_show)

# ==========================================
# 问题 3.2: 修正差评跟进字段
# ==========================================
old_followup = "echo \"$RESP\" | python3 -c \"import sys,json; d=json.load(sys.stdin); print('    status:', d.get('status'), '| followUpCount:', d.get('followUpCount'))\" 2>/dev/null || print_json \"$RESP\""
new_followup = "echo \"$RESP\" | python3 -c \"import sys,json; d=json.load(sys.stdin); notes=d.get('followUpNotes',''); count=notes.count('\\n')+1 if notes else 0; print('    状态:', d.get('status'), '| 跟进次数:', count)\" 2>/dev/null || print_json \"$RESP\""
content = content.replace(old_followup, new_followup)

# ==========================================
# 问题 4: 添加系统设计简化说明
# ==========================================
old_ending = '''echo "=============================================="
echo "  脚本执行完毕"
echo "=============================================="'''

new_ending = '''echo "=============================================="
echo "  脚本执行完毕"
echo "=============================================="

echo ""
echo "=============================================="
echo "  系统设计说明 - 简化点说明"
echo "=============================================="
echo ""
echo "  【权限简化】"
echo "    - 当前实现：操作人信息通过请求体传入（actorRole/actorId/actorName）"
echo "    - 无真正的身份认证和权限校验"
echo "    - 生产环境建议：接入 JWT/OAuth2，通过 AuthGuard 解析用户"
echo ""
echo "  【附件简化】"
echo "    - 当前实现：无文件上传、存储、预览功能"
echo "    - 不影响核心业务流程：匹配、状态流转、审计日志"
echo "    - 生产环境建议：接入 OSS/S3 对象存储，相关实体添加附件字段"
echo ""
echo "  【通知简化】"
echo "    - 当前实现：状态变更后无短信、推送、邮件等通知"
echo "    - 通知是触发式副作用，不影响核心业务状态正确性"
echo "    - 生产环境建议：引入 EventBus 事件驱动，状态变更发布事件，通知服务订阅"
echo ""
echo "  【外部系统简化】"
echo "    - 当前实现：无支付、CRM、排班、财务等外部系统对接"
echo "    - 聚焦核心闭环：需求-匹配-服务-评价"
echo "    - 生产环境建议：通过防腐层（Anti-Corruption Layer）对接，保持领域模型纯净"
echo ""
echo "=============================================="
echo "  脚本执行完毕"
echo "=============================================="'''

# 只替换最后一个出现的"脚本执行完毕"块
content = content[::-1].replace(old_ending[::-1], new_ending[::-1], 1)[::-1]

# ==========================================
# 更新总结部分的描述
# ==========================================
content = content.replace("    - 创建了6位不同技能、不同区域的阿姨档案（李阿姨、王阿姨、张阿姨、赵阿姨、刘阿姨、孙阿姨）",
                          "    - 从种子数据读取6位不同技能、不同区域的阿姨档案（李阿姨、王阿姨、张阿姨、赵阿姨、刘阿姨、孙阿姨）")
content = content.replace("    - 创建了4个客户需求：陈女士(月嫂)、刘先生(保姆)、周女士(保洁)、吴先生(老人护理)",
                          "    - 从种子数据读取4个客户需求：陈女士(月嫂)、刘先生(保姆)、周女士(保洁)、吴先生(老人护理)")

# 添加 b1 步骤到总结
summary_b = '''echo "  【b. 客户需求】"
echo "    - 从种子数据读取4个客户需求：陈女士(月嫂)、刘先生(保姆)、周女士(保洁)、吴先生(老人护理)"
echo "    - 每个需求都分配了客服责任人"
echo "    - 其中2个设置了阻塞原因：等待客户澄清、客户联系不上"
echo ""'''

summary_b1 = '''echo "  【b1. 客户需求回看】"
echo "    - 调用审计轨迹接口查看周女士需求的初始化审计记录"
echo ""'''

# 找到b部分并添加b1
b_section = content.find('echo "  【b. 客户需求】"')
c_section = content.find('echo "  【c. 匹配算法】"')
if b_section != -1 and c_section != -1:
    content = content[:b_section] + summary_b + summary_b1 + content[c_section:]

# 写回文件
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("修改完成！")
