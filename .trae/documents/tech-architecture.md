## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        "Vue 3 + TypeScript"
        "Vue Router"
        "Tailwind CSS"
        "Pinia 状态管理"
    end
    subgraph "后端层"
        "Express + TypeScript"
        "REST API"
        "Multer 附件上传"
    end
    subgraph "数据层"
        "SQLite (better-sqlite3)"
        "文件存储 (uploads/)"
    end
    "Vue 3 + TypeScript" --> "REST API"
    "REST API" --> "SQLite (better-sqlite3)"
    "REST API" --> "文件存储 (uploads/)"
```

## 2. 技术说明

- 前端：Vue 3 + TypeScript + Vite + Tailwind CSS + Vue Router + Pinia
- 初始化工具：vite-init（vue-express-ts 模板）
- 后端：Express 4 + TypeScript（ESM）
- 数据库：SQLite（better-sqlite3），模拟数据初始化
- 附件上传：Multer，文件存储在 uploads/ 目录

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| `/` | 仪表盘（根据角色显示不同概览） |
| `/rentals` | 雪具租赁管理 |
| `/schedule` | 教练排班与课程管理 |
| `/checkin` | 学员签到 |
| `/rescue` | 救援记录 |

## 4. API 定义

### 4.1 角色与认证

```typescript
GET  /api/role          // 获取当前角色
POST /api/role/switch   // 切换角色 { role: 'rental' | 'supervisor' | 'patrol' }
```

### 4.2 雪具租赁

```typescript
GET    /api/rentals              // 获取租赁单列表 ?status=active|returned|mismatch
POST   /api/rentals              // 创建租赁单 { studentId, equipmentType, equipmentId, courseId? }
PUT    /api/rentals/:id/return   // 归还 { equipmentId }
PUT    /api/rentals/:id/mismatch // 标记错拿 { note }
```

### 4.3 教练排班与课程

```typescript
GET    /api/courses              // 课程列表 ?date=&instructorId=
POST   /api/courses              // 创建课程 { title, instructorId, startTime, endTime, maxStudents }
PUT    /api/courses/:id          // 编辑课程
DELETE /api/courses/:id          // 取消课程
PUT    /api/courses/:id/noshow   // 标记爽约 { studentId }
GET    /api/instructors          // 教练列表
GET    /api/schedule             // 排班数据 ?weekStart=
```

### 4.4 学员签到

```typescript
GET    /api/checkin              // 当前课程签到状态 ?courseId=
POST   /api/checkin              // 签到 { courseId, studentId }
GET    /api/checkin/history      // 签到回看 ?date=&courseId=
GET    /api/checkin/gaps         // 空档检测 ?date=
```

### 4.5 救援记录

```typescript
GET    /api/rescues              // 救援列表 ?date=&severity=
POST   /api/rescues              // 创建记录 { studentId?, courseId?, description, location, severity, attachments: [] }
PUT    /api/rescues/:id          // 更新记录
POST   /api/rescues/:id/attachments // 上传附件（multipart/form-data）
DELETE /api/rescues/:id/attachments/:attachmentId // 删除附件
```

### 4.6 仪表盘

```typescript
GET /api/dashboard              // 仪表盘数据（根据角色返回不同指标）
```

## 5. 服务端架构图

```mermaid
flowchart LR
    "Router" --> "Controller"
    "Controller" --> "Service"
    "Service" --> "Repository"
    "Repository" --> "SQLite"
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    "Instructor" ||--o{ "Course" : "teaches"
    "Student" ||--o{ "Rental" : "rents"
    "Student" ||--o{ "CheckIn" : "signs"
    "Course" ||--o{ "CheckIn" : "has"
    "Course" ||--o{ "CourseStudent" : "includes"
    "Student" ||--o{ "CourseStudent" : "enrolled"
    "Student" ||--o{ "RescueRecord" : "involved"
    "Course" ||--o{ "RescueRecord" : "related"
    "RescueRecord" ||--o{ "Attachment" : "has"
    "Equipment" ||--o{ "Rental" : "used_in"

    "Instructor" {
        "int id PK"
        "string name"
        "string phone"
        "string color"
    }
    "Student" {
        "int id PK"
        "string name"
        "string phone"
    }
    "Equipment" {
        "int id PK"
        "string type"
        "string code"
        "string status"
    }
    "Rental" {
        "int id PK"
        "int studentId FK"
        "int equipmentId FK"
        "int courseId FK"
        "string status"
        "datetime rentedAt"
        "datetime returnedAt"
        "boolean mismatch"
        "string mismatchNote"
    }
    "Course" {
        "int id PK"
        "int instructorId FK"
        "string title"
        "datetime startTime"
        "datetime endTime"
        "int maxStudents"
        "string status"
    }
    "CourseStudent" {
        "int id PK"
        "int courseId FK"
        "int studentId FK"
        "boolean noShow"
    }
    "CheckIn" {
        "int id PK"
        "int courseId FK"
        "int studentId FK"
        "datetime checkedInAt"
        "boolean checkedIn"
    }
    "RescueRecord" {
        "int id PK"
        "int studentId FK"
        "int courseId FK"
        "string description"
        "string location"
        "string severity"
        "string status"
        "datetime createdAt"
    }
    "Attachment" {
        "int id PK"
        "int rescueId FK"
        "string filename"
        "string path"
        "boolean isPlaceholder"
    }
```

### 6.2 数据定义语言

```sql
CREATE TABLE instructors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3B82F6'
);

CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL
);

CREATE TABLE equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'available'
);

CREATE TABLE rentals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL REFERENCES students(id),
    equipmentId INTEGER NOT NULL REFERENCES equipment(id),
    courseId INTEGER REFERENCES courses(id),
    status TEXT NOT NULL DEFAULT 'active',
    rentedAt TEXT NOT NULL DEFAULT (datetime('now')),
    returnedAt TEXT,
    mismatch INTEGER NOT NULL DEFAULT 0,
    mismatchNote TEXT
);

CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instructorId INTEGER NOT NULL REFERENCES instructors(id),
    title TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    maxStudents INTEGER NOT NULL DEFAULT 8,
    status TEXT NOT NULL DEFAULT 'scheduled'
);

CREATE TABLE course_students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    courseId INTEGER NOT NULL REFERENCES courses(id),
    studentId INTEGER NOT NULL REFERENCES students(id),
    noShow INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    courseId INTEGER NOT NULL REFERENCES courses(id),
    studentId INTEGER NOT NULL REFERENCES students(id),
    checkedInAt TEXT,
    checkedIn INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE rescue_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER REFERENCES students(id),
    courseId INTEGER REFERENCES courses(id),
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'minor',
    status TEXT NOT NULL DEFAULT 'open',
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rescueId INTEGER NOT NULL REFERENCES rescue_records(id),
    filename TEXT NOT NULL,
    path TEXT,
    isPlaceholder INTEGER NOT NULL DEFAULT 1
);
```
