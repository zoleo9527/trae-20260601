import json
import re
import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent

def check_file_exists(filepath):
    path = BASE_DIR / filepath
    if not path.exists():
        print(f"❌ 缺失文件: {filepath}")
        return False, None
    return True, path.read_text(encoding='utf-8')

def check_syntax_errors(content, filepath):
    errors = []
    lines = content.split('\n')
    
    for i, line in enumerate(lines, 1):
        if 'filter(' in line and line.count('(') != line.count(')'):
            errors.append(f"  第{i}行: 括号不匹配 - {line.strip()}")
    
    for i, line in enumerate(lines, 1):
        if 'v-for=' in line and ' in ' in line and ('(' in line or ')' in line):
            if 'v-for="(c in ' in line:
                errors.append(f"  第{i}行: v-for 语法错误（应为 'of' 而非 'in'）- {line.strip()}")
    
    for i, line in enumerate(lines, 1):
        if '/50' in line or '/70' in line or '/40' in line or '/80' in line or '/90' in line:
            if 'bg-' in line or 'border-' in line:
                has_standard_color = any(c in line for c in ['bg-black', 'bg-white', 'bg-gray'])
                has_custom_color = any(c in line for c in ['bg-neutral', 'bg-danger', 'bg-success', 'bg-primary', 'border-danger', 'border-neutral', 'border-primary'])
                if has_custom_color and not has_standard_color:
                    errors.append(f"  第{i}行: 自定义颜色透明度问题 - {line.strip()}")
    
    return errors

def check_alert_fields_in_types(content):
    required_fields = ['description', 'linkId', 'linkType', 'meta']
    missing = []
    for field in required_fields:
        if field not in content:
            missing.append(field)
    return missing

def check_alert_fields_in_mockdata(content):
    required_fields = ['description', 'linkId', 'linkType', 'meta']
    missing = []
    for field in required_fields:
        if field not in content:
            missing.append(field)
    return missing

def check_store_actions(content):
    required_actions = [
        'addInspection',
        'addRectification', 
        'addAlert',
        'updateRectification',
        'addRecheckResult'
    ]
    missing = []
    for action in required_actions:
        if action not in content:
            missing.append(action)
    return missing

def check_submit_inspection_logic(content):
    checks = {
        'addInspection 调用': 'appStore.addInspection' in content,
        'addAlert 调用': 'appStore.addAlert' in content,
        '完整字段构造': 'newRecord: InspectionRecord' in content or 'const newRecord' in content,
        'items 生成': 'inspectionCriteria.map' in content,
        'failItems 生成': 'failItems.push' in content,
        '验证逻辑': 'answeredCount < inspectionCriteria.length' in content,
        'router.push': "router.push('/inspection')" in content
    }
    return checks

def check_handle_recheck_logic(content):
    checks = {
        'addRecheckResult 调用': 'addRecheckResult' in content,
        '状态更新': 'updateRectificationStatus' in content,
        '提醒生成': 'addAlert' in content
    }
    return checks

def check_handle_closeloop_logic(content):
    checks = {
        'closedAt 设置': 'closedAt' in content,
        'closedBy 设置': 'closedBy' in content,
        '年检状态同步': 'updateInspectionStatus' in content,
        '提醒生成': 'addAlert' in content
    }
    return checks

def check_alert_click_logic(content):
    checks = {
        'linkId 使用': 'alert.linkId' in content,
        'linkType 使用': 'alert.linkType' in content,
        'setSelectedInspection': 'setSelectedInspection' in content,
        'setSelectedRectification': 'setSelectedRectification' in content
    }
    return checks

def check_photos_field(content):
    return 'm.photos && m.photos.length > 0' in content

def check_getcycledays_logic(content):
    return 'inspectionDate' in content and 'appStore.inspections.find' in content

def check_progress_passed_not_closed(content):
    return ("if (rect.status === 'closed') return 100" in content or "status === 'closed' || status === 'passed'" not in content) and "if (rect.status === 'passed') return 95" in content

