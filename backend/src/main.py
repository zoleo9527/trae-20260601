from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

app = FastAPI(title="窗帘门店-客户量尺与报价确认系统")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CustomerMeasureCreate(BaseModel):
    customer_name: str
    phone: str
    address: str
    room_type: str
    window_width: float
    window_height: float
    curtain_type: str
    fabric: Optional[str] = None
    color: Optional[str] = None
    accessories: Optional[str] = None
    notes: Optional[str] = None

class CustomerMeasure(CustomerMeasureCreate):
    id: str
    status: str
    created_at: datetime
    created_by: str
    updated_at: Optional[datetime] = None
    updated_by: Optional[str] = None
    rejected_reason: Optional[str] = None
    is_urgent: bool = False
    urgent_count: int = 0
    last_urgent_time: Optional[datetime] = None

class QuoteCreate(BaseModel):
    measure_id: str
    unit_price: float
    quantity: float
    total_price: float
    discount: Optional[float] = 0
    final_price: float
    notes: Optional[str] = None

class Quote(QuoteCreate):
    id: str
    status: str
    created_at: datetime
    created_by: str
    updated_at: Optional[datetime] = None
    updated_by: Optional[str] = None
    rejected_reason: Optional[str] = None
    supplementary_materials: Optional[str] = None
    additional_cost: float = 0

class OperationLog(BaseModel):
    id: str
    operation_type: str
    target_id: str
    target_type: str
    operator: str
    content: str
    created_at: datetime

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    username: str
    role: str
    access_token: str

class RejectRequest(BaseModel):
    reason: str

class SupplementRequest(BaseModel):
    materials: str
    additional_cost: float = 0

mock_users = {
    "导购": {"password": "123456", "role": "导购"},
    "量尺师": {"password": "123456", "role": "量尺师"},
    "安装师傅": {"password": "123456", "role": "安装师傅"},
    "管理员": {"password": "123456", "role": "管理员"},
}

