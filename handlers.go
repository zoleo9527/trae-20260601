package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func getUserFromHeader(c *gin.Context) *User {
	userID, _ := strconv.Atoi(c.GetHeader("X-User-ID"))
	if userID == 0 {
		userID = 3
	}
	var u User
	err := database.QueryRow("SELECT id, username, name, role, store_id, area_id FROM users WHERE id = ?", userID).
		Scan(&u.ID, &u.Username, &u.Name, &u.Role, &u.StoreID, &u.AreaID)
	if err != nil {
		return &User{ID: 3, Username: "manager_zhang", Name: "张店长", Role: "store_manager"}
	}
	return &u
}

func logOperation(refType string, refID int, action, oldStatus, newStatus string, operator *User, detail string) {
	operatorName := operator.Name
	operatorRole := operator.Role
	var d *string
	if detail != "" {
		d = &detail
	}
	var os, ns *string
	if oldStatus != "" {
		os = &oldStatus
	}
	if newStatus != "" {
		ns = &newStatus
	}
	database.Exec(`INSERT INTO operation_logs (ref_type, ref_id, action, old_status, new_status, operator_id, operator_name, operator_role, detail, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
		refType, refID, action, os, ns, operator.ID, operatorName, operatorRole, d, time.Now())
}

func sendNotification(userID int, refType string, refID int, nType, title, content string) {
	var c *string
	if content != "" {
		c = &content
	}
	database.Exec(`INSERT INTO notifications (user_id, ref_type, ref_id, type, title, content, created_at) VALUES (?,?,?,?,?,?,?)`,
		userID, refType, refID, nType, title, c, time.Now())
}

// ===== 登录与用户 =====
func ListUsers(c *gin.Context) {
	role := c.Query("role")
	storeID := c.Query("store_id")
	query := "SELECT id, username, name, role, store_id, area_id FROM users WHERE 1=1"
	args := []interface{}{}
	if role != "" {
		query += " AND role = ?"
		args = append(args, role)
	}
	if storeID != "" {
		query += " AND store_id = ?"
		args = append(args, storeID)
	}
	rows, err := database.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusOK, Err(500, err.Error()))
		return
	}
	defer rows.Close()
	list := []User{}
	for rows.Next() {
		var u User
		rows.Scan(&u.ID, &u.Username, &u.Name, &u.Role, &u.StoreID, &u.AreaID)
		list = append(list, u)
	}
	c.JSON(http.StatusOK, OK(list))
}

func ListStores(c *gin.Context) {
	rows, _ := database.Query("SELECT id, name, area_id, address FROM stores ORDER BY id")
	defer rows.Close()
	list := []Store{}
	for rows.Next() {
		var s Store
		rows.Scan(&s.ID, &s.Name, &s.AreaID, &s.Address)
		list = append(list, s)
	}
	c.JSON(http.StatusOK, OK(list))
}

// ===== 销售班结 =====
func scanShift(row interface{ Scan(dest ...interface{}) error }) (ShiftSettlement, error) {
	var s ShiftSettlement
	var clerkName sql.NullString
	var storeName sql.NullString
	var approvedByName sql.NullString
	var cashActual sql.NullFloat64
	var rejectReason sql.NullString
	var approvedBy sql.NullInt64

	err := row.Scan(&s.ID, &s.StoreID, &storeName, &s.ShiftNo, &s.ClerkID, &clerkName,
		&s.ShiftDate, &s.ShiftType, &s.TicketSales, &s.ScratchSales, &s.TotalSales,
		&s.CashExpected, &cashActual, &s.Status, &rejectReason, &s.CreatedBy, &approvedBy,
		&approvedByName, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return s, err
	}
	s.ClerkName = clerkName.String
	s.StoreName = storeName.String
	s.ApprovedByName = approvedByName.String
	if cashActual.Valid {
		v := cashActual.Float64
		s.CashActual = &v
	}
	if rejectReason.Valid {
		v := rejectReason.String
		s.RejectReason = &v
	}
	if approvedBy.Valid {
		v := int(approvedBy.Int64)
		s.ApprovedBy = &v
	}
	return s, nil
}

func ListShiftSettlements(c *gin.Context) {
	u := getUserFromHeader(c)
	status := c.Query("status")
	storeID := c.Query("store_id")
	view := c.Query("view") // my/pending/all
	query := `SELECT s.id, s.store_id, st.name, s.shift_no, s.clerk_id, u.name, 
		s.shift_date, s.shift_type, s.ticket_sales, s.scratch_sales, s.total_sales,
		s.cash_expected, s.cash_actual, s.status, s.reject_reason, s.created_by, s.approved_by,
		au.name, s.created_at, s.updated_at
		FROM shift_settlements s 
		LEFT JOIN stores st ON s.store_id = st.id
		LEFT JOIN users u ON s.clerk_id = u.id
		LEFT JOIN users au ON s.approved_by = au.id WHERE 1=1`
	args := []interface{}{}

	// 角色权限过滤
	switch u.Role {
	case "clerk":
		query += " AND s.clerk_id = ?"
		args = append(args, u.ID)
	case "store_manager":
		if u.StoreID != nil {
			query += " AND s.store_id = ?"
			args = append(args, *u.StoreID)
		}
	case "area_manager":
		if u.AreaID != nil {
			query += " AND st.area_id = ?"
			args = append(args, *u.AreaID)
		}
	}

	if status != "" {
		query += " AND s.status = ?"
		args = append(args, status)
	}
	if storeID != "" {
		query += " AND s.store_id = ?"
		args = append(args, storeID)
	}
	// 视图快捷过滤
	if view == "pending" {
		switch u.Role {
		case "clerk":
			query += " AND s.status IN ('draft','rejected')"
		case "store_manager":
			query += " AND s.status = 'submitted'"
		case "area_manager":
			query += " AND s.status IN ('submitted','pending_cash')"
		}
	}
	query += " ORDER BY s.created_at DESC LIMIT 100"
	rows, err := database.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusOK, Err(500, err.Error()))
		return
	}
	defer rows.Close()
	list := []ShiftSettlement{}
	for rows.Next() {
		s, err := scanShift(rows)
		if err == nil {
			list = append(list, s)
		}
	}
	c.JSON(http.StatusOK, OK(list))
}

func GetShiftSettlement(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	query := `SELECT s.id, s.store_id, st.name, s.shift_no, s.clerk_id, u.name, 
		s.shift_date, s.shift_type, s.ticket_sales, s.scratch_sales, s.total_sales,
		s.cash_expected, s.cash_actual, s.status, s.reject_reason, s.created_by, s.approved_by,
		au.name, s.created_at, s.updated_at
		FROM shift_settlements s 
		LEFT JOIN stores st ON s.store_id = st.id
		LEFT JOIN users u ON s.clerk_id = u.id
		LEFT JOIN users au ON s.approved_by = au.id WHERE s.id = ?`
	s, err := scanShift(database.QueryRow(query, id))
	if err != nil {
		c.JSON(http.StatusOK, Err(404, "not found"))
		return
	}
	c.JSON(http.StatusOK, OK(s))
}

func CreateShiftSettlement(c *gin.Context) {
	u := getUserFromHeader(c)
	var req struct {
		StoreID      int     `json:"store_id"`
		ShiftType    string  `json:"shift_type"`
		ShiftDate    string  `json:"shift_date"`
		TicketSales  float64 `json:"ticket_sales"`
		ScratchSales float64 `json:"scratch_sales"`
		CashActual   float64 `json:"cash_actual"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusOK, Err(400, err.Error()))
		return
	}
	if req.ShiftDate == "" {
		req.ShiftDate = time.Now().Format("2006-01-02")
	}
	total := req.TicketSales + req.ScratchSales
	prefix := map[string]string{"morning": "M", "afternoon": "A", "night": "N"}[req.ShiftType]
	var seq int
	database.QueryRow(`SELECT COUNT(*)+1 FROM shift_settlements WHERE shift_date=? AND shift_type=? AND store_id=?`,
		req.ShiftDate, req.ShiftType, req.StoreID).Scan(&seq)
	shiftNo := fmt.Sprintf("SS%s%s%03d", req.ShiftDate, prefix, seq)
	shiftNo = shiftNo[:4] + shiftNo[5:7] + shiftNo[8:10] + shiftNo[10:]

	res, err := database.Exec(`INSERT INTO shift_settlements 
		(store_id, shift_no, clerk_id, shift_date, shift_type, ticket_sales, scratch_sales, total_sales, cash_expected, cash_actual, status, created_by, created_at, updated_at)
		VALUES (?,?,?,?,?,?,?,?,?,?,'draft',?,?,?)`,
		req.StoreID, shiftNo, u.ID, req.ShiftDate, req.ShiftType, req.TicketSales, req.ScratchSales, total,
		total, req.CashActual, u.ID, time.Now(), time.Now())
	if err != nil {
		c.JSON(http.StatusOK, Err(500, err.Error()))
		return
	}
	id, _ := res.LastInsertId()
	logOperation("shift_settlement", int(id), "create", "", "draft", u,
		fmt.Sprintf("创建%s班结，销售总额%.2f元", req.ShiftType, total))
	c.JSON(http.StatusOK, OK(gin.H{"id": id, "shift_no": shiftNo}))
}

