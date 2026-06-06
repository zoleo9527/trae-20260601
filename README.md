# 艺术培训机构 - 作品点评与家长反馈系统

一个专为艺术培训机构设计的作品点评和家长反馈管理系统。

## 功能概述

### 核心功能

1. **作品点评管理**
   - 任课老师记录学生作品亮点和待改进之处
   - 支持点评模板，标准化点评内容
   - 作品图片上传和展示
   - 记录课堂观察和下一步练习建议

2. **家长反馈管理**
   - 家长可对点评进行反馈
   - 支持多种反馈类型：表扬、疑问、建议、投诉、换班、停课、补交作品
   - 课程顾问跟进家长疑问

3. **跟进记录**
   - 记录每次跟进的内容和操作人员
   - 时间线展示跟进历史
   - 支持多角色（老师、顾问、主管）跟进

4. **待办事项**
   - 家长反馈涉及换班、停课、投诉时自动转成待办
   - 待办状态跟踪（待处理、处理中、已完成）
   - 负责人分配和截止日期

5. **学生管理**
   - 查看学生信息和家长联系方式
   - 识别长期未读点评的家长
   - 学生点评历史统计

### 样例数据场景

- **家长未读**：陈小明的点评，家长尚未查看
- **要求换班**：林小红家长要求换班，已转为待办，顾问跟进中
- **作品需补交**：王小华作品未完成，待补交，已生成待办

## 技术栈

- **框架**：Remix 2.x (React + TypeScript)
- **样式**：TailwindCSS 3.x
- **图标**：Lucide React
- **构建工具**：Vite

## 项目结构

```
app/
├── components/          # 公共组件
│   ├── Sidebar.tsx      # 侧边栏导航
│   ├── DashboardLayout.tsx # 布局组件
│   ├── StatusBadge.tsx  # 状态标签
│   ├── ArtworkGallery.tsx # 作品图片展示
│   └── FollowUpTimeline.tsx # 跟进记录时间线
├── data/
│   └── mockData.ts      # 模拟数据和工具函数
├── types/
│   └── index.ts         # TypeScript 类型定义
├── routes/
│   ├── _index.tsx       # 工作台首页
│   ├── reviews._index.tsx # 点评列表页
│   ├── reviews.$id.tsx  # 点评详情页
│   ├── feedbacks._index.tsx # 家长反馈页
│   ├── todos._index.tsx # 待办事项页
│   └── students._index.tsx # 学生管理页
├── root.tsx             # 根组件
└── tailwind.css         # 全局样式
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 类型检查

```bash
npm run typecheck
```

## 数据模型说明

### 反馈状态 (FeedbackStatus)

| 状态 | 说明 |
|------|------|
| parent_unread | 家长未读 |
| parent_read | 家长已读 |
| parent_replied | 家长已回复 |
| consultant_following | 顾问跟进中 |
| resolved | 已处理 |
| pending_makeup | 待补交作品 |

### 反馈类型 (FeedbackType)

| 类型 | 说明 |
|------|------|
| general | 普通反馈 |
| praise | 表扬 |
| question | 疑问 |
| suggestion | 建议 |
| complaint | 投诉 |
| class_change | 要求换班 |
| suspension | 要求停课 |
| makeup_required | 需补交作品 |

### 待办类型 (TodoType)

| 类型 | 说明 |
|------|------|
| class_change | 换班 |
| suspension | 停课 |
| complaint | 投诉 |
| makeup | 补交 |
| other | 其他 |

## 使用说明

### 任课老师

1. 进入「作品点评」页面
2. 点击「新建点评」选择模板
3. 上传学生作品图片
4. 填写课堂观察、作品亮点、待改进之处、练习建议
5. 提交后家长即可查看

### 课程顾问

1. 进入「家长反馈」页面查看最新反馈
2. 对涉及换班、停课、投诉的反馈创建待办
3. 在「跟进记录」中添加跟进内容
4. 待办完成后标记为已完成

### 校区主管

1. 进入「学生管理」查看长期未读点评的家长
2. 进入「待办事项」查看所有待处理事项
3. 查看工作台统计数据了解整体情况
