package main

import (
	"fmt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"os"
)

var DB *gorm.DB

func InitDB() error {
	dbPath := "./appraisal.db"
	_ = os.Remove(dbPath)

	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		return err
	}

	err = db.AutoMigrate(
		&User{},
		&AppraisalRecord{},
		&ScheduleRecord{},
		&SupplementNotice{},
		&StatusLog{},
		&CommentLog{},
	)
	if err != nil {
		return err
	}

	DB = db
	seedData()
	return nil
}

func seedData() {
	clerk := User{Name: "李受理", Role: RoleClerk, Account: "clerk_li"}
	expert1 := User{Name: "张鉴定", Role: RoleExpert, Account: "expert_zhang"}
	expert2 := User{Name: "王法医", Role: RoleExpert, Account: "expert_wang"}
	qc := User{Name: "赵质控", Role: RoleQC, Account: "qc_zhao"}
	DB.Create(&clerk)
	DB.Create(&expert1)
	DB.Create(&expert2)
	DB.Create(&qc)

	seedSmoothFlow(clerk.ID, expert1.ID, qc.ID)
	seedProblemFlow(clerk.ID, expert1.ID, qc.ID)
	seedArchivedFlow(clerk.ID, expert2.ID, qc.ID)
}

func nowStr() string {
	return "2026-06-14 10:00:00"
}

func addStatusLog(db *gorm.DB, recordID uint, from, to CaseStatus, reason string, opID uint) {
	db.Create(&StatusLog{
		RecordID:   recordID,
		FromStatus: from,
		ToStatus:   to,
		Reason:     reason,
		OperatorID: opID,
	})
}

func addComment(db *gorm.DB, recordID uint, step, content string, carry bool, opID uint) {
	db.Create(&CommentLog{
		RecordID:    recordID,
		FromStep:    step,
		Content:     content,
		CarryToNext: carry,
		OperatorID:  opID,
	})
}

func seedSmoothFlow(clerkID, expertID, qcID uint) {
	rec := AppraisalRecord{
		CaseNo:        "SFJD-2026-0101",
		EntrustDept:   "XX区人民法院",
		EntrustDate:   "2026-06-10",
		EntrustItem:   "笔迹同一性鉴定（检材落款处签名）",
		ClientName:    "陈某某",
		AcceptClerkID: &clerkID,
		ExpertID:      &expertID,
		QcID:          &qcID,
		Status:        StatusPendingQC,
		RejectReason:  "",
		CurrentComment: "检材为原件，需注意比对样本数量有限，鉴定时关注签名动态特征",
		SampleReceived: true,
		OpinionDraft:  "检材落款\"陈某某\"签名与样本1-5中\"陈某某\"签名为同一人书写习惯",
		OpinionFinal:  "",
		ArchiveNo:     "",
	}
	DB.Create(&rec)

	DB.Create(&ScheduleRecord{
		RecordID:         rec.ID,
		ScheduleDate:     "2026-06-15",
		ScheduleRemark:   "检材为原件，需注意比对样本数量有限，鉴定时关注签名动态特征",
		AssignedExpertID: &expertID,
		IsReSchedule:     false,
		CreatedBy:        clerkID,
	})
	addComment(DB, rec.ID, "schedule", "检材为原件，需注意比对样本数量有限，鉴定时关注签名动态特征", true, clerkID)
	addStatusLog(DB, rec.ID, StatusPendingAccept, StatusScheduled, "受理排期完成", clerkID)

	addStatusLog(DB, rec.ID, StatusScheduled, StatusInProgress, "鉴定人开始鉴定", expertID)
	addComment(DB, rec.ID, "expert", "已提取12个特征点，吻合点充分", true, expertID)

	addStatusLog(DB, rec.ID, StatusInProgress, StatusPendingQC, "鉴定完成提交质控", expertID)
}

