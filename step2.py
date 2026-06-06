import os
base = "/Users/liu/Documents/private/model-test/trae-20260601-4"
print("准备修改 db.ts 和 seed.ts 为 SQLite 版本")
print("当前 db.ts 行数:", len(open(os.path.join(base, "api/db.ts")).read().splitlines()))

