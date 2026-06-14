package main

import (
	"fmt"
	"microloan-api/models"
	"time"
)

func SeedData() error {
	var count int64
	DB.Model(&models.Loan{}).Count(&count)
	if count > 0 {
		fmt.Println("Seed data already exists, skipping.")
		return nil
	}

	now := time.Now()

	loanLost := models.Loan{
		LoanNo:            "LN202603001",
		CustomerName:      "张三",
		CustomerIDCard:    "330100199001011234",
		CustomerPhone:     "13800000001",
		PrincipalAmount:   50000,
		InterestRate:      0.12,
		TermMonths:        12,
		StartDate:         now.AddDate(0, -5, 0),
		EndDate:           now.AddDate(0, 7, 0),
		Status:            models.LoanStatusOverdue,
		TotalRepaid:       0,
		OutstandingAmount: 50000,
		OverdueDays:       45,
	}
	DB.Create(&loanLost)
	seedRepaymentPlans(&loanLost, now)

	DB.Create(&models.CollectionRecord{
		LoanID:           loanLost.ID,
		CollectorName:    "李经理",
		CollectorRole:    models.RoleManager,
		CollectionType:   models.CollectionTypePhone,
		CollectionTime:   now.AddDate(0, 0, -30),
		ContactResult:    models.ContactResultLost,
		OverdueReason:    "电话多次无人接听，无法联系到借款人本人及家人",
		HasExtensionHint: false,
		Remark:           "已拨打预留手机号3次，均无人接听；拨打紧急联系人2次，表示不知晓借款事宜",
	})
	DB.Create(&models.CollectionRecord{
		LoanID:           loanLost.ID,
		CollectorName:    "李经理",
		CollectorRole:    models.RoleManager,
		CollectionType:   models.CollectionTypeMessage,
		CollectionTime:   now.AddDate(0, 0, -20),
		ContactResult:    models.ContactResultLost,
		OverdueReason:    "短信无回复",
		HasExtensionHint: false,
		Remark:           "已发送催款短信至预留手机号，无任何回复",
	})
	DB.Create(&models.CollectionRecord{
		LoanID:           loanLost.ID,
		CollectorName:    "王催收",
		CollectorRole:    models.RoleCollector,
		CollectionType:   models.CollectionTypeVisit,
		CollectionTime:   now.AddDate(0, 0, -5),
		ContactResult:    models.ContactResultLost,
		OverdueReason:    "上门催收发现住址已搬迁，邻居称半年前已搬走",
		HasExtensionHint: false,
		Remark:           "已张贴催收公告于原住址，建议升级为失联案件处理",
	})
	DB.Create(&models.OperationLog{
		LoanID:    loanLost.ID,
		Operator:  "王催收",
		Role:      models.RoleCollector,
		Action:    "标记失联",
		Detail:    "经多次电话、短信、上门均无法联系借款人，标记为失联状态",
		IPAddress: "192.168.1.20",
	})

	loanPartial := models.Loan{
		LoanNo:            "LN202602005",
		CustomerName:      "李四",
		CustomerIDCard:    "330100198805155678",
		CustomerPhone:     "13800000002",
		PrincipalAmount:   80000,
		InterestRate:      0.10,
		TermMonths:        24,
		StartDate:         now.AddDate(0, -8, 0),
		EndDate:           now.AddDate(0, 16, 0),
		Status:            models.LoanStatusOverdue,
		TotalRepaid:       15000,
		OutstandingAmount: 65000,
		OverdueDays:       20,
	}
	DB.Create(&loanPartial)
	seedRepaymentPlans(&loanPartial, now)

	plan1 := models.RepaymentPlan{}
	DB.Model(&models.RepaymentPlan{}).Where("loan_id = ? AND period_no = ?", loanPartial.ID, 8).First(&plan1)
	DB.Model(&plan1).Updates(map[string]interface{}{
		"paid_amount":      1500,
		"status":           models.RepaymentStatusPartial,
		"overdue_days":     20,
		"actual_paid_date": now.AddDate(0, 0, -10),
	})

	DB.Create(&models.CollectionRecord{
		LoanID:           loanPartial.ID,
		CollectorName:    "李经理",
		CollectorRole:    models.RoleManager,
		CollectionType:   models.CollectionTypePhone,
		CollectionTime:   now.AddDate(0, 0, -18),
		ContactResult:    models.ContactResultConnected,
		OverdueReason:    "公司裁员后经营不善，临时资金周转困难",
		HasExtensionHint: false,
		Remark:           "客户态度良好，表示一周内先还部分",
	})
	DB.Create(&models.CollectionRecord{
		LoanID:           loanPartial.ID,
		CollectorName:    "李经理",
		CollectorRole:    models.RoleManager,
		CollectionType:   models.CollectionTypePhone,
		CollectionTime:   now.AddDate(0, 0, -10),
		ContactResult:    models.ContactResultPartialPaid,
		OverdueReason:    "客户仅筹集到1500元，承诺月底前补齐剩余款项",
		PromiseDate:      &[]time.Time{now.AddDate(0, 0, 10)}[0],
		PromiseAmount:    &[]float64{2000}[0],
		HasExtensionHint: false,
		Remark:           "已还款1500元，剩余2000元承诺本月底前偿还",
		SupplementFiles:  "银行流水截图_20260604.jpg",
	})
	DB.Create(&models.OperationLog{
		LoanID:    loanPartial.ID,
		Operator:  "李经理",
		Role:      models.RoleManager,
		Action:    "记录部分还款",
		Detail:    "客户偿还第8期部分款项1500元，尚欠2000元",
		IPAddress: "192.168.1.15",
	})

	loanRejected := models.Loan{
		LoanNo:            "LN202601012",
		CustomerName:      "王五",
		CustomerIDCard:    "330100199208209012",
		CustomerPhone:     "13800000003",
		PrincipalAmount:   100000,
		InterestRate:      0.09,
		TermMonths:        36,
		StartDate:         now.AddDate(0, -6, 0),
		EndDate:           now.AddDate(0, 30, 0),
		Status:            models.LoanStatusOverdue,
		TotalRepaid:       20000,
		OutstandingAmount: 80000,
		OverdueDays:       35,
	}
	DB.Create(&loanRejected)
	seedRepaymentPlans(&loanRejected, now)

	DB.Create(&models.CollectionRecord{
		LoanID:           loanRejected.ID,
		CollectorName:    "赵经理",
		CollectorRole:    models.RoleManager,
		CollectionType:   models.CollectionTypePhone,
		CollectionTime:   now.AddDate(0, 0, -35),
		ContactResult:    models.ContactResultConnected,
		OverdueReason:    "投资亏损，短期内无法偿还",
		HasExtensionHint: true,
		Remark:           "客户表示希望申请展期6个月",
	})
	DB.Create(&models.CollectionRecord{
		LoanID:           loanRejected.ID,
		CollectorName:    "赵经理",
		CollectorRole:    models.RoleManager,
		CollectionType:   models.CollectionTypeVisit,
		CollectionTime:   now.AddDate(0, 0, -30),
		ContactResult:    models.ContactResultConnected,
		OverdueReason:    "当面沟通，客户确有资金困难，已收集收入证明",
		HasExtensionHint: true,
		Remark:           "已收集客户工资流水、失业证明，准备提交展期申请",
		SupplementFiles:  "失业证明.pdf,工资流水_近6个月.pdf",
	})

	extApp1 := models.ExtensionApplication{
		LoanID:          loanRejected.ID,
		ApplicantName:   "赵经理",
		ApplicantRole:   models.RoleManager,
		ApplyTime:       now.AddDate(0, 0, -28),
		ExtensionMonths: 6,
		NewEndDate:      now.AddDate(0, 36, 0),
		Reason:          "借款人因投资亏损导致资金链断裂，目前已找到新工作但工资需延迟发放，申请展期6个月以缓解还款压力",
		SupplementFiles: "失业证明.pdf,工资流水_近6个月.pdf,新工作入职offer.pdf",
		Status:          models.ExtensionStatusRejected,
	}
	DB.Create(&extApp1)

	DB.Create(&models.ApprovalDecision{
		ExtensionAppID: extApp1.ID,
		ApproverName:   "陈风控",
		ApproverRole:   models.RoleRisk,
		DecisionTime:   now.AddDate(0, 0, -25),
		Decision:       models.ExtensionStatusRejected,
		RiskAssessment: "1. 借款人历史信用记录一般，此前已有2次逾期记录；2. 提供的新工作入职材料真实性存疑，入职公司为关联方；3. 展期申请缺乏有效担保人或抵押物；4. 综合评估后违约风险较高，建议按原催收流程处理",
		Remark:         "展期申请被拒，请客户经理继续按催收流程跟进，必要时考虑法律途径",
	})

	DB.Create(&models.OperationLog{
		LoanID:    loanRejected.ID,
		Operator:  "陈风控",
		Role:      models.RoleRisk,
		Action:    "展期审批-拒绝",
		Detail:    "展期申请ID:" + fmt.Sprintf("%d", extApp1.ID) + "，因风险评估不通过被拒绝",
		IPAddress: "192.168.1.30",
	})

	loanReOverdue := models.Loan{
		LoanNo:            "LN202512008",
		CustomerName:      "赵六",
		CustomerIDCard:    "330100198503123456",
		CustomerPhone:     "13800000004",
		PrincipalAmount:   200000,
		InterestRate:      0.08,
		TermMonths:        12,
		StartDate:         now.AddDate(0, -10, 0),
		EndDate:           now.AddDate(0, 2, 0),
		Status:            models.LoanStatusOverdue,
		TotalRepaid:       120000,
		OutstandingAmount: 80000,
		OverdueDays:       15,
	}
	DB.Create(&loanReOverdue)
	seedRepaymentPlans(&loanReOverdue, now)

	DB.Create(&models.CollectionRecord{
		LoanID:           loanReOverdue.ID,
		CollectorName:    "孙经理",
		CollectorRole:    models.RoleManager,
		CollectionType:   models.CollectionTypePhone,
		CollectionTime:   now.AddDate(0, 0, -60),
		ContactResult:    models.ContactResultConnected,
		OverdueReason:    "工程款未按时回收，资金回笼延期",
		HasExtensionHint: true,
		Remark:           "客户为建筑承包商，甲方工程款项延期支付，申请展期3个月",
	})

	extApp2 := models.ExtensionApplication{
		LoanID:          loanReOverdue.ID,
		ApplicantName:   "孙经理",
		ApplicantRole:   models.RoleManager,
		ApplyTime:       now.AddDate(0, 0, -55),
		ExtensionMonths: 3,
		NewEndDate:      now.AddDate(0, 5, 0),
		Reason:          "借款人为建筑承包商，因甲方工程款结算延期导致资金无法按时回笼，申请展期3个月",
		SupplementFiles: "工程合同.pdf,甲方延期付款通知.pdf,应收账款明细.xlsx",
		Status:          models.ExtensionStatusApproved,
	}
	DB.Create(&extApp2)

	DB.Create(&models.ApprovalDecision{
		ExtensionAppID: extApp2.ID,
		ApproverName:   "周风控",
		ApproverRole:   models.RoleRisk,
		DecisionTime:   now.AddDate(0, 0, -50),
		Decision:       models.ExtensionStatusApproved,
		RiskAssessment: "1. 借款人历史信用良好，此前均按时还款；2. 提供的工程合同真实有效，甲方为国有企业，付款有保障；3. 应收账款金额远超未还本息；4. 综合评估风险可控，同意展期3个月",
		Remark:         "同意展期3个月，请贷后专员跟进还款计划更新，密切关注甲方付款进度",
	})

	DB.Model(&loanReOverdue).Updates(map[string]interface{}{
		"status":   models.LoanStatusExtended,
		"end_date": now.AddDate(0, 5, 0),
	})
	for i := 10; i <= 12; i++ {
		DB.Model(&models.RepaymentPlan{}).Where("loan_id = ? AND period_no = ?", loanReOverdue.ID, i).Updates(map[string]interface{}{
			"due_date": now.AddDate(0, i-9, 0).AddDate(0, 3, 0),
			"status":   models.RepaymentStatusExtended,
		})
	}

	DB.Create(&models.OperationLog{
		LoanID:    loanReOverdue.ID,
		Operator:  "周风控",
		Role:      models.RoleRisk,
		Action:    "展期审批-通过",
		Detail:    "展期申请ID:" + fmt.Sprintf("%d", extApp2.ID) + "审批通过，展期3个月",
		IPAddress: "192.168.1.31",
	})
	DB.Create(&models.OperationLog{
		LoanID:    loanReOverdue.ID,
		Operator:  "钱贷后",
		Role:      models.RoleCollector,
		Action:    "更新还款计划",
		Detail:    "根据展期审批结果，更新第10-12期还款计划到期日",
		IPAddress: "192.168.1.40",
	})

	DB.Create(&models.CollectionRecord{
		LoanID:           loanReOverdue.ID,
		CollectorName:    "孙经理",
		CollectorRole:    models.RoleManager,
		CollectionType:   models.CollectionTypePhone,
		CollectionTime:   now.AddDate(0, 0, -15),
		ContactResult:    models.ContactResultConnected,
		OverdueReason:    "甲方工程款再次延期，称月底前一定支付",
		PromiseDate:      &[]time.Time{now.AddDate(0, 0, 15)}[0],
		PromiseAmount:    &[]float64{80000}[0],
		HasExtensionHint: false,
		Remark:           "展期后再次逾期，客户称甲方承诺月底前付款，持续跟进中",
	})
	DB.Create(&models.CollectionRecord{
		LoanID:           loanReOverdue.ID,
		CollectorName:    "钱贷后",
		CollectorRole:    models.RoleCollector,
		CollectionType:   models.CollectionTypeMessage,
		CollectionTime:   now.AddDate(0, 0, -5),
		ContactResult:    models.ContactResultPromised,
		OverdueReason:    "甲方付款流程已走完，等待银行到账",
		PromiseDate:      &[]time.Time{now.AddDate(0, 0, 5)}[0],
		PromiseAmount:    &[]float64{80000}[0],
		HasExtensionHint: false,
		Remark:           "客户已提供甲方付款凭证截图，预计5日内到账",
		SupplementFiles:  "甲方付款凭证.jpg",
	})

	DB.Model(&loanReOverdue).Updates(map[string]interface{}{
		"status":       models.LoanStatusOverdue,
		"overdue_days": 15,
	})

	DB.Create(&models.OperationLog{
		LoanID:    loanReOverdue.ID,
		Operator:  "钱贷后",
		Role:      models.RoleCollector,
		Action:    "标记再次逾期",
		Detail:    "展期后第10期还款再次逾期15天，持续跟进甲方付款进度",
		IPAddress: "192.168.1.40",
	})

	fmt.Println("Seed data inserted successfully.")
	return nil
}

