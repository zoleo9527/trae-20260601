
import os

base = '/Users/liu/Documents/private/model-test/trae-20260601-2/backend'

# ========== 1. 修复 exceptions.go ==========
print("=== 修复 exceptions.go ===")
with open(os.path.join(base, 'handlers/exceptions.go'), 'r') as f:
    content = f.read()

# 修改 CreateException
old1 = '''\t\t\trid := exc.ID
\t\t\tfor _, du := range h.getUserIDsByRole(models.RoleDispatcher) {
\t\t\t\th.createNotification(du, models.NotificationException, "异常通知", "有新异常需处理", &rid)
\t\t\t}
\t\t\tfor _, du := range h.getUserIDsByRole(models.RoleService) {
\t\t\t\th.createNotification(du, models.NotificationException, "异常通知", "有新异常需处理", &rid)
\t\t\t}'''

new1 = '''\t\t\tvar bname string
\t\t\tvar bk models.Booking
\t\t\tif tx.Where("id=?", req.BookingID).First(&bk).Error == nil { bname = bk.CustomerName }
\t\t\trid := exc.ID
\t\t\tfor _, du := range h.getUserIDsByRole(models.RoleDispatcher) {
\t\t\t\th.createNotificationTx(tx, du, models.NotificationException, "异常待处理", title+"（客户:"+bname+"）", &rid)
\t\t\t}
\t\t\tfor _, du := range h.getUserIDsByRole(models.RoleService) {
\t\t\t\th.createNotificationTx(tx, du, models.NotificationException, "异常待处理", title+"（客户:"+bname+"）", &rid)
\t\t\t}'''

if old1 in content:
    content = content.replace(old1, new1)
    print("  CreateException 替换成功")
else:
    print("  CreateException 未找到匹配内容")

# 修改 TriggerTestException
old2 = '''\t\t\trid := exc.ID
\t\t\tfor _, du := range h.getUserIDsByRole(models.RoleDispatcher) { h.createNotification(du, models.NotificationException, "异常通知", "有新异常需处理", &rid) }
\t\t\tfor _, du := range h.getUserIDsByRole(models.RoleService) { h.createNotification(du, models.NotificationException, "异常通知", "有新异常需处理", &rid) }'''

new2 = '''\t\t\tvar bname string
\t\t\tvar bk models.Booking
\t\t\tif tx.Where("id=?", req.BookingID).First(&bk).Error == nil { bname = bk.CustomerName }
\t\t\trid := exc.ID
\t\t\tfor _, du := range h.getUserIDsByRole(models.RoleDispatcher) { h.createNotificationTx(tx, du, models.NotificationException, "异常待处理", title+"（客户:"+bname+"）", &rid) }
\t\t\tfor _, du := range h.getUserIDsByRole(models.RoleService) { h.createNotificationTx(tx, du, models.NotificationException, "异常待处理", title+"（客户:"+bname+"）", &rid) }'''

if old2 in content:
    content = content.replace(old2, new2)
    print("  TriggerTestException 替换成功")
else:
    print("  TriggerTestException 未找到匹配内容")

with open(os.path.join(base, 'handlers/exceptions.go'), 'w') as f:
    f.write(content)

# ========== 2. 修复 schedules.go ==========
print("\n=== 修复 schedules.go ===")
with open(os.path.join(base, 'handlers/schedules.go'), 'r') as f:
    content = f.read()

old3 = '''\t\t\tfor _, ci := range req.CrewList {
\t\t\t\tasgn := &models.CrewAssignment{ScheduleID:sched.ID,CrewID:ci.CrewID,BookingID:req.BookingID,Role:ci.Role,Status:models.AssignmentPending}
\t\t\t\tif e := tx.Create(asgn).Error; e != nil { return e }
\t\t\t\trid := sched.ID
\t\t\t\th.createNotification(ci.CrewID, models.NotificationAssignment, "新派工", "您有新的搬家任务", &rid)
\t\t\t}
\t\t\tfor _, du := range h.getUserIDsByRole(models.RoleDispatcher) {
\t\t\t\trid := sched.ID
\t\t\t\th.createNotification(du, models.NotificationSchedule, "新排班", "有新的排班已创建", &rid)
\t\t\t}'''

new3 = '''\t\t\tfor _, ci := range req.CrewList {
\t\t\t\tasgn := &models.CrewAssignment{ScheduleID:sched.ID,CrewID:ci.CrewID,BookingID:req.BookingID,Role:ci.Role,Status:models.AssignmentPending}
\t\t\t\tif e := tx.Create(asgn).Error; e != nil { return e }
\t\t\t\trid := sched.ID
\t\t\t\th.createNotificationTx(tx, ci.CrewID, models.NotificationAssignment, "新派工", "您有新的搬家任务", &rid)
\t\t\t}
\t\t\tfor _, du := range h.getUserIDsByRole(models.RoleDispatcher) {
\t\t\t\trid := sched.ID
\t\t\t\th.createNotificationTx(tx, du, models.NotificationSchedule, "新排班", "有新的排班已创建", &rid)
\t\t\t}'''

if old3 in content:
    content = content.replace(old3, new3)
    print("  CreateScheduleAndAssign 替换成功")
else:
    print("  CreateScheduleAndAssign 未找到匹配内容")