def generate_mock_data():
    measures = [
        CustomerMeasure(
            id="m001",
            customer_name="张三",
            phone="13800138001",
            address="朝阳区幸福小区1号楼301室",
            room_type="客厅",
            window_width=3.5,
            window_height=2.8,
            curtain_type="遮光帘",
            fabric="亚麻",
            color="米色",
            accessories="纱帘+轨道",
            notes="客户要求下周安装，窗户左侧有暖气片需要避开",
            status="待报价",
            created_at=datetime(2024, 1, 10, 9, 30),
            created_by="导购"
        ),
        CustomerMeasure(
            id="m002",
            customer_name="李四",
            phone="13800138002",
            address="海淀区阳光花园5号楼202室",
            room_type="主卧",
            window_width=2.2,
            window_height=2.5,
            curtain_type="纱帘",
            fabric="雪纺",
            color="白色",
            accessories="单轨道",
            notes="客户对价格比较敏感，需要推荐性价比高的面料",
            status="已报价",
            created_at=datetime(2024, 1, 11, 14, 0),
            created_by="导购"
        ),
        CustomerMeasure(
            id="m003",
            customer_name="王五",
            phone="13800138003",
            address="西城区和谐家园3号楼101室",
            room_type="书房",
            window_width=1.8,
            window_height=2.0,
            curtain_type="百叶帘",
            fabric="铝合金",
            color="灰色",
            accessories=None,
            notes="需要现场确认窗户开启方式",
            status="已驳回",
            rejected_reason="窗户尺寸测量不准确，需要重新量尺",
            created_at=datetime(2024, 1, 9, 10, 0),
            created_by="导购",
            updated_at=datetime(2024, 1, 9, 15, 0),
            updated_by="量尺师"
        ),
        CustomerMeasure(
            id="m004",
            customer_name="赵六",
            phone="13800138004",
            address="东城区金色家园8号楼401室",
            room_type="次卧",
            window_width=2.0,
            window_height=2.3,
            curtain_type="遮光帘",
            fabric="涤纶",
            color="深蓝色",
            accessories="双轨道",
            notes="客户希望使用静音轨道",
            status="待补材料",
            created_at=datetime(2024, 1, 12, 11, 30),
            created_by="导购"
        ),
        CustomerMeasure(
            id="m005",
            customer_name="孙七",
            phone="13800138005",
            address="丰台区理想城2号楼502室",
            room_type="阳台",
            window_width=4.0,
            window_height=2.2,
            curtain_type="纱帘",
            fabric="棉麻",
            color="浅灰色",
            accessories="纱帘+遮光帘双层",
            notes="阳台有晾衣架，需要特殊处理",
            status="已确认",
            created_at=datetime(2024, 1, 8, 16, 0),
            created_by="导购"
        ),
    ]
    
    quotes = [
        Quote(
            id="q001",
            measure_id="m002",
            unit_price=88.0,
            quantity=11.0,
            total_price=968.0,
            discount=0.1,
            final_price=871.2,
            notes="已确认面料和颜色",
            status="已确认",
            created_at=datetime(2024, 1, 11, 15, 0),
            created_by="量尺师"
        ),
        Quote(
            id="q002",
            measure_id="m005",
            unit_price=120.0,
            quantity=17.6,
            total_price=2112.0,
            discount=0.05,
            final_price=2006.4,
            notes="需要定制特殊轨道",
            status="已完成",
            created_at=datetime(2024, 1, 8, 17, 0),
            created_by="量尺师",
            updated_at=datetime(2024, 1, 13, 10, 0),
            updated_by="安装师傅"
        ),
        Quote(
            id="q003",
            measure_id="m004",
            unit_price=95.0,
            quantity=9.2,
            total_price=874.0,
            discount=0,
            final_price=874.0,
            notes="静音轨道需要额外采购",
            status="待补材料",
            supplementary_materials="静音轨道2.5米",
            created_at=datetime(2024, 1, 12, 14, 0),
            created_by="量尺师"
        ),
    ]
    
    logs = [
        OperationLog(
            id="log001",
            operation_type="创建量尺",
            target_id="m001",
            target_type="量尺单",
            operator="导购",
            content="创建客户张三的量尺单",
            created_at=datetime(2024, 1, 10, 9, 30)
        ),
        OperationLog(
            id="log002",
            operation_type="提交报价",
            target_id="q001",
            target_type="报价单",
            operator="量尺师",
            content="为客户李四提交报价，金额871.2元",
            created_at=datetime(2024, 1, 11, 15, 0)
        ),
        OperationLog(
            id="log003",
            operation_type="驳回量尺",
            target_id="m003",
            target_type="量尺单",
            operator="量尺师",
            content="驳回王五的量尺单，原因：窗户尺寸测量不准确，需要重新量尺",
            created_at=datetime(2024, 1, 9, 15, 0)
        ),
        OperationLog(
            id="log004",
            operation_type="确认报价",
            target_id="q002",
            target_type="报价单",
            operator="安装师傅",
            content="确认孙七的报价，准备安装",
            created_at=datetime(2024, 1, 13, 10, 0)
        ),
    ]
    
    return measures, quotes, logs

measures_db, quotes_db, logs_db = generate_mock_data()

def add_log(operation_type: str, target_id: str, target_type: str, operator: str, content: str):
    log = OperationLog(
        id=f"log{str(len(logs_db)+1).zfill(3)}",
        operation_type=operation_type,
        target_id=target_id,
        target_type=target_type,
        operator=operator,
        content=content,
        created_at=datetime.now()
    )
    logs_db.append(log)

