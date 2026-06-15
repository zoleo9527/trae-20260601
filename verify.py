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
        PASS += 1; print(f"  ✅ {name}")
    else:
        FAIL += 1; print(f"  ❌ {name} {detail}")

RT = req("POST", "/auth/login", body={"username":"reception","password":"123456"})["data"]["accessToken"]
TT = req("POST", "/auth/login", body={"username":"tech01","password":"123456"})["data"]["accessToken"]
MT = req("POST", "/auth/login", body={"username":"manager","password":"123456"})["data"]["accessToken"]

def new_order(name, phone):
    r = req("POST", "/intake", RT, {"customerName":name,"customerPhone":phone,"phoneBrand":"Apple","phoneModel":"iPhone 15","phoneColor":"黑","faultDescription":"碎屏","accessories":[]})
    oid = r["data"]["id"]
    req("POST", f"/privacy/order/{oid}/sign", RT, {"customerName":name,"customerSignature":"s","consentItems":{"allowDataAccess":True,"allowPhotoBackup":True,"allowContactRepair":True,"allowDisclosure":False}})
    req("POST", f"/repair/{oid}/claim", TT)
    return oid

# ── 场景1: 旧接口不传 checkItems → 拒绝 ──
print("="*60)
print("1. 旧质检接口不传 checkItems → 拒绝(4001)")
print("="*60)
OID = new_order("无checkItems", "13800000001")
req("PATCH", f"/repair/{OID}/diagnosis", TT, {"diagnosisResult":"诊断结果"})
req("POST", f"/repair/{OID}/part-request", TT, {"partName":"屏幕","quantity":1,"estimatedCost":100,"reason":"碎"})
pr_list = req("GET", f"/repair/{OID}/part-requests", MT)["data"]
req("PATCH", f"/repair/part-request/{pr_list[0]['id']}/order", RT)
req("PATCH", f"/repair/part-request/{pr_list[0]['id']}/arrive", RT, {"arrivalNotes":"到"})
req("PATCH", f"/repair/{OID}/submit-quality", TT, {"repairNotes":"修完了"})

r = req("PATCH", f"/repair/{OID}/quality-check", RT, {"qualityCheck":{"passed":True,"notes":"全过"}})
check("不传checkItems被拒绝 code!=0", r["code"]!=0, f"code={r['code']}")
check("错误码=4001", r["code"]==4001, f"code={r['code']}")
check("提示引导新接口", "POST /repair/:orderId/quality-check" in r.get("message",""), f"msg={r.get('message')}")

detail = req("GET", f"/intake/{OID}", RT)
check("工单仍停在 quality_check", detail["data"]["status"]=="quality_check", f"status={detail['data']['status']}")

# ── 场景2: 旧接口传 checkItems（全通过）→ 真实写入 ──
print("\n" + "="*60)
print("2. 旧质检接口传 checkItems（全通过）→ 真实写入")
print("="*60)
r = req("PATCH", f"/repair/{OID}/quality-check", RT, {
    "qualityCheck":{"passed":True,"notes":"全通过"},
    "checkItems":{"screenWorks":True,"touchWorks":True,"cameraWorks":True,"speakerWorks":True,"micWorks":True,"chargeWorks":True,"buttonWorks":True,"wifiWorks":True,"fingerprintWorks":True,"faceIdWorks":True}
})
check("成功 code=0", r["code"]==0, f"code={r['code']}")
if r["code"]==0:
    ci = r["data"].get("checkItems", {})
    check("checkRound=1", r["data"]["checkRound"]==1)
    check("passed=True", r["data"]["passed"]==True)
    check("screenWorks=True(真实)", ci.get("screenWorks")==True, f"ci={ci}")
    check("touchWorks=True(真实)", ci.get("touchWorks")==True)
    check("cameraWorks=True(真实)", ci.get("cameraWorks")==True)

    ev = req("GET", f"/repair/{OID}/evidence", MT)
    qc = ev["data"]["qualityChecks"][0]
    ci2 = qc.get("checkItems", {})
    check("证据链 screenWorks=True", ci2.get("screenWorks")==True, f"ci2={ci2}")
    check("证据链 touchWorks=True", ci2.get("touchWorks")==True)

    detail = req("GET", f"/intake/{OID}", RT)
    check("工单→ready", detail["data"]["status"]=="ready")