func seedRepaymentPlans(loan *models.Loan, now time.Time) {
	monthlyPrincipal := loan.PrincipalAmount / float64(loan.TermMonths)
	monthlyInterest := loan.PrincipalAmount * loan.InterestRate / 12
	for i := 1; i <= loan.TermMonths; i++ {
		dueDate := loan.StartDate.AddDate(0, i, 0)
		status := models.RepaymentStatusPending
		paidAmount := 0.0
		var actualPaidDate *time.Time
		overdueDays := 0

		if dueDate.Before(now.AddDate(0, 0, -1)) {
			if loan.LoanNo == "LN202603001" {
				status = models.RepaymentStatusOverdue
				overdueDays = int(now.Sub(dueDate).Hours() / 24)
			} else if loan.LoanNo == "LN202512008" && i <= 9 {
				status = models.RepaymentStatusPaid
				paidAmount = monthlyPrincipal + monthlyInterest
				pd := dueDate.AddDate(0, 0, -2)
				actualPaidDate = &pd
			} else if loan.LoanNo == "LN202602005" && i <= 7 {
				status = models.RepaymentStatusPaid
				paidAmount = monthlyPrincipal + monthlyInterest
				pd := dueDate.AddDate(0, 0, -1)
				actualPaidDate = &pd
			} else if loan.LoanNo == "LN202601012" && i <= 5 {
				status = models.RepaymentStatusPaid
				paidAmount = monthlyPrincipal + monthlyInterest
				pd := dueDate.AddDate(0, 0, -3)
				actualPaidDate = &pd
			}
		}

		DB.Create(&models.RepaymentPlan{
			LoanID:         loan.ID,
			PeriodNo:       i,
			DueDate:        dueDate,
			Principal:      monthlyPrincipal,
			Interest:       monthlyInterest,
			TotalAmount:    monthlyPrincipal + monthlyInterest,
			PaidAmount:     paidAmount,
			Status:         status,
			OverdueDays:    overdueDays,
			ActualPaidDate: actualPaidDate,
		})
	}
}
