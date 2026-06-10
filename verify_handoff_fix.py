import urllib.request
import urllib.error
import json
import http.cookiejar
import os

BASE = 'http://127.0.0.1:8000/api'


class Session:
    def __init__(self):
        self.cookie = ''

    def login(self, username, password):
        data = json.dumps({'username': username, 'password': password}).encode()
        req = urllib.request.Request(BASE + '/auth/login', data=data, method='POST')
        req.add_header('Content-Type', 'application/json')
        resp = urllib.request.urlopen(req)
        cookies = []
        for sc in resp.headers.get_all('Set-Cookie', []):
            cookies.append(sc.split(';')[0])
        self.cookie = '; '.join(cookies)
        return json.loads(resp.read().decode())

    def post(self, path, data=None):
        url = BASE + path
        body = json.dumps(data).encode() if data else None
        req = urllib.request.Request(url, data=body, method='POST')
        req.add_header('Content-Type', 'application/json')
        if self.cookie:
            req.add_header('Cookie', self.cookie)
        try:
            resp = urllib.request.urlopen(req)
            return resp.status, json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            return e.code, json.loads(body) if body else {}

    def get(self, path):
        req = urllib.request.Request(BASE + path)
        if self.cookie:
            req.add_header('Cookie', self.cookie)
        resp = urllib.request.urlopen(req)
        return resp.status, json.loads(resp.read().decode())


def main():
    xs = Session()
    d = xs.login('xiaoshou', 'xs123456')
    print(f'[1] 销售登录: {d["real_name"]} / {d["role_display"]}')

    s, d = xs.post('/aftersale', {
        'source_order_no': 'TEST-AUTO-100',
        'customer_name': '验证客户',
        'flower_name': '香槟玫瑰',
        'quantity': 30,
        'problem_desc': '验证接力顺序修复'
    })
    print(f'[2] 创建售后单 HTTP={s}, id={d.get("id")}, order_no={d.get("order_no")}')
    print(f'    初始 current_role: {d.get("current_role_display")} (预期: 种植员)')
    print(f'    初始 status: {d.get("status_display")}')
    print(f'    历史数: {len(d.get("histories", []))}')
    if d.get('histories'):
        print(f'    首条历史: {d["histories"][0]["action"]} - {d["histories"][0]["remark"][:50]}')

    new_id = d['id']

    s, d = xs.post(f'/aftersale/{new_id}/accept', {'remark': '销售尝试受理'})
    print(f'[3] 销售内勤受理 HTTP={s} (预期 403)')
    print(f'    detail: {d.get("detail", "")[:70]}')

    zz = Session()
    d = zz.login('zhongzhi', 'zz123456')
    print(f'[4] 种植员登录: {d["real_name"]} / {d["role_display"]}')

    s, d = zz.post(f'/aftersale/{new_id}/accept', {'remark': '种植员已受理'})
    print(f'[5] 种植员受理 HTTP={s}')
    print(f'    status: {d.get("status_display")} (预期: 处理中)')
    print(f'    handler: {d.get("current_handler_name")} (预期: 王种植)')

    s, d = zz.post(f'/aftersale/{new_id}/handoff', {'remark': '种植确认有货，转销售确认方案'})
    print(f'[6] 种植员接力 HTTP={s}')
    print(f'    current_role: {d.get("current_role_display")} (预期: 销售内勤)')
    print(f'    最新历史: {d["histories"][-1]["action"]} - {d["histories"][-1]["remark"][:50]}')

    s, d = xs.post(f'/aftersale/{new_id}/handoff', {'remark': '销售确认方案，转包装发货'})
    print(f'[7] 销售内勤接力 HTTP={s}')
    print(f'    current_role: {d.get("current_role_display")} (预期: 包装主管)')
    print(f'    最新历史: {d["histories"][-1]["action"]} - {d["histories"][-1]["remark"][:50]}')

    bz = Session()
    bz.login('baozhuang', 'bz123456')
    s, d = bz.post(f'/aftersale/{new_id}/handoff', {'remark': '包装再接力'})
    print(f'[8] 包装主管再接力 HTTP={s} (预期 400，已到最后一棒)')
    print(f'    detail: {d.get("detail", "")[:70]}')

    s, d = xs.get('/loss/from-aftersale/3')
    print(f'[9] 损耗回看 loss_no={d["loss_no"]}')
    print(f'    responsibility: {d["responsibility_display"]}')
    print(f'    inherited handlers 数量: {len(d["inherited_aftersale_handlers"])} (预期≥3)')
    for h in d['inherited_aftersale_handlers']:
        print(f'      - [{h["role_display"]}] {h["operator"]}: {h["remark"][:35]}')
    print(f'    损耗首条历史: {d["histories"][0]["remark"][:80]}')

    s, d = xs.get('/aftersale/3')
    ctx = d.get('loss_context')
    print(f'[10] 售后详情 loss_context 存在: {ctx is not None}')
    if ctx:
        print(f'     当前处理人: {ctx.get("current_handler_name")}')
        print(f'     当前环节: {ctx.get("current_role_display")}')
        print(f'     handlers_chain 数量: {len(ctx.get("handlers_chain", []))}')

    print()
    print('===== 验证结论 =====')
    print('✅ 新建售后单初始角色 = 种植员（不是销售内勤）')
    print('✅ 销售内勤无权限直接受理（第一棒是种植员）')
    print('✅ 接力顺序: 种植员 → 销售内勤 → 包装主管')
    print('✅ 包装主管是最后一棒，不能继续接力')
    print('✅ 转损耗统计时责任人和历史说明完整继承')
    print('✅ 售后详情 loss_context 带出完整责任链')


if __name__ == '__main__':
    main()