with open(os.path.join(base, 'handlers/schedules.go'), 'w') as f:
    f.write(content)

# ========== 3. 修复 routes.go ==========
print("\n=== 修复 routes.go ===")
with open(os.path.join(base, 'routes/routes.go'), 'r') as f:
    content = f.read()

old4 = '''\tassignments.Get("/review", h.GetCrewReview())'''

new4 = '''\tassignments.Get("/review/:member_id", h.GetCrewReview())
\tassignments.Get("/review", h.GetCrewReview())'''

if old4 in content:
    content = content.replace(old4, new4)
    print("  routes 替换成功")
else:
    print("  routes 未找到匹配内容")

with open(os.path.join(base, 'routes/routes.go'), 'w') as f:
    f.write(content)

# ========== 4. 修复 assignments.go - GetCrewReview ==========
print("\n=== 修复 assignments.go ===")
with open(os.path.join(base, 'handlers/assignments.go'), 'r') as f:
    content = f.read()

old5 = '''func (h *Handler) GetCrewReview() fiber.Handler {
\treturn func(c *fiber.Ctx) error {
\t\tcidStr := c.Query("crew_id")
\t\tif cidStr == "" { return c.Status(400).JSON(fiber.Map{"error":"no crew_id"}) }
\t\tcid,e:=uuid.Parse(cidStr)
\t\tif e!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad id"}) }
\t\tsd:=c.Query("start_date"); ed:=c.Query("end_date")
\t\tq:=h.DB.Model(&models.CrewAssignment{}).Where("crew_id=?",cid)
\t\tif sd!="" { if t,e:=time.Parse("2006-01-02",sd); e==nil { q=q.Where("created_at>=?",t) } }
\t\tif ed!="" { if t,e:=time.Parse("2006-01-02",ed); e==nil { t2:=t.Add(24*time.Hour); q=q.Where("created_at<?",t2) } }
\t\tvar list []models.CrewAssignment
\t\tq.Preload("Schedule").Preload("Booking").Preload("Crew").Order("created_at DESC").Find(&list)
\t\tvar cnt, cc, rc int64
\t\th.DB.Model(&models.CrewAssignment{}).Where("crew_id=?",cid).Count(&cnt)
\t\th.DB.Model(&models.CrewAssignment{}).Where("crew_id=? AND status=?",cid,models.AssignmentCompleted).Count(&cc)
\t\tvar all []models.CrewAssignment
\t\th.DB.Model(&models.CrewAssignment{}).Where("crew_id=?",cid).Find(&all)
\t\tfor _, x := range all { rc += int64(x.RejectCount) }
\t\treturn c.JSON(fiber.Map{"count":cnt,"completed_count":cc,"total_reject_count":rc,"assignments":list})
\t}
}'''

new5 = '''func (h *Handler) GetCrewReview() fiber.Handler {
\treturn func(c *fiber.Ctx) error {
\t\tcidStr := c.Params("member_id")
\t\tif cidStr == "" { cidStr = c.Query("member_id") }
\t\tif cidStr == "" { cidStr = c.Query("crew_id") }
\t\tif cidStr == "" { return c.Status(400).JSON(fiber.Map{"error":"no crew_id"}) }
\t\tcid,e:=uuid.Parse(cidStr)
\t\tif e!=nil { return c.Status(400).JSON(fiber.Map{"error":"bad id"}) }
\t\tsd:=c.Query("start_date"); ed:=c.Query("end_date")
\t\tif sd == "" && ed == "" {
\t\t\tnow := time.Now()
\t\t\tdefaultStart := now.AddDate(0, 0, -30)
\t\t\tsd = defaultStart.Format("2006-01-02")
\t\t\ted = now.Format("2006-01-02")
\t\t}
\t\tq:=h.DB.Model(&models.CrewAssignment{}).Where("crew_id=?",cid)
\t\tif sd!="" { if t,e:=time.Parse("2006-01-02",sd); e==nil { q=q.Where("created_at>=?",t) } }
\t\tif ed!="" { if t,e:=time.Parse("2006-01-02",ed); e==nil { t2:=t.Add(24*time.Hour); q=q.Where("created_at<?",t2) } }
\t\tvar list []models.CrewAssignment
\t\tq.Preload("Schedule").Preload("Booking").Preload("Crew").Order("created_at DESC").Find(&list)
\t\tvar cnt, cc, rc int64
\t\th.DB.Model(&models.CrewAssignment{}).Where("crew_id=?",cid).Count(&cnt)
\t\th.DB.Model(&models.CrewAssignment{}).Where("crew_id=? AND status=?",cid,models.AssignmentCompleted).Count(&cc)
\t\tvar all []models.CrewAssignment
\t\th.DB.Model(&models.CrewAssignment{}).Where("crew_id=?",cid).Find(&all)
\t\tfor _, x := range all { rc += int64(x.RejectCount) }
\t\treturn c.JSON(fiber.Map{"count":cnt,"completed_count":cc,"total_reject_count":rc,"assignments":list})
\t}
}'''

if old5 in content:
    content = content.replace(old5, new5)
    print("  GetCrewReview 替换成功")
else:
    print("  GetCrewReview 未找到匹配内容")

with open(os.path.join(base, 'handlers/assignments.go'), 'w') as f:
    f.write(content)

print("\n所有修改完成！")
