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

RT = req("POST", "/auth/login", body={"username":"reception","password":"123456"})["data"]["accessToken"]
TT = req("POST", "/auth/login", body={"username":"tech01","password":"123456"})["data"]["accessToken"]

r = req("POST", "/intake", RT, {"customerName":"X","customerPhone":"13800000001","phoneBrand":"A","phoneModel":"X","phoneColor":"黑","faultDescription":"y","accessories":[]})
OID = r["data"]["id"]

# sign
req("POST", f"/privacy/order/{OID}/sign", RT, {"customerName":"X","customerSignature":"s","consentItems":{"allowDataAccess":True,"allowPhotoBackup":True,"allowContactRepair":True,"allowDisclosure":False}})
# claim
req("POST", f"/repair/{OID}/claim", TT)

# part request
r = req("POST", f"/repair/{OID}/part-request", TT, {"partName":"屏幕","partInfo":"SKU","quantity":1,"estimatedCost":1580,"reason":"碎"})
print(json.dumps(r, ensure_ascii=False, indent=2))
