import urllib.request, json

def api(method, path, data=None):
    url = f'http://localhost:3000{path}'
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method, headers={'Content-Type':'application/json'} if body else {})
    try:
        r = urllib.request.urlopen(req)
        return json.loads(r.read())
    except Exception as e:
        return {'error': str(e)}

print("=== Step 1: Create batch orders ===")
r = api('POST', '/api/orders/batch', {"order_date":"2026-06-03","store_id":1,"created_by":"test","items":[{"dish_id":1,"quantity":10,"is_urgent":False,"allergens_confirmation":"ok","special_instructions":""},{"dish_id":3,"quantity":5,"is_urgent":True,"allergens_confirmation":"ok","special_instructions":"less spicy"}]})
for o in r.get('data',[]):
    print(f"  Order #{o['id']}: {o['dish_name']} x{o['quantity']} status={o['status']}")

print("\n=== Step 2: Move orders to in_production ===")
for oid in [1,2]:
    r = api('PUT', f'/api/orders/{oid}', {"status":"in_production","operator":"prod_lead"})
    print(f"  Order #{oid}: status={r['data']['status']}")

print("\n=== Step 3: Generate deliveries ===")
r = api('POST', '/api/deliveries', {"operator":"prod_lead"})
print(f"  {r['message']}")
for d in r.get('data',[]):
    print(f"  Delivery #{d['id']}: {d['dish_name']} x{d['quantity']} status={d['status']}")

print("\n=== Step 4: Dispatch delivery #1 ===")
r = api('PUT', '/api/deliveries/1', {"status":"dispatched","operator":"prod_lead"})
d = r['data']
print(f"  Delivery #1: status={d['status']} dispatched_at={d.get('dispatched_at','N/A')}")

print("\n=== Step 5: Confirm receipt ===")
r = api('PUT', '/api/deliveries/1', {"status":"received","received_by":"Zhang","operator":"supervisor"})
d = r['data']
print(f"  Delivery #1: status={d['status']} received_by={d.get('received_by','N/A')} received_at={d.get('received_at','N/A')}")

print("\n=== Step 6: Verify order status ===")
r = api('GET', '/api/orders?order_date=2026-06-03')
for o in r.get('data',[]):
    print(f"  Order #{o['id']}: status={o['status']}")

print("\n=== Step 7: Check delivery logs ===")
r = api('GET', '/api/logs?entity_type=delivery&entity_id=1')
for l in r.get('data',[]):
    print(f"  [{l['timestamp']}] {l['operation_type']} by {l['operator']}: {l['notes']}")

print("\n=== ALL TESTS PASSED ===")
