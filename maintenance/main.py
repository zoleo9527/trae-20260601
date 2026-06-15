from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional
import json
import os
from datetime import datetime

app = FastAPI(title="标识制作厂-安装验收与整改回访系统")

UPLOAD_DIR = "static/uploads"
DATA_FILE = "data/projects.json"

os.makedirs(UPLOAD_DIR, exist_ok=True)

class CustomerFeedback(BaseModel):
    id: str
    content: str
    issue_type: str
    created_at: str

class InspectionPhoto(BaseModel):
    id: str
    filename: str
    uploader: str
    upload_time: str
    category: str

class RectificationRecord(BaseModel):
    id: str
    description: str
    deadline: str
    status: str
    responsible: str
    before_photos: List[str] = []
    after_photos: List[str] = []

class VisitRecord(BaseModel):
    id: str
    visit_date: str
    result: str
    customer_signature: Optional[str] = None
    remarks: str = ""

class Project(BaseModel):
    id: str
    name: str
    customer: str
    address: str
    install_date: str
    status: str
    install_photos: List[InspectionPhoto] = []
    design_drawing: Optional[str] = None
    measurements: Optional[str] = None
    customer_feedbacks: List[CustomerFeedback] = []
    inspection_conclusion: Optional[str] = None
    rectification_records: List[RectificationRecord] = []
    visit_records: List[VisitRecord] = []

def load_projects():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return [Project(**p) for p in data]
    return []

def save_projects(projects):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump([p.dict() for p in projects], f, ensure_ascii=False, indent=2)

sample_projects = [
    Project(
        id="P001",
        name="万达广场标识安装",
        customer="万达集团",
        address="北京市朝阳区建国路93号",
        install_date="2024-01-15",
        status="pending",
        install_photos=[],
        customer_feedbacks=[],
        rectification_records=[],
        visit_records=[]
    ),
    Project(
        id="P002",
        name="华润大厦导视系统",
        customer="华润置地",
        address="上海市浦东新区陆家嘴环路1000号",
        install_date="2024-01-20",
        status="completed",
        install_photos=[
            InspectionPhoto(id="IMG001", filename="cr001.jpg", uploader="张伟", upload_time="2024-01-20 14:30", category="整体"),
            InspectionPhoto(id="IMG002", filename="cr002.jpg", uploader="张伟", upload_time="2024-01-20 14:35", category="细节")
        ],
        design_drawing="cr_design.pdf",
        measurements="测量报告.pdf",
        customer_feedbacks=[
            CustomerFeedback(id="FB001", content="字体版本不一致，与设计图不符", issue_type="字体问题", created_at="2024-01-21 09:00")
        ],
        inspection_conclusion="需要返工，字体需更换为指定版本",
        rectification_records=[
            RectificationRecord(id="RT001", description="更换所有标识字体为方正黑体", deadline="2024-01-25", status="completed", responsible="李明", before_photos=["cr_before.jpg"], after_photos=["cr_after.jpg"])
        ],
        visit_records=[
            VisitRecord(id="VT001", visit_date="2024-01-26", result="客户已验收通过", customer_signature="王总", remarks="客户对整改结果满意")
        ]
    ),
    Project(
        id="P003",
        name="凯德MALL招牌工程",
        customer="凯德集团",
        address="广州市天河区天河路385号",
        install_date="2024-01-25",
        status="rectifying",
        install_photos=[
            InspectionPhoto(id="IMG003", filename="kd001.jpg", uploader="李强", upload_time="2024-01-25 16:00", category="夜间效果"),
            InspectionPhoto(id="IMG004", filename="kd002.jpg", uploader="李强", upload_time="2024-01-25 16:10", category="安装细节")
        ],
        design_drawing="kd_design.pdf",
        measurements="测量报告.pdf",
        customer_feedbacks=[
            CustomerFeedback(id="FB002", content="灯箱夜间亮度不足，部分灯珠不亮", issue_type="灯光问题", created_at="2024-01-26 10:30")
        ],
        inspection_conclusion="灯箱接线存在问题，需要重新接线检修",
        rectification_records=[
            RectificationRecord(id="RT002", description="灯箱内部线路检查与重新接线", deadline="2024-01-30", status="in_progress", responsible="王工", before_photos=["kd_before.jpg"])
        ],
        visit_records=[]
    )
]

if not os.path.exists(DATA_FILE):
    save_projects(sample_projects)

