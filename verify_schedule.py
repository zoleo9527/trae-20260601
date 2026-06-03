import sys, json
d = json.load(sys.stdin)['data']
print(f"deliveryDate: {d['deliveryDate']}")
schedules = [h for h in d.get('handoffs', []) if h['action'] == 'schedule']
print(f"schedule handoffs: {len(schedules)}")
for h in schedules:
    print(f"  reason: {h['reason']}")
    print(f"  prod details: {h['details'].get('production', {})}")
