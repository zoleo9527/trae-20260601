from fastapi import FastAPI
from app.routers import guide, doctor, reviewer, common

app = FastAPI(
    title="体检中心-异常指标与复查建议系统",
    description="按角色分离接口：导检人员、科室医生、报告审核员，覆盖体检记录、异常指标、复查建议、通知状态和报告发放",
    version="1.0.0"
)

app.include_router(guide.router)
app.include_router(doctor.router)
app.include_router(reviewer.router)
app.include_router(common.router)


@app.get("/", summary="系统概览")
def root():
    return {
        "system": "体检中心-异常指标与复查建议系统",
        "roles": {
            "guide": "/api/guide/ - 前台导检：补检管理、通知发送",
            "doctor": "/api/doctor/ - 科室医生：异常指标、复查建议",
            "reviewer": "/api/reviewer/ - 报告审核员：报告审核与发放"
        },
        "common": "/api/ - 通用接口：患者、体检记录、通知查询",
        "docs": "/docs"
    }