@app.post("/api/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    user = mock_users.get(request.username)
    if user and user["password"] == request.password:
        return LoginResponse(
            username=request.username,
            role=user["role"],
            access_token=str(uuid.uuid4())
        )
    raise HTTPException(status_code=401, detail="用户名或密码错误")

@app.get("/api/measures", response_model=List[CustomerMeasure])
async def get_measures(status: Optional[str] = None):
    if status:
        return [m for m in measures_db if m.status == status]
    return measures_db

@app.get("/api/measures/{measure_id}", response_model=CustomerMeasure)
async def get_measure(measure_id: str):
    measure = next((m for m in measures_db if m.id == measure_id), None)
    if not measure:
        raise HTTPException(status_code=404, detail="量尺单不存在")
    return measure

@app.post("/api/measures", response_model=CustomerMeasure)
async def create_measure(measure: CustomerMeasureCreate):
    new_measure = CustomerMeasure(
        id=f"m{str(len(measures_db)+1).zfill(3)}",
        **measure.dict(),
        status="待报价",
        created_at=datetime.now(),
        created_by="导购"
    )
    measures_db.append(new_measure)
    add_log("创建量尺", new_measure.id, "量尺单", "导购", f"创建客户{measure.customer_name}的量尺单")
    return new_measure

@app.put("/api/measures/{measure_id}", response_model=CustomerMeasure)
async def update_measure(measure_id: str, measure: CustomerMeasureCreate):
    index = next((i for i, m in enumerate(measures_db) if m.id == measure_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="量尺单不存在")
    
    measures_db[index] = CustomerMeasure(
        id=measure_id,
        **measure.dict(),
        status=measures_db[index].status,
        created_at=measures_db[index].created_at,
        created_by=measures_db[index].created_by,
        updated_at=datetime.now(),
        updated_by="导购",
        rejected_reason=measures_db[index].rejected_reason
    )
    add_log("修改量尺", measure_id, "量尺单", "导购", f"修改客户{measure.customer_name}的量尺单")
    return measures_db[index]

@app.post("/api/measures/{measure_id}/reject")
async def reject_measure(measure_id: str, request: RejectRequest):
    measure = next((m for m in measures_db if m.id == measure_id), None)
    if not measure:
        raise HTTPException(status_code=404, detail="量尺单不存在")
    
    reason = request.reason or "未填写驳回原因"
    measure.status = "已驳回"
    measure.rejected_reason = reason
    measure.updated_at = datetime.now()
    measure.updated_by = "量尺师"
    add_log("驳回量尺", measure_id, "量尺单", "量尺师", f"驳回量尺单，原因：{reason}")
    return {"message": "驳回成功"}

@app.post("/api/measures/{measure_id}/resubmit")
async def resubmit_measure(measure_id: str):
    measure = next((m for m in measures_db if m.id == measure_id), None)
    if not measure:
        raise HTTPException(status_code=404, detail="量尺单不存在")
    
    measure.status = "待报价"
    measure.rejected_reason = None
    measure.updated_at = datetime.now()
    measure.updated_by = "导购"
    add_log("重新提交量尺", measure_id, "量尺单", "导购", "重新提交已驳回的量尺单")
    return {"message": "重新提交成功"}

@app.post("/api/measures/{measure_id}/urgent")
async def urgent_measure(measure_id: str):
    measure = next((m for m in measures_db if m.id == measure_id), None)
    if not measure:
        raise HTTPException(status_code=404, detail="量尺单不存在")
    
    measure.is_urgent = True
    measure.urgent_count += 1
    measure.last_urgent_time = datetime.now()
    measure.updated_at = datetime.now()
    
    customer = next((m for m in measures_db if m.id == measure_id), None)
    add_log("催单", measure_id, "量尺单", "导购", f"客户{customer.customer_name}催单，当前催单次数：{measure.urgent_count}")
    return {"message": "催单成功"}

@app.post("/api/quotes/{quote_id}/urgent")
async def urgent_quote(quote_id: str):
    quote = next((q for q in quotes_db if q.id == quote_id), None)
    if not quote:
        raise HTTPException(status_code=404, detail="报价单不存在")
    
    measure = next((m for m in measures_db if m.id == quote.measure_id), None)
    if measure:
        measure.is_urgent = True
        measure.urgent_count += 1
        measure.last_urgent_time = datetime.now()
        measure.updated_at = datetime.now()
    
    customer = next((m for m in measures_db if m.id == quote.measure_id), None)
    add_log("催单", quote_id, "报价单", "导购", f"客户{customer.customer_name}催单，当前催单次数：{measure.urgent_count if measure else 1}")
    return {"message": "催单成功"}

@app.get("/api/quotes", response_model=List[Quote])
async def get_quotes(status: Optional[str] = None):
    if status:
        return [q for q in quotes_db if q.status == status]
    return quotes_db

@app.get("/api/quotes/{quote_id}", response_model=Quote)
async def get_quote(quote_id: str):
    quote = next((q for q in quotes_db if q.id == quote_id), None)
    if not quote:
        raise HTTPException(status_code=404, detail="报价单不存在")
    return quote

@app.put("/api/quotes/{quote_id}", response_model=Quote)
async def update_quote(quote_id: str, quote_data: QuoteCreate):
    index = next((i for i, q in enumerate(quotes_db) if q.id == quote_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="报价单不存在")
    
    quotes_db[index] = Quote(
        id=quote_id,
        **quote_data.dict(),
        status=quotes_db[index].status,
        created_at=quotes_db[index].created_at,
        created_by=quotes_db[index].created_by,
        updated_at=datetime.now(),
        updated_by="量尺师",
        rejected_reason=quotes_db[index].rejected_reason,
        supplementary_materials=quotes_db[index].supplementary_materials
    )
    
    customer = next((m for m in measures_db if m.id == quote_data.measure_id), None)
    add_log("修改报价", quote_id, "报价单", "量尺师", f"修改客户{customer.customer_name}的报价，金额{quote_data.final_price}元")
    return quotes_db[index]

@app.get("/api/measures/{measure_id}/quote", response_model=Optional[Quote])
async def get_quote_by_measure(measure_id: str):
    quote = next((q for q in quotes_db if q.measure_id == measure_id), None)
    return quote

@app.post("/api/quotes", response_model=Quote)
async def create_quote(quote: QuoteCreate):
    measure = next((m for m in measures_db if m.id == quote.measure_id), None)
    if not measure:
        raise HTTPException(status_code=404, detail="量尺单不存在")
    
    new_quote = Quote(
        id=f"q{str(len(quotes_db)+1).zfill(3)}",
        **quote.dict(),
        status="待确认",
        created_at=datetime.now(),
        created_by="量尺师"
    )
    quotes_db.append(new_quote)
    measure.status = "已报价"
    measure.updated_at = datetime.now()
    measure.updated_by = "量尺师"
    
    customer = next((m for m in measures_db if m.id == quote.measure_id), None)
    add_log("创建报价", new_quote.id, "报价单", "量尺师", f"为客户{customer.customer_name}创建报价，金额{quote.final_price}元")
    return new_quote

@app.post("/api/quotes/{quote_id}/confirm")
async def confirm_quote(quote_id: str):
    quote = next((q for q in quotes_db if q.id == quote_id), None)
    if not quote:
        raise HTTPException(status_code=404, detail="报价单不存在")
    
    quote.status = "已确认"
    quote.updated_at = datetime.now()
    quote.updated_by = "安装师傅"
    
    measure = next((m for m in measures_db if m.id == quote.measure_id), None)
    if measure:
        measure.status = "已确认"
        measure.updated_at = datetime.now()
        measure.updated_by = "安装师傅"
    
    add_log("确认报价", quote_id, "报价单", "安装师傅", "确认报价单")
    return {"message": "确认成功"}

@app.post("/api/quotes/{quote_id}/reject")
async def reject_quote(quote_id: str, request: RejectRequest):
    quote = next((q for q in quotes_db if q.id == quote_id), None)
    if not quote:
        raise HTTPException(status_code=404, detail="报价单不存在")
    
    reason = request.reason or "未填写驳回原因"
    quote.status = "已驳回"
    quote.rejected_reason = reason
    quote.updated_at = datetime.now()
    quote.updated_by = "安装师傅"
    
    measure = next((m for m in measures_db if m.id == quote.measure_id), None)
    if measure:
        measure.status = "已报价"
        measure.updated_at = datetime.now()
        measure.updated_by = "安装师傅"
    
    add_log("驳回报价", quote_id, "报价单", "安装师傅", f"驳回报价单，原因：{reason}")
    return {"message": "驳回成功"}

@app.post("/api/quotes/{quote_id}/supplement")
async def supplement_materials(quote_id: str, request: SupplementRequest):
    quote = next((q for q in quotes_db if q.id == quote_id), None)
    if not quote:
        raise HTTPException(status_code=404, detail="报价单不存在")
    
    quote.status = "待补材料"
    quote.supplementary_materials = request.materials
    quote.additional_cost = request.additional_cost
    quote.updated_at = datetime.now()
    quote.updated_by = "量尺师"
    
    if request.additional_cost > 0:
        quote.total_price = quote.total_price + request.additional_cost
        quote.final_price = quote.total_price * (1 - (quote.discount or 0))
    
    measure = next((m for m in measures_db if m.id == quote.measure_id), None)
    if measure:
        measure.status = "待补材料"
        measure.updated_at = datetime.now()
        measure.updated_by = "量尺师"
    
    add_log("补充材料", quote_id, "报价单", "量尺师", f"补充材料：{request.materials}，额外费用：{request.additional_cost}元")
    return {"message": "补充材料成功"}

@app.post("/api/quotes/{quote_id}/complete_supplement")
async def complete_supplement(quote_id: str):
    quote = next((q for q in quotes_db if q.id == quote_id), None)
    if not quote:
        raise HTTPException(status_code=404, detail="报价单不存在")
    
    quote.status = "待确认"
    quote.updated_at = datetime.now()
    quote.updated_by = "量尺师"
    
    measure = next((m for m in measures_db if m.id == quote.measure_id), None)
    if measure:
        measure.status = "已报价"
        measure.updated_at = datetime.now()
        measure.updated_by = "量尺师"
    
    add_log("完成补料", quote_id, "报价单", "量尺师", "完成材料补充，报价单等待确认")
    return {"message": "完成补料成功"}

@app.post("/api/quotes/{quote_id}/resubmit")
async def resubmit_quote(quote_id: str):
    quote = next((q for q in quotes_db if q.id == quote_id), None)
    if not quote:
        raise HTTPException(status_code=404, detail="报价单不存在")
    
    quote.status = "待确认"
    quote.rejected_reason = None
    quote.updated_at = datetime.now()
    quote.updated_by = "量尺师"
    
    measure = next((m for m in measures_db if m.id == quote.measure_id), None)
    if measure:
        measure.status = "已报价"
        measure.updated_at = datetime.now()
        measure.updated_by = "量尺师"
    
    customer = next((m for m in measures_db if m.id == quote.measure_id), None)
    add_log("重新提交报价", quote_id, "报价单", "量尺师", f"重新提交客户{customer.customer_name}的报价单，等待安装师傅确认")
    return {"message": "重新提交成功"}

@app.post("/api/quotes/{quote_id}/complete")
async def complete_quote(quote_id: str):
    quote = next((q for q in quotes_db if q.id == quote_id), None)
    if not quote:
        raise HTTPException(status_code=404, detail="报价单不存在")
    
    quote.status = "已完成"
    quote.updated_at = datetime.now()
    quote.updated_by = "安装师傅"
    
    measure = next((m for m in measures_db if m.id == quote.measure_id), None)
    if measure:
        measure.status = "已完成"
        measure.updated_at = datetime.now()
        measure.updated_by = "安装师傅"
    
    add_log("完成安装", quote_id, "报价单", "安装师傅", "完成安装")
    return {"message": "完成安装"}

@app.get("/api/logs", response_model=List[OperationLog])
async def get_logs():
    return sorted(logs_db, key=lambda x: x.created_at, reverse=True)

@app.post("/api/reset")
async def reset_data():
    global measures_db, quotes_db, logs_db
    measures_db, quotes_db, logs_db = generate_mock_data()
    return {"message": "数据重置成功"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
