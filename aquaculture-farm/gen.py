import os
BASE = os.path.dirname(os.path.abspath(__file__))
def w(p, c):
    fp = os.path.join(BASE, p)
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(c)
    print(f'OK: {p}')