func UpdateShiftStatus(c *gin.Context) {
	u := getUserFromHeader(c)
	id, _ := strconv.Atoi(c.Param("id"))
	action := c.Param("action")
	var oldStatus string
	database.QueryRow("SELECT status FROM shift_settlements WHERE id=?", id).Scan(&oldStatus)

	var req struct {
		Reason string  `json:"reason"`
		Amount float64 `json:"amount"`
	}
	c.BindJSON(&req)

	newStatus := ""
	detail := ""
	switch action {
	case "submit":
		newStatus = "submitted"
		detail = "店员提交班结"
	case "approve":
		newStatus = "pending_cash"
		database.Exec("UPDATE shift_settlements SET approved_by=?, updated_at=? WHERE id=?", u.ID, time.Now(), id)
		detail = "审核通过，待现金核对"
	case "reject":
		newStatus = "rejected"
		reason := req.Reason
		if reason == "" {
			reason = "未填写原因"
		}
		database.Exec("UPDATE shift_settlements SET reject_reason=?, updated_at=? WHERE id=?", reason, time.Now(), id)
		detail = "驳回：" + reason
	case "final_approve":
		newStatus = "approved"
		database.Exec("UPDATE shift_settlements SET approved_by=?, updated_at=? WHERE id=?", u.ID, time.Now(), id)
		detail = "最终批准，班结完成"
	case "update_cash":
		newStatus = oldStatus
		database.Exec("UPDATE shift_settlements SET cash_actual=?, updated_at=? WHERE id=?", req.Amount, time.Now(), id)
		detail = fmt.Sprintf("更新现金实际金额：%.2f", req.Amount)
	}
	if newStatus == "" {
		c.JSON(http.StatusOK, Err(400, "unknown action"))
		return
	}
	if action != "update_cash" {
		database.Exec("UPDATE shift_settlements SET status=?, updated_at=? WHERE id=?", newStatus, time.Now(), id)
	}
	logOperation("shift_settlement", id, action, oldStatus, newStatus, u, detail)

	// 通知
	if action == "submit" {
		var clerkID, storeID int
		database.QueryRow("SELECT clerk_id, store_id FROM shift_settlements WHERE id=?", id).Scan(&clerkID, &storeID)
		var mgrID int
		database.QueryRow("SELECT id FROM users WHERE role='store_manager' AND store_id=?", storeID).Scan(&mgrID)
		if mgrID > 0 {
			var shiftNo string
			database.QueryRow("SELECT shift_no FROM shift_settlements WHERE id=?", id).Scan(&shiftNo)
			sendNotification(mgrID, "shift_settlement", id, "review",
				"待审核班结："+shiftNo, "店员提交了班结，请审核。")
		}
	}
	if action == "reject" {
		var clerkID int
		var shiftNo string
		database.QueryRow("SELECT clerk_id, shift_no FROM shift_settlements WHERE id=?", id).Scan(&clerkID, &shiftNo)
		sendNotification(clerkID, "shift_settlement", id, "approval",
			"班结被驳回："+shiftNo, detail)
	}
	if action == "approve" {
		var storeID int
		database.QueryRow("SELECT store_id FROM shift_settlements WHERE id=?", id).Scan(&storeID)
		var cvID int64
		var cashExpected float64
		database.QueryRow("SELECT cash_expected FROM shift_settlements WHERE id=?", id).Scan(&cashExpected)
		var mgrID int
		database.QueryRow("SELECT id FROM users WHERE role='store_manager' AND store_id=?", storeID).Scan(&mgrID)
		res, _ := database.Exec(`INSERT INTO cash_verifications (shift_settlement_id, store_id, store_manager_id, cash_declared, status, created_at, updated_at) VALUES (?,?,?,?,'pending',?,?)`,
			id, storeID, mgrID, cashExpected, time.Now(), time.Now())
		cvID, _ = res.LastInsertId()
		logOperation("cash_verification", int(cvID), "create", "", "pending", u,
			fmt.Sprintf("自动创建现金核对单，申报金额%.2f", cashExpected))
		sendNotification(mgrID, "cash_verification", int(cvID), "review",
			"待现金核对", "班结已审核，请尽快安排现金清点。")
	}

	c.JSON(http.StatusOK, OK(gin.H{"status": newStatus}))
}

