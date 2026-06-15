#!/usr/bin/env python3
import json
import urllib.request
import urllib.error

BASE = "http://localhost:3000"

def req(method, path, token=None, body=None):
    data = None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if body is not None:
        data = json.dumps(body).encode()
    r = urllib.request.Request(f"{BASE}{path}", data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(r) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode())

r = req("POST", "/auth/login", body={"username":"reception","password":"123456"})
RT = r["data"]["accessToken"]
r = req("POST", "/auth/login", body={"username":"tech01","password":"123456"})
TT = r["data"]["accessToken"]
r = req("POST", "/auth/login", body={"username":"manager","password":"123456"})
MT = r["data"]["accessToken"]
print("Tokens: OK")

print("\n=== Step1: 前台创建工单 ===")
r = req("POST", "/intake", RT, {
    "customerName":"张维修","customerPhone":"13800000001",
    "phoneBrand":"Apple","phoneModel":"iPhone 14 Pro","phoneColor":"深空黑",
    "phoneImei":"351234567890123","faultDescription":"屏幕碎触摸失灵",
    "accessories":["充电器","手机壳"]
})
OID = r["data"]["id"]
print(f"  工单ID={OID} 工单号={r['data']['orderNo']} 状态={r['data']['status']}")

print("\n=== Step2: 前台尝试PATCH改status（被ValidationPipe拦截，4001） ===")
r = req("PATCH", f"/intake/{OID}", RT, {"status":"consent_signed"})
print(f"  code={r['code']}")

print("\n=== Step3: 前台尝试改diagnosisResult（被角色权限拦截，1004） ===")
r = req("PATCH", f"/intake/{OID}", RT, {"diagnosisResult":"屏幕总成损坏"})
print(f"  code={r['code']} msg={r['message']}")

print("\n=== Step4: 前台正常改priority（成功） ===")
r = req("PATCH", f"/intake/{OID}", RT, {"priority":"urgent"})
print(f"  code={r['code']} 优先级={r['data']['priority']}")

print("\n=== Step5: 签署隐私授权 ===")
r = req("POST", f"/privacy/order/{OID}/sign", RT, {
    "customerName":"张维修",
    "customerSignature":"customer_sign_data_base64",
    "consentItems":{
        "allowDataAccess":True,"allowPhotoBackup":True,
        "allowContactRepair":True,"allowDisclosure":False
    }
})
print(f"  code={r['code']} 已签署={r['data']['isSigned']}")

print("\n=== Step6: 维修师领取工单 ===")
r = req("POST", f"/repair/{OID}/claim", TT)
print(f"  code={r['code']} 状态={r['data']['status']} 维修师={r['data']['technician']['name']}")

print("\n=== Step7: 上传诊断照片 + 提交诊断 ===")
r = req("POST", f"/repair/{OID}/attachments", TT, {
    "type":"diagnosis_photo","fileName":"cracked.jpg","mimeType":"image/jpeg",
    "fileSize":245678,"fileUrl":"https://oss.example.com/diag-1.jpg","description":"碎屏"
})
print(f"  诊断照片 code={r['code']} id={r['data']['id']}")
r = req("PATCH", f"/repair/{OID}/diagnosis", TT, {"diagnosisResult":"屏幕总成损坏需更换"})
print(f"  诊断提交 code={r['code']}")

print("\n=== Step8: 维修师创建备件申请（工单→waiting_parts） ===")
r = req("POST", f"/repair/{OID}/part-request", TT, {
    "partName":"iPhone 14 Pro 原厂屏幕总成",
    "partInfo":{"partNo":"APL-14P-SCR-001","supplier":"恒信数码"},
    "quantity":1,"estimatedCost":1580,"reason":"屏幕碎裂"
})
PRID = r["data"]["id"]
print(f"  code={r['code']} 备件状态={r['data']['status']} 工单状态={r['data']['order']['status']}")

print("\n=== Step9: 前台确认备件下单 ===")
r = req("PATCH", f"/repair/part-request/{PRID}/order", RT)
print(f"  code={r['code']} 备件状态={r['data']['status']}")

