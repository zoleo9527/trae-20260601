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

def msg_contains(r, keyword):
    m = r.get("message", "")
    if isinstance(m, list): return any(keyword in str(item) for item in m)
    return keyword in str(m)

RT = req("POST", "/auth/login", body={"username":"reception","password":"123456"})["data"]["accessToken"]
TT = req("POST", "/auth/login", body={"username":"tech01","password":"123456"})["data"]["accessToken"]
MT = req("POST", "/auth/login", body={"username":"manager","password":"123456"})["data"]["accessToken"]

def new_order_to_qc(name, phone):
    r = req("POST", "/intake", RT, {"customerName":name,"customerPhone":phone,"phoneBrand":"Apple","phoneModel":"iPhone 15","phoneColor":"黑","faultDescription":"碎屏","accessories":[]})
    oid = r["data"]["id"]
    req("POST", f"/privacy/order/{oid}/sign", RT, {"customerName":name,"customerSignature":"s","consentItems":{"allowDataAccess":True,"allowPhotoBackup":True,"allowContactRepair":True,"allowDisclosure":False}})
    req("POST", f"/repair/{oid}/claim", TT)
    req("PATCH", f"/repair/{oid}/diagnosis", TT, {"diagnosisResult":"诊断"})
    req("PATCH", f"/repair/{oid}/submit-quality", TT, {"repairNotes":"修完了"})
    return oid

FULL = {"screenWorks":True,"touchWorks":True,"cameraWorks":True,"speakerWorks":True,"micWorks":True,"chargeWorks":True,"buttonWorks":True,"wifiWorks":True,"fingerprintWorks":True,"faceIdWorks":True}

print("="*60)
print("1. 新接口 POST checkItems:{} → 校验失败")
print("="*60)
OID = new_order_to_qc("空对象", "13800000011")
r = req("POST", f"/repair/{OID}/quality-check", RT, {"checkItems":{},"passed":True,"notes":"test"})
check("code!=0", r["code"]!=0)
check("校验错误信息非空", msg_contains(r, "必须为布尔值"))

print("\n" + "="*60)
print("2. 新接口缺3个字段 → 校验失败，提示缺失字段名")
print("="*60)
OID2 = new_order_to_qc("缺字段", "13800000022")
partial = {k:v for k,v in FULL.items() if k not in ("cameraWorks","wifiWorks","faceIdWorks")}
r = req("POST", f"/repair/{OID2}/quality-check", RT, {"checkItems":partial,"passed":True,"notes":"test"})
check("code!=0", r["code"]!=0)
check("提到cameraWorks", msg_contains(r, "cameraWorks"))
check("提到wifiWorks", msg_contains(r, "wifiWorks"))
check("提到faceIdWorks", msg_contains(r, "faceIdWorks"))

print("\n" + "="*60)
print("3. 新接口字段类型错误 → 校验失败，提示字段名")
print("="*60)
OID3 = new_order_to_qc("类型错误", "13800000033")
bad = dict(FULL); bad["screenWorks"] = "yes"
r = req("POST", f"/repair/{OID3}/quality-check", RT, {"checkItems":bad,"passed":True,"notes":"test"})
check("code!=0", r["code"]!=0)
check("提到screenWorks", msg_contains(r, "screenWorks"))

print("\n" + "="*60)
print("4. 新接口不传 checkItems → 校验失败")
print("="*60)
OID4 = new_order_to_qc("不传", "13800000044")
r = req("POST", f"/repair/{OID4}/quality-check", RT, {"passed":True,"notes":"test"})
check("code!=0", r["code"]!=0)