// ===== 现金核对 =====
func scanCash(row interface{ Scan(dest ...interface{}) error }) (CashVerification, error) {
	var cv CashVerification
	var storeName sql.NullString
	var mgrName sql.NullString
	var areaName sql.NullString
	var cashCounted sql.NullFloat64
	var diff sql.NullFloat64
	var prevConc sql.NullString
	var matNotes sql.NullString
	var notes sql.NullString
	var resolution sql.NullString
	var storeMgrID sql.NullInt64
	var areaMgrID sql.NullInt64
	err := row.Scan(&cv.ID, &cv.ShiftSettlementID, &cv.StoreID, &storeName, &storeMgrID, &mgrName,
		&areaMgrID, &areaName, &cv.CashDeclared, &cashCounted, &diff, &cv.Status,
		&prevConc, &matNotes, &notes, &resolution, &cv.CreatedAt, &cv.UpdatedAt)
	if err != nil {
		return cv, err
	}
	cv.StoreName = storeName.String
	cv.StoreManagerName = mgrName.String
	cv.AreaManagerName = areaName.String
	if cashCounted.Valid {
		v := cashCounted.Float64
		cv.CashCounted = &v
	}
	if diff.Valid {
		v := diff.Float64
		cv.Difference = &v
	}
	if prevConc.Valid {
		v := prevConc.String
		cv.PreviousConclusion = &v
	}
	if matNotes.Valid {
		v := matNotes.String
		cv.MaterialNotes = &v
	}
	if notes.Valid {
		v := notes.String
		cv.Notes = &v
	}
	if resolution.Valid {
		v := resolution.String
		cv.Resolution = &v
	}
	if storeMgrID.Valid {
		v := int(storeMgrID.Int64)
		cv.StoreManagerID = &v
	}
	if areaMgrID.Valid {
		v := int(areaMgrID.Int64)
		cv.AreaManagerID = &v
	}
	return cv, nil
}

