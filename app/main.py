from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.api import document_types, customers, document_gaps, collection_records, submissions, risks, document_requirements

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="会计代账公司-原始票据与资料缺口管理系统",
    description="""
## 系统功能
    
### 角色分工
- **会计**：维护资料清单
- **客户经理**：负责催交
- **主管**：查看风险汇总

### 核心功能
1. **资料项配置**：支持发票、银行回单、工资表、合同、库存表等类型
2. **缺口标记**：记录客户应该交什么、已经交什么、还差什么
3. **催交记录**：客户经理催交过程记录
4. **客户补交**：客户提交资料记录
5. **风险汇总**：主管查看会影响申报的风险项

### 资料类别
- 发票
- 银行回单
- 工资表
- 合同
- 库存表
    """,
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(document_types.router)
app.include_router(customers.router)
app.include_router(document_requirements.router)
app.include_router(document_gaps.router)
app.include_router(collection_records.router)
app.include_router(submissions.router)
app.include_router(risks.router)


@app.get("/")
def root():
    return {
        "message": "欢迎使用会计代账公司-原始票据与资料缺口管理系统",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}