@app.get("/", response_class=HTMLResponse)
async def index():
    with open("templates/index.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.get("/api/projects")
async def get_projects(status: Optional[str] = None):
    projects = load_projects()
    if status:
        projects = [p for p in projects if p.status == status]
    return projects

@app.get("/api/projects/{project_id}")
async def get_project(project_id: str):
    projects = load_projects()
    project = next((p for p in projects if p.id == project_id), None)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    return project

@app.post("/api/projects/{project_id}/photos")
async def upload_photo(project_id: str, file: UploadFile = File(...), category: str = "整体"):
    projects = load_projects()
    project = next((p for p in projects if p.id == project_id), None)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    filename = f"{project_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    photo = InspectionPhoto(
        id=f"IMG{len(project.install_photos)+1:03d}",
        filename=filename,
        uploader="当前用户",
        upload_time=datetime.now().strftime("%Y-%m-%d %H:%M"),
        category=category
    )
    project.install_photos.append(photo)
    save_projects(projects)
    
    return {"message": "照片上传成功", "photo": photo}

@app.post("/api/projects/{project_id}/feedbacks")
async def add_feedback(project_id: str, content: str, issue_type: str):
    projects = load_projects()
    project = next((p for p in projects if p.id == project_id), None)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    feedback = CustomerFeedback(
        id=f"FB{len(project.customer_feedbacks)+1:03d}",
        content=content,
        issue_type=issue_type,
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M")
    )
    project.customer_feedbacks.append(feedback)
    save_projects(projects)
    
    return {"message": "反馈记录成功", "feedback": feedback}

@app.post("/api/projects/{project_id}/inspection")
async def submit_inspection(project_id: str, conclusion: str):
    projects = load_projects()
    project = next((p for p in projects if p.id == project_id), None)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    project.inspection_conclusion = conclusion
    project.status = "rectifying" if "返工" in conclusion or "整改" in conclusion else "completed"
    save_projects(projects)
    
    return {"message": "验收结论已提交"}

@app.post("/api/projects/{project_id}/rectifications")
async def add_rectification(project_id: str, description: str, deadline: str, responsible: str):
    projects = load_projects()
    project = next((p for p in projects if p.id == project_id), None)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    rectification = RectificationRecord(
        id=f"RT{len(project.rectification_records)+1:03d}",
        description=description,
        deadline=deadline,
        status="pending",
        responsible=responsible
    )
    project.rectification_records.append(rectification)
    save_projects(projects)
    
    return {"message": "整改记录已添加", "rectification": rectification}

@app.post("/api/projects/{project_id}/documents")
async def upload_document(project_id: str, file: UploadFile = File(...), doc_type: str = "design"):
    projects = load_projects()
    project = next((p for p in projects if p.id == project_id), None)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    filename = f"{project_id}_{doc_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    if doc_type == "design":
        project.design_drawing = filename
    else:
        project.measurements = filename
    
    save_projects(projects)
    
    return {"message": "文件上传成功", "filename": filename}

@app.post("/api/projects/{project_id}/rectifications/{rect_id}/photos")
async def upload_rectification_photo(project_id: str, rect_id: str, file: UploadFile = File(...), photo_type: str = "before"):
    projects = load_projects()
    project = next((p for p in projects if p.id == project_id), None)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    rect = next((r for r in project.rectification_records if r.id == rect_id), None)
    if not rect:
        raise HTTPException(status_code=404, detail="整改记录不存在")
    
    filename = f"{project_id}_{rect_id}_{photo_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    if photo_type == "before":
        rect.before_photos.append(filename)
    else:
        rect.after_photos.append(filename)
    
    save_projects(projects)
    
    return {"message": "照片上传成功", "filename": filename}

@app.put("/api/projects/{project_id}/rectifications/{rect_id}")
async def update_rectification(project_id: str, rect_id: str, status: str):
    projects = load_projects()
    project = next((p for p in projects if p.id == project_id), None)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    rect = next((r for r in project.rectification_records if r.id == rect_id), None)
    if not rect:
        raise HTTPException(status_code=404, detail="整改记录不存在")
    
    rect.status = status
    
    if all(r.status == "completed" for r in project.rectification_records):
        project.status = "pending_visit"
    
    save_projects(projects)
    
    return {"message": "整改状态已更新"}

@app.post("/api/projects/{project_id}/visits")
async def add_visit(project_id: str, result: str, remarks: str = "", signature: Optional[str] = None):
    projects = load_projects()
    project = next((p for p in projects if p.id == project_id), None)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    visit = VisitRecord(
        id=f"VT{len(project.visit_records)+1:03d}",
        visit_date=datetime.now().strftime("%Y-%m-%d"),
        result=result,
        customer_signature=signature,
        remarks=remarks
    )
    project.visit_records.append(visit)
    project.status = "completed" if "通过" in result else "rectifying"
    save_projects(projects)
    
    return {"message": "回访记录已添加", "visit": visit}

app.mount("/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)