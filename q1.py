import json
d=json.load(open('/Users/liu/Documents/private/model-test/trae-20260601-2/alln.json'))
lst=d.get('data',[])
print('通知总数:', len(lst))
for n in lst:
    print('  user=' + n['user_id'][:8] + ' [' + n['type'] + '] ' + n['title'][:25] + ' read=' + str(n['read']))
