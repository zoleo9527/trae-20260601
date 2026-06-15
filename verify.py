#!/usr/bin/env python3
import json, urllib.request, urllib.error, sys

BASE = "http://localhost:3000"
PASS = FAIL = 0

def req(method, path, token=None, body=None):
    data = None
    headers = {"Content-Type": "application/json"}
    if token: headers["Authorization"] = f"Bearer {token}"
    if body is not None: data = json.dumps(body).encode()
    r = urllib.request.Request(BASE+path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(r) as resp: return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e: return json.loads(e.read().decode())

def check(name, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  ✅ {name}")
    else:
        FAIL += 1
        print(f"  ❌ {name} {detail}")

RT = req("POST", "/auth/login", body={"username":"reception","password":"123456"})["data"]["accessToken"]
TT = req("POST", "/auth/login", body={"username":"tech01","password":"123456"})["data"]["accessToken"]
MT = req("POST", "/auth/login", body={"username":"manager","password":"123456"})["data"]["accessToken"]

def new_order(name, phone):
    r = req("POST", "/intake", RT, {"customerName":name,"customerPhone":phone,"phoneBrand":"Apple","phoneModel":"iPhone 15","phoneColor":"黑","faultDescription":"碎屏","accessories":[]})
    oid = r["data"]["id"]
    req("POST", f"/privacy/order/{oid}/sign", RT, {"customerName":name,"customerSignature":"s","consentItems":{"allowDataAccess":True,"allowPhotoBackup":True,"allowContactRepair":True,"allowDisclosure":False}})
    req("POST", f"/repair/{oid}/claim", TT)
    return oid

print("="*60)
print("1. 旧申请备件接口→自动创建结构化 PartRequest")
print("="*60)
OID = new_order("旧备件测试", "13800000011")
r = req("PATCH", f"/repair/{OID}/request-parts", TT, {"notes":"需要iPhone 15屏幕"})
check("接口成功 code=0", r["code"]==0, f"code={r['code']}")
if r["code"]==0:
    check("返回 PartRequest(有partName/status)", r["data"].get("partName") and r["data"].get("status"))
    check("partName 含备注内容", "屏幕" in (r["data"].get("partName") or ""))
    check("状态=pending", r["data"]["status"]=="pending")
    PRID = r["data"]["id"]
    ev = req("GET", f"/repair/{OID}/evidence", MT)
    check("证据链含1条备件", len(ev["data"]["partRequests"])==1, f"={len(ev['data']['partRequests'])}")

print("\n" + "="*60)
print("2. 旧备件到货接口→下单+确认到货(结构化)")
print("="*60)
r = req("PATCH", f"/repair/{OID}/parts-arrived", RT)
check("到货成功 code=0", r["code"]==0, f"code={r['code']}")
if r["code"]==0:
    check("备件状态=arrived", r["data"]["status"]=="arrived")
    detail = req("GET", f"/intake/{OID}", RT)
    check("工单自动回 repairing", detail["data"]["status"]=="repairing", f"={detail['data']['status']}")

print("\n" + "="*60)
print("3. 旧质检接口→创建结构化 QualityCheckRecord")
print("="*60)
req("PATCH", f"/repair/{OID}/submit-quality", TT, {"repairNotes":"修完了"})
r = req("PATCH", f"/repair/{OID}/quality-check", RT, {"qualityCheck":{"passed":True,"notes":"通过旧接口质检"}})
check("质检成功 code=0", r["code"]==0, f"code={r['code']} msg={r.get('message')}")
if r["code"]==0:
    check("返回含 checkRound", "checkRound" in r["data"])
    check("checkRound=1", r["data"]["checkRound"]==1)
    check("passed=True", r["data"]["passed"]==True)
    ev = req("GET", f"/repair/{OID}/evidence", MT)
    check("证据链含1条质检", len(ev["data"]["qualityChecks"])==1)
    detail = req("GET", f"/intake/{OID}", RT)
    check("工单状态=ready", detail["data"]["status"]=="ready", f"={detail['data']['status']}")

print("\n" + "="*60)
print("4. 证据接口查不存在工单→返回明确错误码")
print("="*60)
FAKE = "00000000-0000-0000-0000-000000000000"
for p in ["/repair/:id/evidence", "/repair/:id/part-requests", "/repair/:id/quality-checks", "/repair/:id/attachments"]:
    path = p.replace(":id", FAKE)
    r = req("GET", path, MT)
    check(f"{p} 返回错误 code!=0", r["code"]!=0, f"code={r['code']}")
    check(f"{p} 错误码=2001(工单不存在)", r["code"]==2001, f"code={r['code']}")

print("\n" + "="*60)
print("5. 结构化完整流程→证据链完整回看")
print("="*60)
OID3 = new_order("完整流程", "13800000033")
req("PATCH", f"/repair/{OID3}/diagnosis", TT, {"diagnosisResult":"主板短路"})
req("POST", f"/repair/{OID3}/part-request", TT, {"partName":"iPhone 15 主板","partInfo":{"partNo":"MB-15-001"},"quantity":1,"estimatedCost":2000,"reason":"主板短路"})
pr_list = req("GET", f"/repair/{OID3}/part-requests", MT)["data"]
req("PATCH", f"/repair/part-request/{pr_list[0]['id']}/order", RT)
req("PATCH", f"/repair/part-request/{pr_list[0]['id']}/arrive", RT, {"arrivalNotes":"到了"})
req("POST", f"/repair/{OID3}/attachments", TT, {"type":"repair_before","fileName":"b.jpg","mimeType":"image/jpeg","fileSize":1000,"fileUrl":"https://x.com/b.jpg"})
req("POST", f"/repair/{OID3}/attachments", TT, {"type":"repair_after","fileName":"a.jpg","mimeType":"image/jpeg","fileSize":900,"fileUrl":"https://x.com/a.jpg"})
req("PATCH", f"/repair/{OID3}/submit-quality", TT, {"repairNotes":"换板完成"})
req("POST", f"/repair/{OID3}/quality-check", RT, {"checkItems":{"screenWorks":True,"touchWorks":True,"cameraWorks":True,"speakerWorks":True,"micWorks":True,"chargeWorks":True,"buttonWorks":True,"wifiWorks":True,"fingerprintWorks":True,"faceIdWorks":True},"passed":True,"notes":"全过"})

ev = req("GET", f"/repair/{OID3}/evidence", MT)["data"]
check("备件=1", len(ev["partRequests"])==1)
check("质检=1", len(ev["qualityChecks"])==1)
check("附件=2", len(ev["attachments"])==2)
check("备件 arrived", ev["partRequests"][0]["status"]=="arrived")
check("质检 passed", ev["qualityChecks"][0]["passed"]==True)
detail = req("GET", f"/intake/{OID3}", RT)
check("工单详情含 evidence", "evidence" in detail["data"])
check("工单 ready", detail["data"]["status"]=="ready")

print(f"\n结果: {PASS} 通过 / {FAIL} 失败")
sys.exit(1 if FAIL else 0)