func ListCashVerifications(c *gin.Context) {
	u := getUserFromHeader(c)
	status := c.Query("status")
	storeID := c.Query("store_id")
	view := c.Query("view")
	query := `SELECT cv.id, cv.shift_settlement_id, cv.store_id, st.name, cv.store_manager_id, sm.name,
		cv.area_manager_id, am.name, cv.cash_declared, cv.cash_counted, cv.difference, cv.status,
		cv.previous_conclusion, cv.material_notes, cv.notes, cv.resolution, cv.created_at, cv.updated_at
		FROM cash_verifications cv
		LEFT JOIN stores st ON cv.store_id = st.id
		LEFT JOIN users sm ON cv.store_manager_id = sm.id
		LEFT JOIN users am ON cv.area_manager_id = am.id WHERE 1=1`
	args := []interface{}{}

	switch u.Role {
	case "clerk":
		query += " AND EXISTS (SELECT 1 FROM shift_settlements s WHERE s.id = cv.shift_settlement_id AND s.clerk_id = ?)"
		args = append(args, u.ID)
	case "store_manager":
		if u.StoreID != nil {
			query += " AND cv.store_id = ?"
			args = append(args, *u.StoreID)
		}
	case "area_manager":
		if u.AreaID != nil {
			query += " AND st.area_id = ?"
			args = append(args, *u.AreaID)
		}
	}

	if status != "" {
		query += " AND cv.status = ?"
		args = append(args, status)
	}
	if storeID != "" {
		query += " AND cv.store_id = ?"
		args = append(args, storeID)
	}
	if view == "pending" {
		switch u.Role {
		case "store_manager":
			query += " AND cv.status IN ('pending','counting','mismatched')"
		case "area_manager":
			query += " AND cv.status IN ('escalated','mismatched')"
		case "clerk":
			query += " AND cv.status IN ('pending','counting','mismatched','escalated')"
		}
	}
	query += " ORDER BY cv.created_at DESC LIMIT 100"
	rows, err := database.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusOK, Err(500, err.Error()))
		return
	}
	defer rows.Close()
	list := []CashVerification{}
	for rows.Next() {
		cv, err := scanCash(rows)
		if err == nil {
			list = append(list, cv)
		}
	}
	c.JSON(http.StatusOK, OK(list))
}

