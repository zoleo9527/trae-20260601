package models

import (
	"time"

	"gorm.io/gorm"
)

// 借款申请状态
type LoanStatus string

const (
	LoanStatusPending       LoanStatus = "pending"        // 待提交资料
	LoanStatusCollecting    LoanStatus = "collecting"    // 资料收集中
	LoanStatusRiskAuditing  LoanStatus = "risk_auditing" // 风控审核中
	LoanStatusApproved      LoanStatus = "approved"      // 已通过
	LoanStatusRejected      LoanStatus = "rejected"      // 已拒绝
	LoanStatusDisbursed     LoanStatus = "disbursed"     // 已放款
	LoanStatusOverdue       LoanStatus = "overdue"       // 已逾期
	LoanStatusExtension     LoanStatus = "extension"     // 展期中
	LoanStatusSettled       LoanStatus = "settled"       // 已结清
)

// 资料类型
type DocumentType string

const (
	DocumentTypeIDCard       DocumentType = "id_card"        // 身份证
	DocumentTypeIncomeProof  DocumentType = "income_proof"   // 收入证明
	DocumentTypeBankStatement DocumentType = "bank_statement" // 银行流水
	DocumentTypeCreditReport DocumentType = "credit_report" // 征信报告
	DocumentTypeOther        DocumentType = "other"          // 其他资料
)

// 资料审核状态
type DocumentAuditStatus string

const (
	DocumentStatusPending  DocumentAuditStatus = "pending"  // 待审核
	DocumentStatusApproved DocumentAuditStatus = "approved" // 已通过
	DocumentStatusRejected DocumentAuditStatus = "rejected" // 已拒绝
	DocumentStatusForged  DocumentAuditStatus = "forged"  // 造假
)

// 预警类型
type WarningType string

const (
	WarningTypeForgery       WarningType = "forgery"        // 资料造假
	WarningTypeOverdueRemind WarningType = "overdue_remind" // 逾期提醒失效
	WarningTypeExtension     WarningType = "extension"      // 展期口径不统一
)

// 预警处理状态
type WarningStatus string

const (
	WarningStatusPending  WarningStatus = "pending"  // 待处理
	WarningStatusProcessing WarningStatus = "processing" // 处理中
	WarningStatusResolved WarningStatus = "resolved" // 已解决
	WarningStatusIgnored  WarningStatus = "ignored"  // 已忽略
)

// 角色类型
type RoleType string

const (
	RoleTypeCustomerManager RoleType = "customer_manager" // 客户经理
	RoleTypeRiskAuditor    RoleType = "risk_auditor"    // 风控审核
	RoleTypePostLoanOfficer RoleType = "post_loan_officer" // 贷后专员
)

// 节点标识常量
const (
	NodeRiskAuditing  = "RISK_AUDITING_NODE" // 风控审核节点标识
)

// 借款申请
type LoanApplication struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	ApplicationNo   string         `gorm:"uniqueIndex;size:50;not null" json:"application_no"` // 申请编号
	CustomerID      string         `gorm:"size:50;not null" json:"customer_id"`                 // 客户ID
	CustomerName    string         `gorm:"size:100;not null" json:"customer_name"`              // 客户姓名
	LoanAmount      float64        `gorm:"not null" json:"loan_amount"`                        // 借款金额
	LoanTerm        int            `gorm:"not null" json:"loan_term"`                          // 借款期限（月）
	InterestRate    float64        `gorm:"not null" json:"interest_rate"`                      // 利率（月）
	Status          LoanStatus     `gorm:"size:20;default:pending" json:"status"`              // 当前状态
	StatusUpdatedAt time.Time      `gorm:"not null" json:"status_updated_at"`                   // 状态更新时间
	CurrentHandler  string         `gorm:"size:50" json:"current_handler"`                      // 当前责任人
	Remark          string         `gorm:"type:text" json:"remark"`                            // 备注
	DisbursedAt     *time.Time     `json:"disbursed_at"`                                        // 放款时间
	DueDate         *time.Time     `json:"due_date"`                                           // 到期日期
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	CreatedBy       string         `gorm:"size:50" json:"created_by"` // 创建人
	UpdatedBy       string         `gorm:"size:50" json:"updated_by"` // 更新人
}

// 资料收集
type DocumentCollection struct {
	ID              uint                `gorm:"primaryKey" json:"id"`
	LoanApplicationID uint              `gorm:"not null;index" json:"loan_application_id"` // 借款申请ID
	DocumentType    DocumentType        `gorm:"size:50;not null" json:"document_type"`     // 资料类型
	DocumentURL     string              `gorm:"size:500" json:"document_url"`               // 资料URL
	UploadTime      time.Time           `gorm:"not null" json:"upload_time"`                // 上传时间
	UploadedBy      string              `gorm:"size:50;not null" json:"uploaded_by"`        // 上传人
	IsForged        bool                `gorm:"default:false" json:"is_forged"`             // 是否造假
	ForgeryReason   string              `gorm:"type:text" json:"forgery_reason"`             // 造假说明
	AuditStatus     DocumentAuditStatus `gorm:"size:20;default:pending" json:"audit_status"` // 审核状态
	AuditedBy       string              `gorm:"size:50" json:"audited_by"`                  // 审核人
	AuditedAt       *time.Time          `json:"audited_at"`                                  // 审核时间
	Remark          string              `gorm:"type:text" json:"remark"`                     // 备注
	CreatedAt       time.Time           `json:"created_at"`
	UpdatedAt       time.Time           `json:"updated_at"`
}

