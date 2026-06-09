import os, json, sys
data = json.load(sys.stdin)
for path, content in data.items():
    full = os.path.join("/Users/liu/Documents/private/model-test/trae-20260601-5", path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as out:
        out.write(content)
    print(f"Written {path}")