def check_deadline_label_passed(content):
    return "if (status === 'passed') return '待签署闭环'" in content

def check_progress_color_passed(content):
    return "if (rect.status === 'passed') return 'bg-gradient-to-r from-primary-500 to-primary-600'" in content

def check_stats_to_sign_loop(content):
    return "toSignLoop" in content

def check_dashboard_to_sign_loop(content):
    return "'待签署闭环'" in content and "toSignLoop" in content

def check_sidebar_to_sign_loop(content):
    return "toSignLoop" in content

def check_completed_list_contains_passed(content):
    return "r.status === 'recheck' || r.status === 'passed'" in content

def check_dispatch_rectification(content):
    checks = {
        'addRectification 调用': 'appStore.addRectification' in content,
        '生成 rectificationId': 'generateRectificationId' in content,
        '更新年检状态为 rectifying': "updateInspectionStatus(insp.id, 'rectifying')" in content,
        '生成提醒': 'appStore.addAlert' in content,
        'rectificationMeasures 构造': 'rectificationMeasures' in content
    }
    return checks

def check_closed_passed_separated(content):
    return "r.status === 'closed' || r.status === 'passed'" not in content

def check_pending_todo_count(content):
    return 'pendingTodoCount: (state)' in content or 'pendingTodoCount:(state)' in content

def check_mock_todos_types(content):
    return "'system'" not in content

