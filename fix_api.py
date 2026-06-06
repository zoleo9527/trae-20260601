#!/usr/bin/env python3
import sys

with open('adoption/api.py', 'r') as f:
    content = f.read()

print(f"读取文件成功，大小: {len(content)} 字符")

# 修改1: 函数签名添加 follow_up_date 参数
old3 = "def mark_follow_up_gap(request, application_id: str, remark: str = ''):"
new3 = "def mark_follow_up_gap(request, application_id: str, remark: str = '', follow_up_date: str = ''):"

if old3 in content:
    content = content.replace(old3, new3)
    print("✓ 修改3: 函数签名添加了 follow_up_date 参数")
else:
    print("✗ 修改3: 未找到匹配字符串")
    # 查找类似的行
    for i, line in enumerate(content.split('\n')):
        if 'mark_follow_up_gap' in line:
            print(f"  行 {i+1}: {line}")

# 修改5: 添加状态校验和改用 select_related
old5 = "        app = AdoptionApplication.objects.get(id=application_id)"
new5 = """        app = AdoptionApplication.objects.select_related('current_handler').get(id=application_id)
        
        if app.status not in [AdoptionStatus.APPROVED, AdoptionStatus.ADOPTION_COMPLETED]:
            return ApiResponse(code=ErrorCode.INVALID_STATUS_TRANSITION, message='当前状态无法标记回访断档')"""

if old5 in content:
    content = content.replace(old5, new5)
    print("✓ 修改5: 添加了状态校验和 select_related")
else:
    print("✗ 修改5: 未找到匹配字符串")

# 修改1: 移除 FOLLOW_UP_NOT_FOUND 返回逻辑
old1 = "        if not latest_follow_up:\n            return ApiResponse(code=ErrorCode.FOLLOW_UP_NOT_FOUND, message=ERROR_MESSAGES[ErrorCode.FOLLOW_UP_NOT_FOUND])"
new1 = "        # 没有回访记录时直接创建断档记录"

if old1 in content:
    content = content.replace(old1, new1)
    print("✓ 修改1: 移除了 FOLLOW_UP_NOT_FOUND 返回逻辑")
else:
    print("✗ 修改1: 未找到匹配字符串")

# 修改2: 把直接修改 latest_follow_up 改为条件判断 + 创建新记录逻辑
old2 = "        latest_follow_up.is_gap = True\n        latest_follow_up.gap_reason = remark or '回访断档'\n        latest_follow_up.save()"
new2 = """        if latest_follow_up and not latest_follow_up.is_gap:
            latest_follow_up.is_gap = True
            latest_follow_up.gap_reason = remark or '回访断档'
            latest_follow_up.save()
            gap_record = latest_follow_up
        else:
            gap_date = timezone.now().date()
            if follow_up_date:
                try:
                    gap_date = datetime.fromisoformat(follow_up_date.replace('Z', '+00:00')).date()
                except:
                    pass
            gap_record = FollowUpRecord.objects.create(
                application=app,
                follow_up_date=gap_date,
                follow_up_type='other',
                operator=app.current_handler,
                animal_health='',
                adaptation='',
                problems='',
                suggestions='',
                next_follow_up_at=None,
                is_gap=True,
                gap_reason=remark or '回访断档'
            )"""

if old2 in content:
    content = content.replace(old2, new2)
    print("✓ 修改2: 添加了创建新断档记录的逻辑")
else:
    print("✗ 修改2: 未找到匹配字符串")

# 修改4: 返回值用 gap_record 替代 latest_follow_up
old4 = "data=FollowUpSchema.from_orm(latest_follow_up).dict()"
new4 = "data=FollowUpSchema.from_orm(gap_record).dict()"

if old4 in content:
    content = content.replace(old4, new4)
    print("✓ 修改4: 返回值改用 gap_record")
else:
    print("✗ 修改4: 未找到匹配字符串")

# ===== 接下来修改其他部分 =====
print("\n--- 修改列表 Schema ---")

# 修改6: ApplicationListItemSchema 添加 has_follow_up_gap 字段
old_schema_fields = "    has_review_issue: bool\n\n    @staticmethod"
new_schema_fields = "    has_review_issue: bool\n    has_follow_up_gap: bool\n\n    @staticmethod"

if old_schema_fields in content:
    content = content.replace(old_schema_fields, new_schema_fields)
    print("✓ 修改6: 添加了 has_follow_up_gap 字段定义")
else:
    print("✗ 修改6: 未找到匹配字段字符串")

# 修改7: from_orm 方法中添加 has_follow_up_gap 计算
old_schema_calc = "            has_review_issue=has_review_issue\n        )"
new_schema_calc = "            has_review_issue=has_review_issue,\n            has_follow_up_gap=obj.follow_ups.filter(is_gap=True).exists()\n        )"

if old_schema_calc in content:
    content = content.replace(old_schema_calc, new_schema_calc)
    print("✓ 修改7: 添加了 has_follow_up_gap 计算逻辑")
else:
    print("✗ 修改7: 未找到匹配计算字符串")

print("\n--- 修改异常筛选 ---")

# 修改8: only_abnormal 筛选加入回访断档
old_abnormal_end = """            ]))
        )"""
new_abnormal_end = """            ])) |
            Q(follow_ups__is_gap=True)
        ).distinct()"""

if old_abnormal_end in content:
    content = content.replace(old_abnormal_end, new_abnormal_end)
    print("✓ 修改8: 异常筛选加入了回访断档")
else:
    print("✗ 修改8: 未找到匹配的异常筛选结尾")

print("\n--- 修改动物状态更新时机 ---")

# 修改9: approve_application 中移除提前更新动物状态
old_approve_status = """        app.last_action_at = timezone.now()
        app.animal.status = AnimalStatus.ADOPTED
        app.animal.save()
        app.save()"""
new_approve_status = """        app.last_action_at = timezone.now()
        app.save()"""

if old_approve_status in content:
    content = content.replace(old_approve_status, new_approve_status)
    print("✓ 修改9: 审核通过接口移除了动物状态更新")
else:
    print("✗ 修改9: 未找到匹配的审核通过状态更新")

print("\n--- 修改统计面板 ---")

# 修改10: 统计面板添加 follow_up_gaps
old_stats_fields = """            'approved': approved
        }"""
new_stats_fields = """            'approved': approved,
            'follow_up_gaps': AdoptionApplication.objects.filter(follow_ups__is_gap=True).distinct().count()
        }"""

if old_stats_fields in content:
    content = content.replace(old_stats_fields, new_stats_fields)
    print("✓ 修改10: 统计面板添加了 follow_up_gaps")
else:
    print("✗ 修改10: 未找到匹配的统计面板结尾")

# 保存文件
with open('adoption/api.py', 'w') as f:
    f.write(content)

print("\n✓ 所有修改已保存到 adoption/api.py")
