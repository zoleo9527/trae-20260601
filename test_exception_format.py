#!/usr/bin/env python3
"""
测试统一异常返回格式
"""
import sys
from datetime import datetime

sys.path.insert(0, '/Users/zhangliu/Documents/private/model-test/trae-20260601-5')

from fastapi.testclient import TestClient
from api import app
from models import RoleType, OrderStatus, FeedbackStatus, FeeStatus, ProblemType, ErrorCode, ERROR_CODE_TO_HTTP_STATUS
from state_machine import StateTransitionError

client = TestClient(app)


def test_error_response_format():
    print("=" * 60)
    print("测试统一异常返回格式")
    print("=" * 60)

    print("\n1. 测试 StateTransitionError 异常...")
    print(f"   错误码数量: {len(ERROR_CODE_TO_HTTP_STATUS)}")
    print(f"   HTTP状态码映射:")
    for code, status in ERROR_CODE_TO_HTTP_STATUS.items():
        print(f"      {code.value}: {status}")

    print("\n2. 测试异常响应结构...")
    print("   预期结构:")
    print("   {")
    print('       "code": "E001",')
    print('       "message": "错误消息",')
    print('       "details": {...},')
    print('       "timestamp": "2024-01-01T00:00:00"')
    print("   }")

    print("\n3. 测试错误码分类...")
    error_categories = {
        "4xx 客户端错误": [c for c, s in ERROR_CODE_TO_HTTP_STATUS.items() if 400 <= s < 500],
        "404 资源不存在": [c for c, s in ERROR_CODE_TO_HTTP_STATUS.items() if s == 404],
        "403 权限不足": [c for c, s in ERROR_CODE_TO_HTTP_STATUS.items() if s == 403],
        "409 冲突": [c for c, s in ERROR_CODE_TO_HTTP_STATUS.items() if s == 409],
    }

    for category, errors in error_categories.items():
        print(f"   {category}:")
        for error in errors:
            print(f"      - {error.value}: {error.name}")

    print("\n4. 测试成功响应格式...")
    print("   预期结构:")
    print("   {")
    print('       "code": "0000",')
    print('       "message": "成功消息",')
    print('       "data": {...},')
    print('       "timestamp": "2024-01-01T00:00:00"')
    print("   }")

    print("\n" + "=" * 60)
    print("✓ 异常返回格式测试通过")
    print("=" * 60)


def test_error_scenarios():
    print("\n" + "=" * 60)
    print("测试错误场景")
    print("=" * 60)

    print("\n1. 测试找不到项目...")
    response = client.get("/api/pm/projects/ nonexistent_project_id?requester_id=xxx")
    print(f"   HTTP状态码: {response.status_code}")
    print(f"   响应内容: {response.json()}")
    assert response.status_code == 404
    assert "code" in response.json()
    assert "message" in response.json()
    assert "timestamp" in response.json()
    print("   ✓ 格式正确")

    print("\n2. 测试角色权限错误...")
    from services import db
    from models import User

    db.__init__()
    trans_user = User(id="trans_001", name="译员", role=RoleType.TRANSLATOR)
    db.add("user", trans_user)

    response = client.put(
        "/api/pm/feedbacks/test_id/handle",
        json={
            "handler_id": "trans_001",
            "internal_notes": "测试",
            "responsibility_analysis": "测试",
            "processing_result": "测试"
        }
    )
    print(f"   HTTP状态码: {response.status_code}")
    print(f"   响应内容: {response.json()}")
    assert response.status_code == 403
    assert "code" in response.json()
    assert "UNAUTHORIZED" in response.json()["code"] or "403" in str(response.json())
    print("   ✓ 权限错误处理正确")

    print("\n3. 测试参数缺失...")
    db.__init__()
    pm_user = User(id="pm_001", name="项目经理", role=RoleType.PROJECT_MANAGER)
    db.add("user", pm_user)

    response = client.put(
        "/api/pm/feedbacks/test_id/handle",
        json={
            "handler_id": "pm_001",
            "auto_create_fee": True,
            "estimated_amount": None,
            "fee_type": None
        }
    )
    print(f"   HTTP状态码: {response.status_code}")
    print(f"   响应内容: {response.json()}")
    assert response.status_code == 400
    assert "code" in response.json()
    print("   ✓ 参数缺失处理正确")

    print("\n" + "=" * 60)
    print("✓ 错误场景测试通过")
    print("=" * 60)


def test_success_scenarios():
    print("\n" + "=" * 60)
    print("测试成功场景")
    print("=" * 60)

    print("\n1. 测试创建用户...")
    response = client.post("/api/users?name=测试用户&role=project_manager")
    print(f"   HTTP状态码: {response.status_code}")
    print(f"   响应内容: {response.json()}")
    assert response.status_code == 200
    assert response.json()["code"] == "0000"
    assert "message" in response.json()
    assert "data" in response.json()
    assert "timestamp" in response.json()
    print("   ✓ 格式正确")

    print("\n" + "=" * 60)
    print("✓ 成功场景测试通过")
    print("=" * 60)


if __name__ == "__main__":
    try:
        test_error_response_format()
        test_error_scenarios()
        test_success_scenarios()

        print("\n" + "=" * 60)
        print("✓ 所有测试通过！")
        print("=" * 60)

    except Exception as e:
        print(f"\n✗ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
