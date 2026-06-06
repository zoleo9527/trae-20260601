import os
base = "/Users/liu/Documents/private/model-test/trae-20260601-4"
path = os.path.join(base, "api/db.ts")
print("db path:", path)
print("current lines:", len(open(path).read().splitlines()))

