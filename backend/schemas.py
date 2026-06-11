from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class UserBase(BaseModel):
    username: str
    name: str
    role: str
    floor: Optional[str] = None
    brand: Optional[str] = None


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AllocationChangeLogResponse(BaseModel):
    id: int
    allocation_id: int
    field_name: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    change_reason: Optional[str] = None
    operated_by: int
    operator_name: Optional[str] = None
    operated_at: datetime

    class Config:
        from_attributes = True


class GoodsAllocationBase(BaseModel):
    from_counter: str
    to_counter: str
    brand: str
    floor: str
    goods_code: str
    goods_name: str
    sku: Optional[str] = None
    quantity: int
    unit: str = "件"
    remark: Optional[str] = None
    history_remark: Optional[str] = None


class GoodsAllocationCreate(GoodsAllocationBase):
    idempotent_key: str = Field(..., description="幂等键，客户端生成UUID")


class GoodsAllocationUpdate(BaseModel):
    from_counter: Optional[str] = None
    to_counter: Optional[str] = None
    goods_code: Optional[str] = None
    goods_name: Optional[str] = None
    sku: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    remark: Optional[str] = None
    history_remark: Optional[str] = None
    change_reason: str = Field(..., description="修改原因，必填")
    version: int = Field(..., description="当前版本号，用于乐观锁")


class GoodsAllocationResponse(GoodsAllocationBase):
    id: int
    allocation_no: str
    idempotent_key: str
    status: str
    version: int
    is_modified: bool
    last_modified_at: Optional[datetime] = None
    created_by: int
    updated_by: Optional[int] = None
    creator_name: Optional[str] = None
    updater_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    change_logs: List[AllocationChangeLogResponse] = []
    reviews: List["CabinetReviewResponse"] = []
    verifications: List["DisputeVerificationResponse"] = []

    class Config:
        from_attributes = True


class CabinetReviewBase(BaseModel):
    allocation_id: int
    actual_quantity: int
    difference_reason: Optional[str] = None
    modification_acknowledged: bool = False


class CabinetReviewCreate(CabinetReviewBase):
    pass


class CabinetReviewResponse(BaseModel):
    id: int
    allocation_id: int
    review_no: str
    actual_quantity: Optional[int] = None
    review_status: str
    difference_reason: Optional[str] = None
    has_allocation_modified: bool
    modification_acknowledged: bool
    reviewed_by: int
    reviewer_name: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DisputeVerificationCreate(BaseModel):
    allocation_id: int
    conclusion: str = Field(..., description="核实结论: sender_short(发货方少装) / receiver_false(收货方误报)")
    responsibility: str = Field(..., description="责任归属描述，必填")
    processing_remark: Optional[str] = Field(None, description="处理备注")


class DisputeVerificationResponse(BaseModel):
    id: int
    allocation_id: int
    verification_no: str
    conclusion: str
    responsibility: str
    processing_remark: Optional[str] = None
    verified_by: int
    verifier_name: Optional[str] = None
    verified_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


GoodsAllocationResponse.model_rebuild()


class ReviewTimelineItem(BaseModel):
    allocation_id: int
    allocation_no: str
    goods_name: str
    goods_code: str
    expected_quantity: int
    actual_quantity: Optional[int] = None
    allocation_status: str
    review_status: str
    is_modified: bool
    has_allocation_modified: bool
    modification_acknowledged: bool
    last_modified_at: Optional[datetime] = None
    modified_by: Optional[str] = None
    change_count: int = 0
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    verification_conclusion: Optional[str] = None
    verification_responsibility: Optional[str] = None
    verified_by_name: Optional[str] = None
    verified_at: Optional[datetime] = None


class ApiResponse(BaseModel):
    code: int = 0
    message: str = "success"
    data: Optional[dict] = None