func seedProblemFlow(clerkID, expertID, qcID uint) {
	rec := AppraisalRecord{
		CaseNo:        "SFJD-2026-0102",
		EntrustDept:   "XX律师事务所",
		EntrustDate:   "2026-06-11",
		EntrustItem:   "指印同一性鉴定（合同落款处指印）",
		ClientName:    "刘某",
		AcceptClerkID: &clerkID,
		ExpertID:      &expertID,
		QcID:          &qcID,
		Status:        StatusNeedSupplement,
		RejectReason:  "比对指印样本不足，且检材指印存在重叠模糊",
		CurrentComment: "样本仅3枚，建议补充右手十指指印样本；检材左下区域有墨迹污染，注意处理",
		SampleReceived: true,
		OpinionDraft:  "",
		OpinionFinal:  "",
	}
	DB.Create(&rec)

	DB.Create(&ScheduleRecord{
		RecordID:         rec.ID,
		ScheduleDate:     "2026-06-14",
		ScheduleRemark:   "样本仅3枚，建议补充右手十指指印样本；检材左下区域有墨迹污染，注意处理",
		AssignedExpertID: &expertID,
		IsReSchedule:     false,
		CreatedBy:        clerkID,
	})
	addComment(DB, rec.ID, "schedule", "样本仅3枚，建议补充右手十指指印样本；检材左下区域有墨迹污染，注意处理", true, clerkID)
	addStatusLog(DB, rec.ID, StatusPendingAccept, StatusScheduled, "受理排期完成", clerkID)

	addStatusLog(DB, rec.ID, StatusScheduled, StatusInProgress, "鉴定人开始鉴定", expertID)

	notice := SupplementNotice{
		RecordID:      rec.ID,
		NoticeNo:      "BY-2026-0102-01",
		IssueDate:     "2026-06-14",
		Deadline:      "2026-06-21",
		MissingItems:  "1.被鉴定人右手十指三面捺印指印样本（原件，需3份以上）\n2.补充同期日常书写签名样本5-10份\n3.请提供检材文件完整原件复制品",
		CarryOnRemark: "样本仅3枚，建议补充右手十指指印样本；检材左下区域有墨迹污染，注意处理",
		ExpertComment: "鉴定中发现样本量不足支撑结论，检材指印细节特征暴露不充分。承接受理端排期备注提示，再次强调：如补充不到位将出具不予受理说明。",
		IssuedBy:      expertID,
		Status:        "pending",
	}
	DB.Create(&notice)
	addComment(DB, rec.ID, "supplement", "鉴定中发现样本量不足支撑结论，检材指印细节特征暴露不充分。如补充不到位将出具不予受理说明。", true, expertID)

	DB.Model(&rec).Update("RejectReason", "比对指印样本不足，且检材指印存在重叠模糊")
	addStatusLog(DB, rec.ID, StatusInProgress, StatusNeedSupplement, "样本不足退回补样", expertID)
}

func seedArchivedFlow(clerkID, expertID, qcID uint) {
	archiveDate := "2026-06-10"
	rec := AppraisalRecord{
		CaseNo:        "SFJD-2026-0050",
		EntrustDept:   "XX市公安局交通警察支队",
		EntrustDate:   "2026-05-28",
		EntrustItem:   "车辆碰撞痕迹与车速鉴定",
		ClientName:    "周某某",
		AcceptClerkID: &clerkID,
		ExpertID:      &expertID,
		QcID:          &qcID,
		Status:        StatusArchived,
		RejectReason:  "",
		CurrentComment: "已归档，卷宗完整",
		SampleReceived: true,
		OpinionDraft:  "1.被检车辆A前部碰撞痕迹与车辆B左后部碰撞痕迹吻合\n2.碰撞时车辆A行驶速度约为58-62km/h",
		OpinionFinal:  "1.被检车辆A前部碰撞痕迹与车辆B左后部碰撞痕迹吻合\n2.碰撞时车辆A行驶速度约为58-62km/h",
		ArchiveNo:     "GD-2026-0050",
		ArchiveDate:   &archiveDate,
	}
	DB.Create(&rec)

	DB.Create(&ScheduleRecord{
		RecordID:         rec.ID,
		ScheduleDate:     "2026-06-01",
		ScheduleRemark:   "现场照片清晰，需重点核对制动拖印长度与视频帧间隔",
		AssignedExpertID: &expertID,
		IsReSchedule:     false,
		CreatedBy:        clerkID,
	})
	addComment(DB, rec.ID, "schedule", "现场照片清晰，需重点核对制动拖印长度与视频帧间隔", true, clerkID)
	addStatusLog(DB, rec.ID, StatusPendingAccept, StatusScheduled, "受理排期完成", clerkID)

	addStatusLog(DB, rec.ID, StatusScheduled, StatusInProgress, "鉴定人开始鉴定", expertID)
	addComment(DB, rec.ID, "expert", "视频分析已完成，帧间隔计算车速约60km/h，与制动拖印公式计算结果吻合", true, expertID)

	addStatusLog(DB, rec.ID, StatusInProgress, StatusPendingQC, "鉴定完成提交质控", expertID)
	addComment(DB, rec.ID, "qc", "公式引用规范，结果区间合理，同意出具", true, qcID)

	addStatusLog(DB, rec.ID, StatusPendingQC, StatusArchived, "质控通过，意见书已出具并归档", qcID)

	DB.Model(&rec).Updates(map[string]interface{}{
		"ArchiveNo":   "GD-2026-0050",
		"ArchiveDate": &archiveDate,
	})
	fmt.Printf("  > 种子数据写入完成：顺利流=%s，问题流=%s，归档流=%s\n",
		"SFJD-2026-0101", "SFJD-2026-0102", "SFJD-2026-0050")
}