func GetCashVerification(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	query := `SELECT cv.id, cv.shift_settlement_id, cv.store_id, st.name, cv.store_manager_id, sm.name,
		cv.area_manager_id, am.name, cv.cash_declared, cv.cash_counted, cv.difference, cv.status,
		cv.previous_conclusion, cv.material_notes, cv.notes, cv.resolution, cv.created_at, cv.updated_at
		FROM cash_verifications cv
		LEFT JOIN stores st ON cv.store_id = st.id
		LEFT JOIN users sm ON cv.store_manager_id = sm.id
		LEFT JOIN users am ON cv.area_manager_id = am.id WHERE cv.id = ?`
	cv, err := scanCash(database.QueryRow(query, id))
	if err != nil {
		c.JSON(http.StatusOK, Err(404, "not found"))
		return
	}
	shiftQ := `SELECT s.id, s.store_id, st.name, s.shift_no, s.clerk_id, u.name, 
		s.shift_date, s.shift_type, s.ticket_sales, s.scratch_sales, s.total_sales,
		s.cash_expected, s.cash_actual, s.status, s.reject_reason, s.created_by, s.approved_by,
		au.name, s.created_at, s.updated_at
		FROM shift_settlements s 
		LEFT JOIN stores st ON s.store_id = st.id
		LEFT JOIN users u ON s.clerk_id = u.id
		LEFT JOIN users au ON s.approved_by = au.id WHERE s.id = ?`
	if shift, err := scanShift(database.QueryRow(shiftQ, cv.ShiftSettlementID)); err == nil {
		cv.ShiftInfo = &shift
	}
	matRows, _ := database.Query(`SELECT m.id, m.cash_verification_id, m.type, m.name, m.amount, m.reference_no, m.file_url, m.uploaded_by, u.name, m.created_at
		FROM materials m LEFT JOIN users u ON m.uploaded_by = u.id WHERE m.cash_verification_id = ? ORDER BY m.created_at`, id)
	defer matRows.Close()
	mats := []Material{}
	for matRows.Next() {
		var m Material
		var amt sql.NullFloat64
		var ref sql.NullString
		var furl sql.NullString
		var upBy sql.NullInt64
		var upName sql.NullString
		matRows.Scan(&m.ID, &m.CashVerificationID, &m.Type, &m.Name, &amt, &ref, &furl, &upBy, &upName, &m.CreatedAt)
		if amt.Valid {
			v := amt.Float64
			m.Amount = &v
		}
		if ref.Valid {
			v := ref.String
			m.ReferenceNo = &v
		}
		if furl.Valid {
			v := furl.String
			m.FileURL = &v
		}
		if upBy.Valid {
			v := int(upBy.Int64)
			m.UploadedBy = &v
		}
		m.UploadedByName = upName.String
		mats = append(mats, m)
	}
	cv.Materials = mats
	c.JSON(http.StatusOK, OK(cv))
}

