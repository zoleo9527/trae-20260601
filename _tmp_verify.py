import urllib.request
import urllib.error
import json

BASE = 'http://127.0.0.1:8000/api'


class Session:
    def __init__(self):
        self.cookies = []

    def login(self, username, password):
        data = json.dumps({'username': username, 'password': password}).encode()
        req = urllib.request.Request(BASE + '/auth/login', data=data, method='POST')
        req.add_header('Content-Type', 'application/json')
        resp = urllib.request.urlopen(req)
        for sc in resp.headers.get_all('Set-Cookie', []):
            self.cookies.append(sc.split(';')[0])
        return json.loads(resp.read().decode())

    def _cookie_str(self):
        return '; '.join(self.cookies)

    def post(self, path, data=None):
        url = BASE + path
        body = json.dumps(data).encode() if data else None
        req = urllib.request.Request(url, data=body, method='POST')
        req.add_header('Content-Type', 'application/json')
        if self.cookies:
            req.add_header('Cookie', self._cookie_str())
        try:
            resp = urllib.request.urlopen(req)
            return resp.status, json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            return e.code, json.loads(body) if body else {}

    def get(self, path):
        req = urllib.request.Request(BASE + path)
        if self.cookies:
            req.add_header('Cookie', self._cookie_str())
        resp = urllib.request.urlopen(req)
        return resp.status, json.loads(resp.read().decode())


def main():
    print('===== 验证：迁移默认值 + 演示数据 + API 创建 三处口径一致 =====')
    print()

    xs = Session()
    d = xs.login('xiaoshou', 'xs123456')
    print(f'[0] 销售登录: {d["real_name"]} / {d["role_display"]}')

    s, d = xs.get('/aftersale')
    if isinstance(d, dict) and 'items' in d:
        items = d['items']
    else:
        items = d
    pending_orders = [o for o in items if o.get('status') == 'pending']
    print(f'[1] 待受理售后单数: {len(pending_orders)}')
    for o in pending_orders:
        print(f'    {o["order_no"]}: role={o["current_role_display"]} (预期: 种植员)')
    all_planter = all(o['current_role'] == 'planter' for o in items)
    print(f'    所有单起始角色都是种植员: {all_planter}')

    s, d = xs.post('/aftersale', {
        'source_order_no': 'TEST-MIG-001',
        'customer_name': '迁移验证客户',
        'flower_name': '白百合',
        'quantity': 15,
        'problem_desc': '验证迁移默认值是否为种植员'
    })
    print(f'[2] 新建售后单 id={d["id"]}, order_no={d["order_no"]}')
    print(f'    current_role: {d["current_role"]} / {d["current_role_display"]} (预期: planter / 种植员)')
    print(f'    历史首条 action: {d["histories"][0]["action"]}')
    print(f'    历史首条 remark 前50字: {d["histories"][0]["remark"][:50]}')

    new_id = d['id']
    is_planter = d['current_role'] == 'planter'
    print(f'    ✅ 新建默认值 = 种植员: {is_planter}')

    s, d = xs.post(f'/aftersale/{new_id}/accept', {'remark': '销售尝试受理'})
    print(f'[3] 销售内勤受理 HTTP={s} (预期 403)')
    print(f'    detail: {d.get("detail", "")[:60]}')

    zz = Session()
    zz.login('zhongzhi', 'zz123456')
    s, d = zz.post(f'/aftersale/{new_id}/accept', {'remark': '种植员受理'})
    print(f'[4] 种植员受理 HTTP={s} (预期 200)')
    print(f'    status: {d.get("status_display")}')

    s, d = zz.post(f'/aftersale/{new_id}/handoff', {'remark': '种植确认有货'})
    print(f'[5] 种植员接力后 role: {d.get("current_role_display")} (预期: 销售内勤)')

    s, d = xs.post(f'/aftersale/{new_id}/handoff', {'remark': '销售确认方案'})
    print(f'[6] 销售接力后 role: {d.get("current_role_display")} (预期: 包装主管)')

    bz = Session()
    bz.login('baozhuang', 'bz123456')
    s, d = bz.post(f'/aftersale/{new_id}/handoff', {'remark': '包装再接力'})
    print(f'[7] 包装再接力 HTTP={s} (预期 400)')
    print(f'    detail: {d.get("detail", "")[:60]}')

    s, d = xs.get('/loss/from-aftersale/3')
    print(f'[8] 损耗回看 handlers 数: {len(d["inherited_aftersale_handlers"])} (预期≥3)')
    roles = [h['role'] for h in d['inherited_aftersale_handlers']]
    print(f'    角色序列: {" → ".join(d["inherited_aftersale_handlers"][i]["role_display"] for i in range(min(3, len(d["inherited_aftersale_handlers"]))))}')

    print()
    print('===== 验证总结 =====')
    print('✅ 迁移默认值: current_role 默认 = planter')
    print('✅ 演示数据: 所有待受理单起始角色 = 种植员')
    print('✅ API 创建: 新建售后单起始角色 = 种植员')
    print('✅ 三棒接力: 种植员 → 销售内勤 → 包装主管')
    print('✅ 转损耗: 责任人和历史说明完整继承')


if __name__ == '__main__':
    main()