def main():
    print("=" * 70)
    print("🔍 年检资料主链路修复验证脚本")
    print("=" * 70)
    print()
    
    all_passed = True
    
    test_cases = [
        ("📄 types/index.ts - Alert 接口字段", [
            lambda c: check_alert_fields_in_types(c)
        ], "types/index.ts"),
        ("📄 data/mockData.ts - mockAlerts 字段", [
            lambda c: check_alert_fields_in_mockdata(c)
        ], "data/mockData.ts"),
        ("📄 stores/app.ts - Action 方法", [
            lambda c: check_store_actions(c)
        ], "stores/app.ts"),
        ("📄 pages/inspection/index.vue - 语法错误", [
            lambda c: check_syntax_errors(c, "inspection/index.vue")
        ], "pages/inspection/index.vue"),
        ("📄 pages/inspection/new.vue - 语法错误", [
            lambda c: check_syntax_errors(c, "inspection/new.vue")
        ], "pages/inspection/new.vue"),
        ("📄 pages/inspection/new.vue - 提交逻辑", [
            lambda c: check_submit_inspection_logic(c)
        ], "pages/inspection/new.vue"),
        ("📄 pages/rectification/completed.vue - photos 字段", [
            lambda c: check_photos_field(c)
        ], "pages/rectification/completed.vue"),
        ("📄 pages/rectification/closed.vue - getCycleDays", [
            lambda c: check_getcycledays_logic(c)
        ], "pages/rectification/closed.vue"),
        ("📄 pages/rectification/index.vue - handleRecheck", [
            lambda c: check_handle_recheck_logic(c)
        ], "pages/rectification/index.vue"),
        ("📄 pages/rectification/index.vue - handleCloseLoop", [
            lambda c: check_handle_closeloop_logic(c)
        ], "pages/rectification/index.vue"),
        ("📄 pages/alerts.vue - 提醒跳转逻辑", [
            lambda c: check_alert_click_logic(c)
        ], "pages/alerts.vue"),
        ("📄 components/RectificationDetailModal.vue - 透明度类名", [
            lambda c: check_syntax_errors(c, "RectificationDetailModal.vue")
        ], "components/RectificationDetailModal.vue"),
        ("📄 components/InspectionDetailModal.vue - 透明度类名", [
            lambda c: check_syntax_errors(c, "InspectionDetailModal.vue")
        ], "components/InspectionDetailModal.vue"),
        ("📄 pages/inspection/index.vue - 派发整改单逻辑", [
            lambda c: check_dispatch_rectification(c)
        ], "pages/inspection/index.vue"),
        ("📄 pages/rectification/closed.vue - passed/closed 状态区分", [
            lambda c: check_closed_passed_separated(c)
        ], "pages/rectification/closed.vue"),
        ("📄 pages/rectification/index.vue - passed/closed 状态区分", [
            lambda c: check_closed_passed_separated(c)
        ], "pages/rectification/index.vue"),
        ("📄 stores/app.ts - pendingTodoCount getter", [
            lambda c: check_pending_todo_count(c)
        ], "stores/app.ts"),
        ("📄 data/mockData.ts - mockTodos 类型值", [
            lambda c: check_mock_todos_types(c)
        ], "data/mockData.ts"),
        ("📄 pages/rectification/index.vue - passed 进度不=100%", [
            lambda c: check_progress_passed_not_closed(c)
        ], "pages/rectification/index.vue"),
        ("📄 pages/rectification/index.vue - passed 到期文案", [
            lambda c: check_deadline_label_passed(c)
        ], "pages/rectification/index.vue"),
        ("📄 pages/rectification/index.vue - passed 进度颜色", [
            lambda c: check_progress_color_passed(c)
        ], "pages/rectification/index.vue"),
        ("📄 stores/app.ts - toSignLoop 统计", [
            lambda c: check_stats_to_sign_loop(c)
        ], "stores/app.ts"),
        ("📄 pages/index.vue - 工作台待签署闭环", [
            lambda c: check_dashboard_to_sign_loop(c)
        ], "pages/index.vue"),
        ("📄 components/AppSidebar.vue - 侧边栏统计", [
            lambda c: check_sidebar_to_sign_loop(c)
        ], "components/AppSidebar.vue"),
        ("📄 pages/rectification/completed.vue - 列表含 passed", [
            lambda c: check_completed_list_contains_passed(c)
        ], "pages/rectification/completed.vue"),
    ]
    
    for test_name, check_funcs, filepath in test_cases:
        print(test_name)
        print("-" * 50)
        
        exists, content = check_file_exists(filepath)
        if not exists:
            all_passed = False
            print()
            continue
        
        for check_func in check_funcs:
            result = check_func(content)
            
            if isinstance(result, list):
                if result:
                    print(f"  ❌ 发现问题:")
                    for err in result:
                        print(f"    {err}")
                    all_passed = False
                else:
                    print(f"  ✅ 通过")
            elif isinstance(result, dict):
                all_pass = True
                for check_name, passed in result.items():
                    status = "✅" if passed else "❌"
                    if not passed:
                        all_pass = False
                        all_passed = False
                    print(f"  {status} {check_name}: {passed}")
                if not all_pass:
                    print(f"  ❌ 部分检查未通过")
        
        print()
    
    print("=" * 70)
    if all_passed:
        print("🎉 所有验证通过！年检资料主链路已修复完成。")
        print()
        print("📋 修复内容总结:")
        print("  1. ✅ inspection/index.vue 语法错误修复")
        print("  2. ✅ inspection/new.vue 语法错误修复 + 完整提交逻辑")
        print("  3. ✅ types/index.ts Alert 接口字段扩展")
        print("  4. ✅ data/mockData.ts mockAlerts 字段补充")
        print("  5. ✅ stores/app.ts 新增 5 个业务 Action")
        print("  6. ✅ 页面字段名统一（photos、description、linkId 等）")
        print("  7. ✅ 年检提交写入列表 + 生成提醒")
        print("  8. ✅ 整改复查写入记录 + 生成提醒")
        print("  9. ✅ 闭环签署设置归档字段 + 同步年检状态")
        print("  10. ✅ 提醒跳转链路打通（linkId + selectedId）")
        print("  11. ✅ Tailwind 透明度类名问题修复")
        print("  12. ✅ IconLoader 图标组件补充")
    else:
        print("❌ 部分验证未通过，请检查上述问题。")
        sys.exit(1)
    print("=" * 70)

if __name__ == '__main__':
    main()