func UpdateCashVerification(c *gin.Context) {
	u := getUserFromHeader(c)
	id, _ := strconv.Atoi(c.Param("id"))
	action := c.Param("action")
	var oldStatus string
	database.QueryRow("SELECT status FROM cash_verifications WHERE id=?", id).Scan(&oldStatus)

	var req struct {
		CashCounted        float64 `json:"cash_counted"`
		PreviousConclusion string  `json:"previous_conclusion"`
		MaterialNotes      string  `json:"material_notes"`
		Notes              string  `json:"notes"`
		Resolution         string  `json:"resolution"`
		Reason             string  `json:"reason"`
	}
	c.BindJSON(&req)

	newStatus := ""
	detail := ""
	switch action {
	case "start_count":
		newStatus = "counting"
		detail = "开始现场现金盘点"
	case "submit_count":
		diff := req.CashCounted - req.CashCounted
		var declared float64
		database.QueryRow("SELECT cash_declared FROM cash_verifications WHERE id=?", id).Scan(&declared)
		diff = req.CashCounted - declared
		if diff == 0 {
			newStatus = "matched"
			detail = fmt.Sprintf("盘点完成，账实相符：%.2f元", req.CashCounted)
		} else {
			newStatus = "mismatched"
			detail = fmt.Sprintf("盘点完成，差异%.2f元（申报%.2f，实盘%.2f）", diff, declared, req.CashCounted)
		}
		database.Exec(`UPDATE cash_verifications SET cash_counted=?, difference=?, updated_at=? WHERE id=?`,
			req.CashCounted, diff, time.Now(), id)
	case "escalate":
		newStatus = "escalated"
		database.Exec(`UPDATE cash_verifications SET area_manager_id=(SELECT id FROM users WHERE role='area_manager' LIMIT 1), notes=?, updated_at=? WHERE id=?`,
			req.Reason, time.Now(), id)
		detail = "升级至片区管理员：" + req.Reason
	case "resolve":
		newStatus = "resolved"
		database.Exec(`UPDATE cash_verifications SET resolution=?, updated_at=? WHERE id=?`,
			req.Resolution, time.Now(), id)
		detail = "处理完成：" + req.Resolution
	case "match":
		newStatus = "matched"
		detail = "确认为账实相符"
	case "update_notes":
		newStatus = oldStatus
		database.Exec(`UPDATE cash_verifications SET previous_conclusion=?, material_notes=?, notes=?, updated_at=? WHERE id=?`,
			req.PreviousConclusion, req.MaterialNotes, req.Notes, time.Now(), id)
		detail = "更新核对备注信息"
	}
	if newStatus == "" {
		c.JSON(http.StatusOK, Err(400, "unknown action"))
		return
	}
	if action != "update_notes" {
		database.Exec("UPDATE cash_verifications SET status=?, updated_at=? WHERE id=?", newStatus, time.Now(), id)
	}
	logOperation("cash_verification", id, action, oldStatus, newStatus, u, detail)

	if action == "escalate" {
		var areaMgrID int
		database.QueryRow("SELECT id FROM users WHERE role='area_manager' LIMIT 1").Scan(&areaMgrID)
		var storeName string
		database.QueryRow("SELECT st.name FROM cash_verifications cv JOIN stores st ON cv.store_id=st.id WHERE cv.id=?", id).Scan(&storeName)
		var diff float64
		database.QueryRow("SELECT difference FROM cash_verifications WHERE id=?", id).Scan(&diff)
		if areaMgrID > 0 {
			sendNotification(areaMgrID, "cash_verification", id, "escalation",
				fmt.Sprintf("现金差异已升级：%s（差异%.2f元）", storeName, diff),
				req.Reason)
		}
	}
	if action == "submit_count" && newStatus == "mismatched" {
		var storeMgrID int
		database.QueryRow("SELECT store_manager_id FROM cash_verifications WHERE id=?", id).Scan(&storeMgrID)
		var diff float64
		database.QueryRow("SELECT difference FROM cash_verifications WHERE id=?", id).Scan(&diff)
		sendNotification(storeMgrID, "cash_verification", id, "mismatch",
			fmt.Sprintf("现金差异提醒：%.2f元待处理", diff),
			detail)
	}
	if action == "resolve" || action == "match" || (action == "submit_count" && newStatus == "matched") {
		var sid int
		database.QueryRow("SELECT shift_settlement_id FROM cash_verifications WHERE id=?", id).Scan(&sid)
		if sid > 0 {
			var sStatus string
			database.QueryRow("SELECT status FROM shift_settlements WHERE id=?", sid).Scan(&sStatus)
			if sStatus == "pending_cash" || sStatus == "submitted" {
				database.Exec("UPDATE shift_settlements SET status='approved', approved_by=?, updated_at=? WHERE id=?", u.ID, time.Now(), sid)
				reason := ""
				if action == "resolve" {
					reason = req.Resolution
				} else if action == "match" {
					reason = "手工确认为账实相符"
				} else {
					reason = "现金盘点账实相符"
				}
				logOperation("shift_settlement", sid, "auto_close", sStatus, "approved", u,
					"现金核对完成（"+reason+"），班结自动闭环")
			}
		}
	}
	c.JSON(http.StatusOK, OK(gin.H{"status": newStatus}))
}

