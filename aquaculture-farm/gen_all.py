import os, base64

BASE = os.path.dirname(os.path.abspath(__file__))

def w(p, b64):
    fp = os.path.join(BASE, p)
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    with open(fp, "wb") as f:
        f.write(base64.b64decode(b64))
    print(f"OK: {p}")

