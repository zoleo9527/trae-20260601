#!/usr/bin/env python3
import sys

with open('adoption/api.py', 'r') as f:
    lines = f.readlines()

print(f"总行数: {len(lines)}")

# ===== 修改1: mark_follow_up_gap 函数 =====
# 第1236行: app = ... 改为 select_related + 状态校验
lines[1235] = "        app = AdoptionApplication.objects.select_related('current_handler').get(id=application_id)\n"
# 在1236行后插入状态校验
lines.insert(1236, "\n")
lines.insert(1237, "        if app.status not in [AdoptionStatus.APPROVED, AdoptionStatus.ADOPTION_COMPLETED]:\n")
lines.insert(1238, "            return ApiResponse(code=ErrorCode.INVALID_STATUS_TRANSITION, message='当前状态无法标记回访断档')\n")
print("✓ 修改1: 添加了状态校验和select_related")

# 重新计算行号（插入了3行，所以后面的行号+3）
# 第1240-1241行原来的 if not latest_follow_up 现在是 1243-1244
# 删除这两行，替换为注释
lines[1242] = "        # 无回访记录时直接创建断档记录\n"
del lines[1243]
print("✓ 修改2: 移除了FOLLOW_UP_NOT_FOUND返回")

# 重新计算行号（删除了1行，现在第1243-1245行是原来的latest_follow_up.is_gap等）
# 替换第1243-1245行（索引1242-1244）
old_block = lines[1242:1245]
new_block = [
    "        if latest_follow_up and not latest_follow_up.is_gap:\n",
    "            latest_follow_up.is_gap = True\n",
    "            latest_follow_up.gap_reason = remark or '回访断档'\n",
    "            latest_follow_up.save()\n",
    "            gap_record = latest_follow_up\n",
    "        else:\n",
    "            gap_date = timezone.now().date()\n",
    "            if follow_up_date:\n",
    "                try:\n",
    "                    gap_date = datetime.fromisoformat(follow_up_date.replace('Z', '+00:00')).date()\n",
    "                except:\n",
    "                    pass\n",
    "            gap_record = FollowUpRecord.objects.create(\n",
    "                application=app,\n",
    "                follow_up_date=gap_date,\n",
    "                follow_up_type='other',\n",
    "                operator=app.current_handler,\n",
    "                animal_health='',\n",
    "                adaptation='',\n",
    "                problems='',\n",
    "                suggestions='',\n",
    "                next_follow_up_at=None,\n",
    "                is_gap=True,\n",
    "                gap_reason=remark or '回访断档'\n",
    "            )\n"
]
lines[1242:1245] = new_block
print(f"✓ 修改3: 替换了断档逻辑，用了{len(new_block)}行")

# 修改返回值中的 latest_follow_up 为 gap_record
# 找到对应的行
for i in range(1260, 1290):
    if i < len(lines) and 'latest_follow_up).dict()' in lines[i]:
        lines[i] = lines[i].replace('latest_follow_up', 'gap_record')
        print(f"✓ 修改4: 第{i+1}行返回值改用gap_record")
        break

# ===== 修改2: 移除其他接口中被误加的状态校验 =====
# 查找所有包含"当前状态无法标记回访断档"的行，除了mark_follow_up_gap中的
target_msg = "当前状态无法标记回访断档"
count = 0
for i in range(len(lines)):
    if target_msg in lines[i]:
        # 检查是不是在mark_follow_up_gap函数中（行号约1255附近是正确的）
        if abs(i - 1238) > 50:  # 距离太远，说明是误加的
            # 删除这行和上一行（if app.status not in ...）
            # 先找 if 语句起始
            j = i
            while j > 0 and 'if app.status not in' not in lines[j]:
                j -= 1
            # 删除从j到i的行
            del lines[j:i+1]
            count += 1
            print(f"✓ 修改5: 移除了第{j+1}行附近的误加校验")
print(f"共移除了{count}处误加的状态校验")

# ===== 修改3: 详情摘要添加回访断档标识 =====
# 找到 ApplicationDetailSchema 或详情接口
# 先找到 get_application 函数
for i, line in enumerate(lines):
    if 'def get_application(' in line:
        print(f"✓ 详情接口在第{i+1}行")
        break

# 找到 ApplicationFullDetailSchema 并添加 has_follow_up_gap 字段
for i, line in enumerate(lines):
    if 'class ApplicationDetailSchema' in line or 'class ApplicationFullDetailSchema' in line:
        print(f"✓ 详情Schema在第{i+1}行: {line.strip()}")
        # 添加 has_follow_up_gap 字段
        for j in range(i, i+20):
            if j < len(lines) and 'status_display' in lines[j] and 'Optional' not in lines[j]:
                # 在这附近添加
                lines.insert(j+1, "    has_follow_up_gap: bool = False\n")
                lines.insert(j+2, "    latest_gap_reason: str = ''\n")
                print(f"✓ 修改6: 第{j+1}行后添加了断档字段")
                break
        break

with open('adoption/api.py', 'w') as f:
    f.writelines(lines)

print("\n✓ 所有修改已保存到 adoption/api.py")