func AddMaterial(c *gin.Context) {
	u := getUserFromHeader(c)
	cvID, _ := strconv.Atoi(c.Param("id"))
	var req struct {
		Type        string  `json:"type"`
		Name        string  `json:"name"`
		Amount      float64 `json:"amount"`
		ReferenceNo string  `json:"reference_no"`
	}
	c.BindJSON(&req)
	var amt *float64
	var ref *string
	if req.Amount != 0 {
		amt = &req.Amount
	}
	if req.ReferenceNo != "" {
		ref = &req.ReferenceNo
	}
	res, err := database.Exec(`INSERT INTO materials (cash_verification_id, type, name, amount, reference_no, uploaded_by, created_at) VALUES (?,?,?,?,?,?,?)`,
		cvID, req.Type, req.Name, amt, ref, u.ID, time.Now())
	if err != nil {
		c.JSON(http.StatusOK, Err(500, err.Error()))
		return
	}
	id, _ := res.LastInsertId()
	logOperation("cash_verification", cvID, "upload_material", "", "", u,
		fmt.Sprintf("上传材料：%s(%s)", req.Name, req.Type))
	c.JSON(http.StatusOK, OK(gin.H{"id": id}))
}

// ===== 操作日志 =====
func GetOperationLogs(c *gin.Context) {
	refType := c.Query("ref_type")
	refID := c.Query("ref_id")
	query := `SELECT id, ref_type, ref_id, action, old_status, new_status, operator_id, operator_name, operator_role, detail, created_at FROM operation_logs WHERE 1=1`
	args := []interface{}{}
	if refType != "" {
		query += " AND ref_type = ?"
		args = append(args, refType)
	}
	if refID != "" {
		query += " AND ref_id = ?"
		args = append(args, refID)
	}
	query += " ORDER BY created_at DESC LIMIT 200"
	rows, _ := database.Query(query, args...)
	defer rows.Close()
	list := []OperationLog{}
	for rows.Next() {
		var l OperationLog
		var os, ns, det sql.NullString
		rows.Scan(&l.ID, &l.RefType, &l.RefID, &l.Action, &os, &ns, &l.OperatorID, &l.OperatorName, &l.OperatorRole, &det, &l.CreatedAt)
		if os.Valid {
			v := os.String
			l.OldStatus = &v
		}
		if ns.Valid {
			v := ns.String
			l.NewStatus = &v
		}
		if det.Valid {
			v := det.String
			l.Detail = &v
		}
		list = append(list, l)
	}
	c.JSON(http.StatusOK, OK(list))
}

// ===== 通知 =====
func ListNotifications(c *gin.Context) {
	u := getUserFromHeader(c)
	onlyUnread := c.Query("unread")
	query := `SELECT id, user_id, ref_type, ref_id, type, title, content, is_read, created_at FROM notifications WHERE user_id = ?`
	args := []interface{}{u.ID}
	if onlyUnread == "1" {
		query += " AND is_read = 0"
	}
	query += " ORDER BY created_at DESC LIMIT 100"
	rows, _ := database.Query(query, args...)
	defer rows.Close()
	list := []Notification{}
	for rows.Next() {
		var n Notification
		var cont sql.NullString
		rows.Scan(&n.ID, &n.UserID, &n.RefType, &n.RefID, &n.Type, &n.Title, &cont, &n.IsRead, &n.CreatedAt)
		if cont.Valid {
			v := cont.String
			n.Content = &v
		}
		list = append(list, n)
	}
	c.JSON(http.StatusOK, OK(list))
}

func ReadNotification(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	all := c.Query("all")
	u := getUserFromHeader(c)
	if all == "1" {
		database.Exec("UPDATE notifications SET is_read=1 WHERE user_id=?", u.ID)
	} else {
		database.Exec("UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?", id, u.ID)
	}
	c.JSON(http.StatusOK, OK(nil))
}

func UnreadCount(c *gin.Context) {
	u := getUserFromHeader(c)
	var cnt int
	database.QueryRow("SELECT COUNT(*) FROM notifications WHERE user_id=? AND is_read=0", u.ID).Scan(&cnt)
	c.JSON(http.StatusOK, OK(gin.H{"count": cnt}))
}
