import os

base_dir = "/Users/liu/Documents/private/model-test/trae-20260601-4"

# 1. 修复 api/tsconfig.json
tsconfig_api = '''{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "outDir": "../dist/api",
    "rootDir": ".",
    "types": ["node"]
  },
  "include": ["*.ts"]
}
'''
with open(os.path.join(base_dir, 'api/tsconfig.json'), 'w') as f:
    f.write(tsconfig_api)
print('api/tsconfig.json 修复完成')

# 2. 修复 api/db.ts 的导入方式
db_path = os.path.join(base_dir, 'api/db.ts')
with open(db_path, 'r') as f:
    content = f.read()
content = content.replace("import fs from 'fs';", "import * as fs from 'fs';")
content = content.replace("import path from 'path';", "import * as path from 'path';")
withimport os

base_dir = "/Users/liu/Documents/private/model-test/trae-20260601-4"

# 1. 修复 a?base_didex
# 1. 修复 api/tsconfig.json
tsconfig_api = '''{
  "compilerOptiots'tsconfig_api = '''{
  "compi a  "compilerOptions f    "target": "ES2020te    "module": "commonjre    "moduleResolution": po    "esModuleInterop": true,
 ;"    "allowSynontent.replace("    "strict": true,
    "skipLibCheck": cors from 'cors';")
wi    "resolveJsonModule": a    "outDir": "../dist/api",
nt    "rootDir": ".",
?修复完成')

print('所? },
eScript 修复完  "')