// 风控审核记录
type RiskAudit struct {
	ID                  uint      `gorm:"primaryKey" json:"id"`
	LoanApplicationID   uint      `gorm:"not null;index" json:"loan_application_id"` // 借款申请ID
	RiskScore           float64   `gorm:"not null" json:"risk_score"`                // 风控评分
	RiskConclusion      string    `gorm:"type:text;not null" json:"risk_conclusion"` // 风控结论
	RiskSuggestion      string    `gorm:"type:text" json:"risk_suggestion"`          // 风控建议
	AuditorID           string    `gorm:"size:50;not null" json:"auditor_id"`        // 审核人ID
	AuditTime           time.Time `gorm:"not null" json:"audit_time"`                // 审核时间
	IsForgery           bool      `gorm:"default:false" json:"is_forgery"`           // 是否发现造假
	ForgeryDescription  string    `gorm:"type:text" json:"forgery_description"`      // 造假说明
	Remark              string    `gorm:"type:text" json:"remark"`                  // 备注
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

// 催收记录
type CollectionRecord struct {
	ID                  uint      `gorm:"primaryKey" json:"id"`
	LoanApplicationID   uint      `gorm:"not null;index" json:"loan_application_id"` // 借款申请ID
	CollectionMethod    string    `gorm:"size:50;not null" json:"collection_method"` // 催收方式
	CollectionTime      time.Time `gorm:"not null" json:"collection_time"`           // 催收时间
	CollectionOfficerID  string    `gorm:"size:50;not null" json:"collection_officer_id"` // 催收人员ID
	CollectionResult    string    `gorm:"type:text" json:"collection_result"`       // 催收结果
	Remark              string    `gorm:"type:text" json:"remark"`                   // 备注
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

// 展期记录
type ExtensionRecord struct {
	ID                  uint      `gorm:"primaryKey" json:"id"`
	LoanApplicationID   uint      `gorm:"not null;index" json:"loan_application_id"` // 借款申请ID
	ExtensionReason    string    `gorm:"type:text;not null" json:"extension_reason"` // 展期原因
	OriginalDueDate    time.Time `gorm:"not null" json:"original_due_date"`         // 原到期日期
	NewDueDate         time.Time `gorm:"not null" json:"new_due_date"`             // 新到期日期
	ExtensionAmount    float64   `gorm:"default:0" json:"extension_amount"`        // 展期金额
	ExtensionRate      float64   `gorm:"default:0" json:"extension_rate"`           // 展期利率
	ApplicantID        string    `gorm:"size:50;not null" json:"applicant_id"`      // 申请人
	ApprovalStatus     string    `gorm:"size:20;default:pending" json:"approval_status"` // 审批状态
	ApprovedBy         string    `gorm:"size:50" json:"approved_by"`              // 审批人
	ApprovedAt         *time.Time `json:"approved_at"`                             // 审批时间
	Remark             string    `gorm:"type:text" json:"remark"`                 // 备注
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// 预警记录
type WarningRecord struct {
	ID                  uint          `gorm:"primaryKey" json:"id"`
	LoanApplicationID   uint          `gorm:"index" json:"loan_application_id"`       // 借款申请ID
	WarningType         WarningType   `gorm:"size:50;not null" json:"warning_type"`   // 预警类型
	WarningContent      string        `gorm:"type:text;not null" json:"warning_content"` // 预警内容
	WarningTime         time.Time     `gorm:"not null" json:"warning_time"`           // 预警时间
	Status              WarningStatus `gorm:"size:20;default:pending" json:"status"`   // 处理状态
	HandlerID           string        `gorm:"size:50" json:"handler_id"`              // 处理人
	HandledAt           *time.Time    `json:"handled_at"`                             // 处理时间
	Remark              string        `gorm:"type:text" json:"remark"`                // 备注
	CreatedAt           time.Time     `json:"created_at"`
	UpdatedAt           time.Time     `json:"updated_at"`
}

// 审计日志
type AuditLog struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	OperationType   string    `gorm:"size:50;not null" json:"operation_type"`    // 操作类型
	OperatorID      string    `gorm:"size:50;not null" json:"operator_id"`       // 操作人ID
	OperatorRole    RoleType  `gorm:"size:30" json:"operator_role"`             // 操作人角色
	LoanApplicationID *uint   `gorm:"index" json:"loan_application_id"`         // 关联借款申请ID
	OperationDesc   string    `gorm:"type:text;not null" json:"operation_desc"` // 操作描述
	BeforeData      string    `gorm:"type:json" json:"before_data"`             // 操作前数据
	AfterData       string    `gorm:"type:json" json:"after_data"`              // 操作后数据
	IPAddress       string    `gorm:"size:50" json:"ip_address"`                // IP地址
	UserAgent       string    `gorm:"size:500" json:"user_agent"`               // 用户代理
	CreatedAt       time.Time `json:"created_at"`
}

// 状态历史记录
type StatusHistory struct {
	ID                  uint      `gorm:"primaryKey" json:"id"`
	LoanApplicationID   uint      `gorm:"not null;index" json:"loan_application_id"` // 借款申请ID
	FromStatus          string    `gorm:"size:50" json:"from_status"`               // 原状态
	ToStatus            string    `gorm:"size:50;not null" json:"to_status"`        // 新状态
	ChangedBy           string    `gorm:"size:50;not null" json:"changed_by"`       // 变更人
	ChangedAt           time.Time `gorm:"not null" json:"changed_at"`               // 变更时间
	Remark              string    `gorm:"type:text" json:"remark"`                   // 备注
	CreatedAt           time.Time `json:"created_at"`
}
