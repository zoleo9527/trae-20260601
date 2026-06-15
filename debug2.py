#!/usr/bin/env python3
import json, urllib.request, urllib.error

def req(method, path, token=None, body=None):
    data = None
    headers = {"Content-Type": "application/json"}
    if token: headers["Authorization"] = f"Bearer {token}"
    if body is not None: data = json.dumps(body).encode()
    r = urllib.request.Request("http://localhost:3000"+path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(r) as resp: return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e: return json.loads(e.read().decode())

r = req("POST", "/auth/login", body={"username":"reception","password":"123456"})
RT = r["data"]["accessToken"]

# create order
r = req("POST", "/intake", RT, {"customerName":"张","customerPhone":"13800000001","phoneBrand":"Apple","phoneModel":"iPhone 14 Pro","phoneColor":"黑","phoneImei":"351234567890123","faultDescription":"碎屏","accessories":["充电器"]})
print("CREATE:", json.dumps(r, ensure_ascii=False, indent=2))
OID = r["data"]["id"]

# sign
r = req("POST", f"/privacy/order/{OID}/sign", RT, {"customerName":"张","customerIdCard":"110101199001011234","signatureUrl":"https://x.com/s.png","confirmedItems":["data_backup","repair_risk","data_loss","privacy_usage"]})
print("SIGN:", json.dumps(r, ensure_ascii=False, indent=2))