# ── 场景3: 旧接口传 checkItems（有失败项）→ 真实写入 ──
print("\n" + "="*60)
print("3. 旧质检接口传 checkItems（有失败项）→ 真实写入")
print("="*60)
OID2 = new_order("质检不通过", "13800000002")
req("PATCH", f"/repair/{OID2}/diagnosis", TT, {"diagnosisResult":"诊断"})
req("POST", f"/repair/{OID2}/part-request", TT, {"partName":"电池","quantity":1,"estimatedCost":100,"reason":"老化"})
pr_list2 = req("GET", f"/repair/{OID2}/part-requests", MT)["data"]
req("PATCH", f"/repair/part-request/{pr_list2[0]['id']}/order", RT)
req("PATCH", f"/repair/part-request/{pr_list2[0]['id']}/arrive", RT, {"arrivalNotes":"到"})
req("PATCH", f"/repair/{OID2}/submit-quality", TT, {"repairNotes":"换完电池"})

r = req("PATCH", f"/repair/{OID2}/quality-check", RT, {
    "qualityCheck":{"passed":False,"notes":"WiFi和触摸异常"},
    "checkItems":{"screenWorks":True,"touchWorks":False,"cameraWorks":True,"speakerWorks":True,"micWorks":True,"chargeWorks":True,"buttonWorks":True,"wifiWorks":False,"fingerprintWorks":True,"faceIdWorks":True},
    "failedItems":"触摸失灵,WiFi无法连接"
})
check("质检不通过 code=0", r["code"]==0, f"code={r['code']}")
if r["code"]==0:
    ci = r["data"].get("checkItems", {})
    check("passed=False", r["data"]["passed"]==False)
    check("touchWorks=False(真实)", ci.get("touchWorks")==False, f"ci={ci}")
    check("wifiWorks=False(真实)", ci.get("wifiWorks")==False)
    check("screenWorks=True(真实)", ci.get("screenWorks")==True)
    check("failedItems已写入", r["data"].get("failedItems")=="触摸失灵,WiFi无法连接")

    ev = req("GET", f"/repair/{OID2}/evidence", MT)
    qc = ev["data"]["qualityChecks"][0]
    ci2 = qc.get("checkItems", {})
    check("证据链 touchWorks=False", ci2.get("touchWorks")==False)
    check("证据链 wifiWorks=False", ci2.get("wifiWorks")==False)

    detail = req("GET", f"/intake/{OID2}", RT)
    check("工单退回 repairing", detail["data"]["status"]=="repairing")

# ── 场景4: 第二轮质检 ──
print("\n" + "="*60)
print("4. 第二轮质检→checkRound=2")
print("="*60)
req("PATCH", f"/repair/{OID2}/submit-quality", TT, {"repairNotes":"修复WiFi和触摸"})
r = req("PATCH", f"/repair/{OID2}/quality-check", RT, {
    "qualityCheck":{"passed":True,"notes":"二次全通过"},
    "checkItems":{"screenWorks":True,"touchWorks":True,"cameraWorks":True,"speakerWorks":True,"micWorks":True,"chargeWorks":True,"buttonWorks":True,"wifiWorks":True,"fingerprintWorks":True,"faceIdWorks":True}
})
check("第二轮成功", r["code"]==0)
if r["code"]==0:
    check("checkRound=2", r["data"]["checkRound"]==2)
    ev = req("GET", f"/repair/{OID2}/evidence", MT)
    check("证据链共2条质检", len(ev["data"]["qualityChecks"])==2)

# ── 场景5: 新接口仍正常 ──
print("\n" + "="*60)
print("5. 新结构化接口 POST /repair/:orderId/quality-check")
print("="*60)
OID3 = new_order("新接口", "13800000003")
req("PATCH", f"/repair/{OID3}/diagnosis", TT, {"diagnosisResult":"修"})
req("PATCH", f"/repair/{OID3}/submit-quality", TT, {"repairNotes":"完"})
r = req("POST", f"/repair/{OID3}/quality-check", RT, {
    "checkItems":{"screenWorks":True,"touchWorks":True,"cameraWorks":False,"speakerWorks":True,"micWorks":True,"chargeWorks":True,"buttonWorks":True,"wifiWorks":True,"fingerprintWorks":True,"faceIdWorks":True},
    "passed":False,"notes":"摄像头异常","failedItems":"摄像头拍照黑屏"
})
check("新接口不通过 code=0", r["code"]==0)
if r["code"]==0:
    ci = r["data"].get("checkItems", {})
    check("cameraWorks=False(真实)", ci.get("cameraWorks")==False, f"ci={ci}")
    check("failedItems=摄像头拍照黑屏", r["data"].get("failedItems")=="摄像头拍照黑屏")
    detail = req("GET", f"/intake/{OID3}", RT)
    check("工单退回 repairing", detail["data"]["status"]=="repairing")

print(f"\n结果: {PASS} 通过 / {FAIL} 失败")
sys.exit(1 if FAIL else 0)
