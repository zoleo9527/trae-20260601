import base64
import sys
data = sys.stdin.read()
with open(sys.argv[1], "w") as f:
    f.write(base64.b64decode(data).decode("utf-8"))
print('written:', sys.argv[1])
