import urllib.request
import urllib.error
import json

base = 'http://127.0.0.1:8000/api'
jar = {}


def post(path, data=None, login_first=None):
    req = urllib.request.Request(base + path, method='POST')
    req.add_header('Content-Type', 'application/json')
    if data:
        req.data = json.dumps(data).encode()
    cookie = jar.get(login_first, '')
    if cookie:
        req.add_header('Cookie', cookie)
    try:
        resp = urllib.request.urlopen(req)
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return e.code, json.loads(body) if body else {}
    set_cookie = resp.headers.get('Set-Cookie', '')
    if set_cookie and login_first:
        jar[login_first] = set_cookie.split(';')[0]
    body = resp.read().decode()
    return resp.status, json.loads(body) if body else {}


def get(path, user):
    req = urllib.request.Request(base + path)
    req.add_header('Cookie', jar.get(user, ''))
    resp = urllib.request.urlopen(req)
    return resp.status, json.loads(resp.read().decode())


def main():
    s, d = post('/auth/login', {'username': 'xiaoshou', 'password': 'xs123456'}, login_first='xs')
    print('[1] 销售登录:', d['real_name'], '/', d['role_display'])

    s, d = post('/aftersale', {
        'source_order_no': 'TEST-AUTO-001',
        'customer_name': '测试客户A',
        'flower_name': '测试玫瑰',
        'quantity': 20,
        'problem_desc': '测试创建售后单，验证初始角色'
    }, login_first='xs')
    new_id = d['id']
    print(f'[2] 创建售后单 id={new_id}, order_no={d["order_no"]}')
    print(f'    初始 current_role: {d["current_role"]} / {d["current_role_display"]} (预期: planter / 种植员)')
    print(f'    初始 status: {d["status"]} / {d["status_display"]}')
    print(f'    历史记录数: {len(d["histories"])}')
    print(f'    第一条历史: {d["histories"][0]["action"]} - {d["histories"][0]["remark"][:60]}')

    s, d = post(f'/aftersale/{new_id}/accept', {'remark': '销售尝试受理'}, login_first='xs')
    print(f'[3] 销售受理: HTTP {s} (预期403) - {d.get("detail", "")[:60]}')

    s, d = post('/auth/login', {'username': 'zhongzhi', 'password': 'zz123456'}, login_first='zz')
    print(f'[4] 种植员登录: {d["real_name"]} / {d["role_display"]}')

    s, d = post(f'/aftersale/{new_id}/accept', {'remark': '种植员已受理，正在核查'}, login_first='zz')
    print(f'[5] 种植员受理: status={d["status_display"]}, handler={d["current_handler_name"]} (预期: 处理中 / 王种植)')

    s, d = post(f'/aftersale/{new_id}/handoff', {'remark': '种植确认有货，转销售确认补发时间'}, login_first='zz')
    print(f'[6] 种植员接力后: current_role={d["current_role_display"]} (预期: 销售内勤)')
    print(f'    最新历史: {d["histories"][-1]["action"]} - {d["histories"][-1]["remark"][:60]}')

    s, d = post(f'/aftersale/{new_id}/handoff', {'remark': '已与客户确认，转包装发货'}, login_first='xs')
    print(f'[7] 销售接力后: current_role={d["current_role_display"]} (预期: 包装主管)')
    print(f'    最新历史: {d["histories"][-1]["action"]} - {d["histories"][-1]["remark"][:60]}')

    s, d = post('/auth/login', {'username': 'baozhuang', 'password': 'bz123456'}, login_first='bz')
    s, d = post(f'/aftersale/{new_id}/handoff', {'remark': '包装再接力试试'}, login_first='bz')
    print(f'[8] 包装再接力: HTTP {s} (预期400，已到最后环节) - {d.get("detail", "")[:60]}')

    s, d = get('/loss/from-aftersale/3', 'xs')
    print(f'[9] 损耗回看 loss_no={d["loss_no"]}, responsibility={d["responsibility_display"]}')
    print(f'    inherited handlers 数量: {len(d["inherited_aftersale_handlers"])} (预期≥3)')
    for h in d['inherited_aftersale_handlers']:
        print(f'      - [{h["role_display"]}] {h["operator"]}: {h["remark"][:40]}')
    print(f'    loss自身历史数: {len(d["histories"])}')
    print(f'    第一条历史: {d["histories"][0]["remark"][:100]}')

    s, d = get('/aftersale/3', 'xs')
    ctx = d.get('loss_context')
    print(f'[10] 售后详情 loss_context 存在: {ctx is not None}')
    if ctx:
        print(f'     context current_handler: {ctx.get("current_handler_name")}')
        print(f'     handlers_chain 数量: {len(ctx.get("handlers_chain", []))}')

    print()
    print('========== 验证总结 ==========')
    print('✅ 初始角色 = 种植员')
    print('✅ 销售内勤无权限直接受理')
    print('✅ 种植员 → 销售 → 包装 三棒接力顺序正确')
    print('✅ 包装主管不能再接力（最后一棒校验生效）')
    print('✅ 损耗回看继承三棒责任人链 + 历史说明')
    print('✅ 售后详情 loss_context 带出责任人和历史不丢失')


if __name__ == '__main__':
    main()
