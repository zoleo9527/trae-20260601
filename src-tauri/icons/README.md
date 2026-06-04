# 应用图标

## 图标生成

使用 Tauri CLI 自动生成各平台图标：

```bash
# 准备一张 1024x1024 的 PNG 图标，命名为 source.png 放在此目录
# 然后运行：
pnpm tauri icon icons/source.png
```

## 图标尺寸说明

Tauri 会自动生成以下尺寸：
- 32x32.png
- 128x128.png
- 128x128@2x.png
- icon.icns (macOS)
- icon.ico (Windows)

## 临时方案

在图标准备好之前，构建会自动使用 Tauri 默认图标。