print("\n" + "="*60)
print("5. 新接口完整10项 → 成功真实写入")
print("="*60)
OID5 = new_order_to_qc("完整", "13800000055")
r = req("POST", f"/repair/{OID5}/quality-check", RT, {
    "checkItems":{"screenWorks":True,"touchWorks":True,"cameraWorks":False,"speakerWorks":True,"micWorks":True,"chargeWorks":True,"buttonWorks":True,"wifiWorks":True,"fingerprintWorks":True,"faceIdWorks":True},
    "passed":False,"notes":"摄像头异常","failedItems":"cameraWorks不合格"
})
check("code=0", r["code"]==0)
if r["code"]==0:
    ci = r["data"].get("checkItems", {})
    check("cameraWorks=False(真实)", ci.get("cameraWorks")==False)
    check("screenWorks=True(真实)", ci.get("screenWorks")==True)
    check("failedItems写入", r["data"].get("failedItems")=="cameraWorks不合格")

print("\n" + "="*60)
print("6. 旧接口 PATCH 不传 checkItems → 校验失败")
print("="*60)
OID6 = new_order_to_qc("旧不传", "13800000066")
r = req("PATCH", f"/repair/{OID6}/quality-check", RT, {"qualityCheck":{"passed":True,"notes":"test"}})
check("code!=0", r["code"]!=0)

print("\n" + "="*60)
print("7. 旧接口 PATCH checkItems:{} → 校验失败")
print("="*60)
OID7 = new_order_to_qc("旧空对象", "13800000077")
r = req("PATCH", f"/repair/{OID7}/quality-check", RT, {"qualityCheck":{"passed":True,"notes":"test"},"checkItems":{}})
check("code!=0", r["code"]!=0)

print("\n" + "="*60)
print("8. 旧接口 PATCH 缺1个字段 → 校验失败，提示字段名")
print("="*60)
OID8 = new_order_to_qc("旧缺字段", "13800000088")
partial2 = {k:v for k,v in FULL.items() if k != "micWorks"}
r = req("PATCH", f"/repair/{OID8}/quality-check", RT, {"qualityCheck":{"passed":True,"notes":"test"},"checkItems":partial2})
check("code!=0", r["code"]!=0)
check("提到micWorks", msg_contains(r, "micWorks"))

print("\n" + "="*60)
print("9. 旧接口 PATCH 完整10项(有失败) → 真实写入")
print("="*60)
OID9 = new_order_to_qc("旧完整", "13800000099")
r = req("PATCH", f"/repair/{OID9}/quality-check", RT, {
    "qualityCheck":{"passed":False,"notes":"触摸和WiFi异常"},
    "checkItems":{"screenWorks":True,"touchWorks":False,"cameraWorks":True,"speakerWorks":True,"micWorks":True,"chargeWorks":True,"buttonWorks":True,"wifiWorks":False,"fingerprintWorks":True,"faceIdWorks":True},
    "failedItems":"touchWorks,wifiWorks"
})
check("code=0", r["code"]==0)
if r["code"]==0:
    ci = r["data"].get("checkItems", {})
    check("touchWorks=False(真实)", ci.get("touchWorks")==False)
    check("wifiWorks=False(真实)", ci.get("wifiWorks")==False)
    check("screenWorks=True(真实)", ci.get("screenWorks")==True)
    ev = req("GET", f"/repair/{OID9}/evidence", MT)
    ci2 = ev["data"]["qualityChecks"][0].get("checkItems", {})
    check("证据链 touchWorks=False", ci2.get("touchWorks")==False)
    check("证据链 wifiWorks=False", ci2.get("wifiWorks")==False)
    detail = req("GET", f"/intake/{OID9}", RT)
    check("工单退回 repairing", detail["data"]["status"]=="repairing")

print("\n" + "="*60)
print("10. 旧接口 PATCH 类型错误 → 校验失败")
print("="*60)
OID10 = new_order_to_qc("旧类型错误", "13800000100")
bad2 = dict(FULL); bad2["touchWorks"] = 1
r = req("PATCH", f"/repair/{OID10}/quality-check", RT, {"qualityCheck":{"passed":True,"notes":"test"},"checkItems":bad2})
check("code!=0", r["code"]!=0)
check("提到touchWorks", msg_contains(r, "touchWorks"))

print(f"\n结果: {PASS} 通过 / {FAIL} 失败")
sys.exit(1 if FAIL else 0)
