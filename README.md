# 二手车商管理系统 - 上架定价与客户跟进

## 项目概述

专注二手车商内部交接流程与责任追溯的管理系统，通过明确的状态流转和交接留痕，解决二手车商"旧台账、现场记录、沟通截图"三者脱节导致的上架定价和客户跟进责任不清问题。

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **路由**: Vue Router 4
- **状态管理**: Pinia
- **样式**: Tailwind CSS
- **构建工具**: Vite

## 功能特性

### 1. 车辆台账管理
- 车辆列表展示（支持筛选、排序）
- 车辆详情查看
- 完整状态时间轴
- 交接记录追踪

### 2. 上架定价处理
- 定价提交流程（收车经理 → 评估师 → 金融专员）
- 定价审核确认
- 历史定价记录

### 3. 客户跟进管理
- 跟进记录添加
- 跟进历史查看
- 跟进状态管理（待联系 → 有意向 → 谈判中 → 成交/失败）
- 下次跟进提醒

### 4. 交接流程
- 评估交接（收车经理 → 评估师）
- 定价交接（评估师 → 收车经理 → 金融专员）
- 上架交接（金融专员 → 销售顾问）
- 完整的交接留痕

### 5. 角色切换
- 支持切换不同角色用户进行测试
- 收车经理、评估师、金融专员、销售顾问

## 初始化数据

系统包含 7 辆示例车辆，涵盖不同状态：
1. 京A12345 - 宝马5系（入库待评估）
2. 沪B67890 - 奔驰E级（客户跟进中）
3. 粤C55555 - 奥迪A6L（已成交）
4. 浙D77777 - 特斯拉 Model 3（客户跟进中）
5. 苏E99999 - 保时捷 Panamera（客户跟进中）
6. 川A11111 - 大众途昂（评估中）
7. 鲁B22222 - 蔚来 ET7（待定价）

每辆车都包含完整的状态历史和跟进记录。

## 安装与运行

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 项目结构

```
├── src/
│   ├── components/         # Vue 组件
│   │   ├── FilterPanel.vue
│   │   ├── FollowupRecord.vue
│   │   ├── HandoverModal.vue
│   │   ├── PricingForm.vue
│   │   ├── StatusBadge.vue
│   │   ├── StatusTimeline.vue
│   │   └── VehicleCard.vue
│   ├── composables/        # 组合式函数
│   │   ├── useAuth.ts
│   │   ├── useHandover.ts
│   │   ├── useStatusTransition.ts
│   │   └── useVehicles.ts
│   ├── pages/             # 页面
│   │   ├── HomePage.vue
│   │   ├── vehicle/
│   │   │   ├── VehicleDetailPage.vue
│   │   │   └── PricingPage.vue
│   │   └── followup/
│   │       └── FollowupPage.vue
│   ├── stores/            # Pinia 状态管理
│   │   └── vehicleStore.ts
│   ├── data/              # Mock 数据
│   │   ├── vehicles.json
│   │   ├── users.json
│   │   └── statuses.json
│   ├── types/             # TypeScript 类型定义
│   │   └── index.ts
│   ├── router/            # 路由配置
│   │   └── index.ts
│   ├── assets/            # 静态资源
│   │   └── main.css
│   ├── App.vue
│   └── main.ts
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 状态流转

```
入库待评估 → 评估中 → 待定价 → 定价待确认 → 已上架 → 客户跟进中 → 成交/下架
```

## 使用说明

### 切换用户
点击右上角用户名旁的"切换用户"按钮，可以切换到不同角色进行测试。

### 筛选车辆
使用左侧筛选面板按状态、品牌、责任人员进行筛选。

### 查看详情
点击任意车辆卡片进入详情页，查看完整状态时间轴和跟进记录。

### 状态变更
在车辆详情页中，根据当前状态和用户角色，可以执行相应的状态变更操作。

### 交接操作
当需要进行交接时，系统会自动提示交接操作，完成责任人的变更。

### 定价处理
对于"待定价"状态的车辆，点击"处理定价"进入定价页面，填写定价信息。

### 客户跟进
对于"客户跟进中"状态的车辆，可以添加跟进记录、查看历史跟进、标记成交或失败。

## 数据存储

当前系统使用浏览器 localStorage 存储数据，刷新页面后数据会保留。如需重置数据，请清除浏览器 localStorage。

## License

MIT