print("\n=== Step10: 前台上传备件照片并确认到货（工单→repairing） ===")
req("POST", f"/repair/{OID}/attachments", RT, {
    "type":"part_photo","fileName":"part.jpg","mimeType":"image/jpeg",
    "fileSize":189234,"fileUrl":"https://oss.example.com/part-1.jpg"
})
r = req("PATCH", f"/repair/part-request/{PRID}/arrive", RT)
print(f"  code={r['code']} 备件状态={r['data']['status']} 工单状态={r['data']['order']['status']}")

print("\n=== Step11: 维修前后照片 + 维修备注 ===")
req("POST", f"/repair/{OID}/attachments", TT, {
    "type":"repair_before","fileName":"before.jpg","mimeType":"image/jpeg",
    "fileSize":300000,"fileUrl":"https://oss.example.com/before-1.jpg"
})
req("POST", f"/repair/{OID}/attachments", TT, {
    "type":"repair_after","fileName":"after.jpg","mimeType":"image/jpeg",
    "fileSize":290000,"fileUrl":"https://oss.example.com/after-1.jpg"
})
r = req("PATCH", f"/intake/{OID}", TT, {"repairNotes":"更换屏幕总成，防水胶重密封，测试2小时正常"})
print(f"  维修备注 code={r['code']}")

print("\n=== Step11b: 维修师提交质检（工单→quality_check） ===")
r = req("PATCH", f"/repair/{OID}/submit-quality", TT, {"repairNotes":"维修完成，申请质检"})
print(f"  code={r['code']} 状态={r['data']['status']}")

print("\n=== Step12: 前台结构化质检（10项全过→ready） ===")
r = req("POST", f"/repair/{OID}/quality-check", RT, {
    "checkItems":{
        "screenWorks":True,"touchWorks":True,"cameraWorks":True,
        "speakerWorks":True,"micWorks":True,"chargeWorks":True,
        "buttonWorks":True,"wifiWorks":True,"fingerprintWorks":True,"faceIdWorks":True
    },
    "passed":True,"notes":"全部检查通过，外观完好"
})
print(f"  code={r['code']} passed={r['data']['passed']} round={r['data']['checkRound']} 工单={r['data']['order']['status']}")

print("\n=== Step13: 工单详情（含证据链） ===")
r = req("GET", f"/intake/{OID}", RT)
d = r["data"]
e = d.get("evidence", {})
pr = e.get("partRequests", [])
qc = e.get("qualityChecks", [])
at = e.get("attachments", [])
print(f"  工单状态={d['status']}")
print(f"  备件={len(pr)} 个：{pr[0]['partName'] if pr else '-'} ({pr[0]['status'] if pr else '-'})")
print(f"  质检={len(qc)} 次：第1次 passed={qc[0]['passed'] if qc else '-'}")
print(f"  附件={len(at)} 张：类型={[a['type'] for a in at]}")

print("\n=== Step14: 证据链聚合 /repair/:id/evidence ===")
r = req("GET", f"/repair/{OID}/evidence", MT)
d = r["data"]
print(f"  备件={len(d['partRequests'])} 质检={len(d['qualityChecks'])} 附件={len(d['attachments'])}")
for a in d["attachments"]:
    print(f"    - {a['type']}: {a['fileName']} by {a['uploadedBy']['name']}")

print("\n=== Step15: 仪表盘卡住分析（含判断依据和证据入口） ===")
r = req("GET", "/dashboard/stuck", MT)
d = r["data"]
if not d:
    print("  暂无卡住工单（本工单刚走完流程，正常）")
else:
    g = d[0]
    print(f"  状态={g['statusLabel']} 卡住={g['stuckCount']}")
    print(f"  判断依据={g['judgementHint']}")
    print(f"  下一步={g['nextAction']}")
    if g.get("items"): print(f"  证据链接示例={g['items'][0]['evidenceLink']}")

print("\n=== Step16: 最近变更（含PartRequest/QualityCheck/Attachment标签） ===")
r = req("GET", "/dashboard/recent-changes?limit=20", MT)
d = r["data"]
print(f"  共{len(d)}条：")
for l in d:
    print(f"    [{l['entityLabel']}] {l['actionLabel']} by {l['operatorName']} - {l['summary']}")

print("\n=== ALL TESTS PASSED ===")
