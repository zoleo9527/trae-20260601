import os
path = '/Users/liu/Documents/private/model-test/trae-20260601-3/frontend/index.html'
L = []
L.append('<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n')
L.append('<title>\u6c34\u4ea7\u517b\u6b96\u573a - \u6295\u5582\u8ba1\u5212\u4e0e\u9972\u6599\u9886\u7528</title>\n')
with open(path, 'w', encoding='utf-8') as f:
    f.write(''.join(L))
print('Step 1 done:', os.path.getsize(path))
