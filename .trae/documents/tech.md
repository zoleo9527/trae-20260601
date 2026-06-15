
## 1. Architecture Design
```mermaid
flowchart TB
    subgraph Frontend
        A[React Components] --> B[Zustand Store]
        B --> C[Supabase Client]
    end
    subgraph Backend
        D[Supabase Auth]
        E[Supabase Database]
        F[Supabase Storage]
    end
    C --> D
    C --> E
    C --> F
```

## 2. Technology Description
- Frontend: React@18 + tailwindcss@3 + vite
- Initialization Tool: vite-init
- Backend: Supabase
- Database: Supabase (PostgreSQL)
- State Management: Zustand
- Icons: Lucide React

## 3. Route Definitions
| Route | Purpose |
|-------|---------|
| / | 工作台首页 |
| /claims | 物损申诉列表 |
| /claims/:id | 物损申诉详情 |
| /payments | 赔付处理列表 |
| /payments/:id | 赔付处理详情 |
| /exceptions | 异常提醒中心 |

## 4. API Definitions
```typescript
interface Claim {
  id: string;
  orderId: string;
  vehicleId: string;
  customerName: string;
  customerPhone: string;
  damageDescription: string;
  damagePhotos: string[];
  responsibility: 'company' | 'customer' | 'third_party' | 'undetermined';
  status: 'pending' | 'processing' | 'review' | 'approved' | 'paid' | 'archived';
  remarks: Remark[];
  createdAt: Date;
  updatedAt: Date;
}

interface Remark {
  id: string;
  claimId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}

interface Payment {
  id: string;
  claimId: string;
  amount: number;
  method: 'bank' | 'wechat' | 'alipay';
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  approvedAt?: Date;
  paidAt?: Date;
  remarks: string;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  addressFrom: string;
  addressTo: string;
  scheduledDate: Date;
  vehicleId: string;
  driverName: string;
}

interface Vehicle {
  id: string;
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  status: 'available' | 'assigned' | 'maintenance';
}
```

## 5. Server Architecture Diagram
```mermaid
flowchart LR
    A[Frontend] --> B[Supabase Auth]
    A --> C[Supabase DB]
    A --> D[Supabase Storage]
    C --> E[claims table]
    C --> F[payments table]
    C --> G[orders table]
    C --> H[vehicles table]
    C --> I[remarks table]
    D --> J[damage_photos bucket]
```

## 6. Data Model

### 6.1 Data Model Definition
```mermaid
erDiagram
    CLAIMS ||--o{ REMARKS : has
    CLAIMS ||--|| ORDERS : references
    CLAIMS ||--|| VEHICLES : references
    CLAIMS ||--o{ PAYMENTS : has

    CLAIMS {
        uuid id PK
        uuid order_id FK
        uuid vehicle_id FK
        varchar customer_name
        varchar customer_phone
        text damage_description
        json damage_photos
        varchar responsibility
        varchar status
        timestamp created_at
        timestamp updated_at
    }

    REMARKS {
        uuid id PK
        uuid claim_id FK
        uuid user_id
        varchar user_name
        text content
        timestamp created_at
    }

    PAYMENTS {
        uuid id PK
        uuid claim_id FK
        numeric amount
        varchar method
        varchar status
        timestamp approved_at
        timestamp paid_at
        text remarks
    }

    ORDERS {
        uuid id PK
        varchar customer_name
        varchar customer_phone
        text address_from
        text address_to
        timestamp scheduled_date
        uuid vehicle_id FK
        varchar driver_name
    }

    VEHICLES {
        uuid id PK
        varchar plate_number
        varchar driver_name
        varchar driver_phone
        varchar status
    }
```

### 6.2 Data Definition Language
```sql
CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    vehicle_id UUID REFERENCES vehicles(id),
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    damage_description TEXT NOT NULL,
    damage_photos JSONB DEFAULT '[]',
    responsibility VARCHAR(20) DEFAULT 'undetermined',
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE remarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    user_id UUID,
    user_name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    method VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    approved_at TIMESTAMP,
    paid_at TIMESTAMP,
    remarks TEXT
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    address_from TEXT NOT NULL,
    address_to TEXT NOT NULL,
    scheduled_date TIMESTAMP NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id),
    driver_name VARCHAR(100)
);

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    driver_name VARCHAR(100) NOT NULL,
    driver_phone VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'available'
);

GRANT SELECT ON claims TO anon;
GRANT SELECT ON remarks TO anon;
GRANT SELECT ON payments TO anon;
GRANT SELECT ON orders TO anon;
GRANT SELECT ON vehicles TO anon;

GRANT ALL PRIVILEGES ON claims TO authenticated;
GRANT ALL PRIVILEGES ON remarks TO authenticated;
GRANT ALL PRIVILEGES ON payments TO authenticated;
GRANT ALL PRIVILEGES ON orders TO authenticated;
GRANT ALL PRIVILEGES ON vehicles TO authenticated;
```
