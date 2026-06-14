package main

import (
	"time"
)

type Role string

const (
	RoleClerk    Role = "clerk"    // 受理员
	RoleExpert   Role = "expert"   // 鉴定人
	RoleQC       Role = "qc"       // 质控审核
)

type User struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Name     string `json:"name"`
	Role     Role   `json:"role"`
	Account  string `gorm:"unique" json:"account"`
}

type CaseStatus string

const (
	StatusPendingAccept   CaseStatus = "pending_accept"   // 待受理排期
	StatusScheduled       CaseStatus = "scheduled"        // 已排期待鉴定
	StatusInProgress      CaseStatus = "in_progress"      // 鉴定中
	StatusNeedSupplement  CaseStatus = "need_supplement"  // 需补样（退回受理端）
	StatusSupplied        CaseStatus = "supplied"         // 已补样待重排
	StatusPendingQC       CaseStatus = "pending_qc"       // 待质控审核
	StatusArchived        CaseStatus = "archived"         // 已归档
	StatusRejectedQC      CaseStatus = "rejected_qc"      // 质控退回
)

type TodoRoleRule struct {
	Status CaseStatus
	Roles  []Role
	Hint   string
}

var TodoRules = []TodoRoleRule{
	{StatusPendingAccept,   []Role{RoleClerk},  "待排期"},
	{StatusScheduled,       []Role{RoleExpert}, "待开始鉴定"},
	{StatusInProgress,      []Role{RoleExpert}, "鉴定中"},
	{StatusNeedSupplement,  []Role{RoleClerk},  "待处理补样通知"},
	{StatusSupplied,        []Role{RoleClerk},  "补样完成待重排期"},
	{StatusPendingQC,       []Role{RoleQC},     "待质控审核"},
	{StatusRejectedQC,      []Role{RoleExpert}, "质控退回待修改"},
}

type ResponsibilityRule struct {
	Status              CaseStatus
	ResponsibleRole     Role
	ResponsibleRoleText string
	NextAction          string
}

var ResponsibilityRules = []ResponsibilityRule{
	{
		Status:              StatusPendingAccept,
		ResponsibleRole:     RoleClerk,
		ResponsibleRoleText: "受理员",
		NextAction:          "完成受理排期，指定鉴定人并排定鉴定日期",
	},
	{
		Status:              StatusScheduled,
		ResponsibleRole:     RoleExpert,
		ResponsibleRoleText: "鉴定人",
		NextAction:          "按排期开始鉴定，重点关注承接备注中提示的注意事项",
	},
	{
		Status:              StatusInProgress,
		ResponsibleRole:     RoleExpert,
		ResponsibleRoleText: "鉴定人",
		NextAction:          "完成鉴定并提交质控审核；如遇材料/样本不足，发起补样通知退回受理端",
	},
	{
		Status:              StatusNeedSupplement,
		ResponsibleRole:     RoleClerk,
		ResponsibleRoleText: "受理员",
		NextAction:          "查看补样通知，联系委托方在期限内补充缺少的材料/样本",
	},
	{
		Status:              StatusSupplied,
		ResponsibleRole:     RoleClerk,
		ResponsibleRoleText: "受理员",
		NextAction:          "补样已收齐，进行重排期并重新指定鉴定人",
	},
	{
		Status:              StatusPendingQC,
		ResponsibleRole:     RoleQC,
		ResponsibleRoleText: "质控审核",
		NextAction:          "审核鉴定意见书与鉴定过程，通过则归档，不通过则注明退回原因",
	},
	{
		Status:              StatusRejectedQC,
		ResponsibleRole:     RoleExpert,
		ResponsibleRoleText: "鉴定人",
		NextAction:          "根据质控退回原因修改鉴定意见书，修改完成后重新提交质控",
	},
	{
		Status:              StatusArchived,
		ResponsibleRole:     "",
		ResponsibleRoleText: "已归档",
		NextAction:          "案件已完成归档，可查看详情与意见书",
	},
}

type ResponsibilitySummary struct {
	CurrentResponsibleRole     string `json:"current_responsible_role"`
	CurrentResponsibleRoleText string `json:"current_responsible_role_text"`
	CurrentResponsibleName     string `json:"current_responsible_name"`
	NextAction                 string `json:"next_action"`
	LatestRejectReason         string `json:"latest_reject_reason"`
	LatestRejectAt             string `json:"latest_reject_at"`
	LatestRejectOperator       string `json:"latest_reject_operator"`
	LatestSupplementSummary    string `json:"latest_supplement_summary"`
	LatestSupplementNoticeNo   string `json:"latest_supplement_notice_no"`
	LatestSupplementDeadline   string `json:"latest_supplement_deadline"`
	LatestSupplementStatus     string `json:"latest_supplement_status"`
}

func GetResponsibilityRule(status CaseStatus) *ResponsibilityRule {
	for _, r := range ResponsibilityRules {
		if r.Status == status {
			return &r
		}
	}
	return nil
}

type AppraisalRecord struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	CaseNo          string     `gorm:"unique" json:"case_no"`            // 案件编号：如 SFJD-2026-001
	EntrustDept     string     `json:"entrust_dept"`                     // 委托单位
	EntrustDate     string     `json:"entrust_date"`                     // 委托书日期
	EntrustItem     string     `json:"entrust_item"`                     // 委托鉴定事项
	ClientName      string     `json:"client_name"`                      // 当事人
	AcceptClerkID   *uint      `json:"accept_clerk_id"`                  // 受理员ID
	ExpertID        *uint      `json:"expert_id"`                        // 鉴定人ID
	QcID            *uint      `json:"qc_id"`                            // 质控ID
	Status          CaseStatus `gorm:"index" json:"status"`              // 当前状态
	RejectReason    string     `json:"reject_reason"`                    // 退回原因（质控退回/鉴定退回）
	CurrentComment  string     `json:"current_comment"`                  // 承接上一步的备注（当前页显示的延续备注）
	SampleReceived  bool       `json:"sample_received"`                  // 原始样本是否已收
	OpinionDraft    string     `json:"opinion_draft"`                    // 鉴定意见书草稿
	OpinionFinal    string     `json:"opinion_final"`                    // 鉴定意见书定稿
	ArchiveNo       string     `json:"archive_no"`                       // 归档号
	ArchiveDate     *string    `json:"archive_date"`                     // 归档日期
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`

	Schedules         []ScheduleRecord    `gorm:"foreignKey:RecordID" json:"schedules,omitempty"`
	SupplementNotices []SupplementNotice  `gorm:"foreignKey:RecordID" json:"supplement_notices,omitempty"`
	StatusLogs        []StatusLog         `gorm:"foreignKey:RecordID" json:"status_logs,omitempty"`
	CommentLogs       []CommentLog        `gorm:"foreignKey:RecordID" json:"comment_logs,omitempty"`

	AcceptClerk *User `gorm:"foreignKey:AcceptClerkID" json:"accept_clerk,omitempty"`
	Expert      *User `gorm:"foreignKey:ExpertID" json:"expert,omitempty"`
	QC          *User `gorm:"foreignKey:QcID" json:"qc,omitempty"`
}

type ScheduleRecord struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	RecordID      uint      `gorm:"index" json:"record_id"`
	ScheduleDate  string    `json:"schedule_date"`              // 排期日期
	ScheduleRemark string   `json:"schedule_remark"`            // 排期备注（继续传下去的关键备注）
	AssignedExpertID *uint  `json:"assigned_expert_id"`         // 指定鉴定人
	IsReSchedule  bool      `json:"is_re_schedule"`             // 是否为重排期（补样后）
	CreatedBy     uint      `json:"created_by"`                 // 操作人（受理员）
	CreatedAt     time.Time `json:"created_at"`

	AssignedExpert *User `gorm:"foreignKey:AssignedExpertID" json:"assigned_expert,omitempty"`
	Creator        *User `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
}

type SupplementNotice struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	RecordID        uint      `gorm:"index" json:"record_id"`
	NoticeNo        string    `gorm:"unique" json:"notice_no"`       // 补样通知编号
	IssueDate       string    `json:"issue_date"`                     // 通知日期
	Deadline        string    `json:"deadline"`                       // 补样期限
	MissingItems    string    `json:"missing_items"`                  // 缺少材料/样本明细
	CarryOnRemark   string    `json:"carry_on_remark"`                // 承接排期的备注（关键！把排期备注带过来）
	ExpertComment   string    `json:"expert_comment"`                 // 鉴定人补充说明
	IssuedBy        uint      `json:"issued_by"`                      // 鉴定人
	Status          string    `json:"status"`                         // pending / supplied / overdue
	ReplenishRemark string    `json:"replenish_remark"`               // 受理端补样备注
	ReplenishedBy   *uint     `json:"replenished_by"`                 // 受理员
	ReplenishedAt   *string   `json:"replenished_at"`                 // 补样完成时间
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	Issuer      *User `gorm:"foreignKey:IssuedBy" json:"issuer,omitempty"`
	Replenisher *User `gorm:"foreignKey:ReplenishedBy" json:"replenisher,omitempty"`
}

type StatusLog struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	RecordID    uint      `gorm:"index" json:"record_id"`
	FromStatus  CaseStatus `json:"from_status"`
	ToStatus    CaseStatus `json:"to_status"`
	Reason      string     `json:"reason"`
	OperatorID  uint       `json:"operator_id"`
	CreatedAt   time.Time  `json:"created_at"`

	Operator *User `gorm:"foreignKey:OperatorID" json:"operator,omitempty"`
}

type CommentLog struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	RecordID    uint      `gorm:"index" json:"record_id"`
	FromStep    string    `json:"from_step"`   // schedule / supplement / expert / qc
	Content     string    `json:"content"`     // 备注内容
	CarryToNext bool      `json:"carry_to_next"` // 是否传下一步（默认true）
	OperatorID  uint      `json:"operator_id"`
	CreatedAt   time.Time `json:"created_at"`

	Operator *User `gorm:"foreignKey:OperatorID" json:"operator,omitempty"`
}
